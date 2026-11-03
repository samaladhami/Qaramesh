import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {processMenuImage} from '../lib/process-menu-image.mjs';
import {mediaFilename,validMenuImage} from '../lib/media-path.mjs';

test('image paths accept only known local paths and immutable media filenames',()=>{
 const path='/media/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp';
 assert.equal(mediaFilename(path),'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp');assert(validMenuImage(path));
 for(const invalid of ['/media/../image.webp','/media/file.svg',path+'?token=x','https://example.com/image.webp','data:image/png;base64,AAAA',42])assert.equal(validMenuImage(invalid),false);
});
test('dish images are resized, converted to WebP and stripped of metadata',async()=>{
 const source=await sharp({create:{width:2400,height:1800,channels:3,background:'#429198'}}).jpeg().withMetadata().toBuffer();
 const result=await processMenuImage(source,'dish');const metadata=await sharp(result).metadata();
 assert.equal(metadata.format,'webp');assert.equal(metadata.width,1600);assert.equal(metadata.height,1200);assert.equal(metadata.exif,undefined);assert(result.length<200000);
});
test('category icons retain transparency and photos respect EXIF orientation',async()=>{
 const source=await sharp({create:{width:600,height:600,channels:4,background:{r:66,g:145,b:152,alpha:.5}}}).png().toBuffer();
 const icon=await sharp(await processMenuImage(source,'category')).metadata();assert.equal(icon.width,256);assert.equal(icon.height,256);assert.equal(icon.hasAlpha,true);
 const rotated=await sharp({create:{width:200,height:100,channels:3,background:'red'}}).jpeg().withMetadata({orientation:6}).toBuffer();
 const result=await sharp(await processMenuImage(rotated,'offer')).metadata();assert.equal(result.width,100);assert.equal(result.height,200);assert.equal(result.orientation,undefined);
});
test('malformed, unsupported and oversized images are rejected',async()=>{
 await assert.rejects(()=>processMenuImage(Buffer.from('not an image'),'dish'));
 await assert.rejects(()=>processMenuImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'),'category'));
 await assert.rejects(()=>processMenuImage(Buffer.alloc(2000001),'dish'));
 const image=await sharp({create:{width:8,height:8,channels:3,background:'red'}}).png().toBuffer();
 await assert.rejects(()=>processMenuImage(image,'unknown'));
});
