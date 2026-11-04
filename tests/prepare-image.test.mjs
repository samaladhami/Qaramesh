import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../components/admin/prepare-image.js',import.meta.url),'utf8');
const {prepareImage}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('browser preparation supports PNG fallback from WebP encoders, transparent icons and adaptive compression',async()=>{
  const original={Image:globalThis.Image,document:globalThis.document};
  const calls=[];
  let oversized=false;
  const canvas={width:0,height:0,getContext:()=>({clearRect(){},fillRect(){},drawImage(){}}),toBlob(callback,type,quality){
    calls.push({type,quality,width:this.width,height:this.height});
    const actual=type==='image/webp' ? 'image/png' : type;
    callback(new Blob([new Uint8Array(oversized && (type==='image/png' || quality>.72) ? 2000001 : 100)],{type:actual}));
  }};
  globalThis.Image=class {naturalWidth=1290;naturalHeight=2796;set src(value){queueMicrotask(()=>this.onload());}};
  globalThis.document={createElement:()=>canvas};
  try {
    // A larger original is accepted and prepared before reaching the 2 MB server limit.
    const screenshot=new File([new Uint8Array(11000000)],'screenshot.png',{type:'image/png'});
    const photo=await prepareImage(screenshot,'offer');
    assert.equal(photo.type,'image/jpeg');assert.equal(photo.name,'upload.jpg');
    assert(calls.every(call=>call.height<=1920));
    const icon=await prepareImage(screenshot,'category');
    assert.equal(icon.type,'image/png');assert.equal(icon.name,'upload.png');
    assert.equal(canvas.width,0);assert.equal(canvas.height,0);
    oversized=true;calls.length=0;
    const compressed=await prepareImage(screenshot,'offer');
    assert(compressed.size<=2000000);
    assert(calls.some(call=>call.type==='image/jpeg' && call.quality===.72));
    await assert.rejects(prepareImage(new File(['x'],'photo.heic',{type:'image/heic'}),'offer'),/صيغة/);
    await assert.rejects(prepareImage(new File([new Uint8Array(25000001)],'large.png',{type:'image/png'}),'offer'),/25 MB/);
  } finally {globalThis.Image=original.Image;globalThis.document=original.document;}
});

test('stalled browser decoding and canvas encoding reject instead of leaving uploads busy',async context=>{
  context.mock.timers.enable({apis:['setTimeout']});
  const original={Image:globalThis.Image,document:globalThis.document};
  const input=new File(['image'],'screenshot.png',{type:'image/png'});
  const canvas={width:0,height:0,getContext:()=>({clearRect(){},drawImage(){}}),toBlob(){}};
  try {
    globalThis.Image=class {set src(value){}};
    const decoding=assert.rejects(prepareImage(input,'offer'),/استغرق فتح الصورة/);
    context.mock.timers.tick(20001);
    await decoding;
    globalThis.Image=class {naturalWidth=1290;naturalHeight=2796;set src(value){this.onload();}};
    globalThis.document={createElement:()=>canvas};
    const encoding=assert.rejects(prepareImage(input,'offer'),/توقفت معالجة الصورة/);
    await Promise.resolve();
    context.mock.timers.tick(15001);
    await encoding;
    assert.equal(canvas.width,0);assert.equal(canvas.height,0);
  } finally {globalThis.Image=original.Image;globalThis.document=original.document;context.mock.timers.reset();}
});
