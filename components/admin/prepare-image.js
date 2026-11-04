export async function prepareImage(file,kind) {
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('صيغة الصورة غير مدعومة. اختر PNG أو JPG أو WebP.');
  if(file.size > 25000000) throw new Error('حجم الملف أكبر من 25 MB. اختر نسخة أصغر.');
  const url=URL.createObjectURL(file);
  try {
    const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('تعذر فتح الصورة. اختر ملف PNG أو JPG أو WebP صالحاً.'));img.src=url;});
    if(!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 40000000) throw new Error('الصورة كبيرة جداً. اختر نسخة أصغر.');
    const max=kind==='category' ? 512 : 1920;
    const scale=Math.min(1,max/image.naturalWidth,max/image.naturalHeight);
    const canvas=document.createElement('canvas');
    let format='image/webp';
    try {
      for(const reduction of [1,.8,.64,.512]) {
        canvas.width=Math.max(1,Math.round(image.naturalWidth*scale*reduction));
        canvas.height=Math.max(1,Math.round(image.naturalHeight*scale*reduction));
        const context=canvas.getContext('2d');
        if(!context) throw new Error('تعذرت معالجة الصورة على هذا الجهاز.');
        const draw=()=>{
          context.clearRect(0,0,canvas.width,canvas.height);
          if(format==='image/jpeg') {context.fillStyle='#FFFFFF';context.fillRect(0,0,canvas.width,canvas.height);}
          context.drawImage(image,0,0,canvas.width,canvas.height);
        };
        draw();
        for(const quality of [.85,.72,.6]) {
          let blob=await new Promise(resolve=>canvas.toBlob(resolve,format,quality));
          // Some browsers return PNG when WebP encoding is unavailable.
          // Keep category transparency; use JPEG for photos. The server writes WebP.
          if(format==='image/webp' && blob?.type==='image/png') {
            format=kind==='category' ? 'image/png' : 'image/jpeg';
            draw();
            blob=await new Promise(resolve=>canvas.toBlob(resolve,format,quality));
          }
          if(blob && blob.type===format && blob.size<=2000000) {
            const extension={'image/webp':'webp','image/png':'png','image/jpeg':'jpg'}[format];
            return new File([blob],`upload.${extension}`,{type:format});
          }
          if(!blob) throw new Error('تعذرت معالجة الصورة على هذا الجهاز. أعد المحاولة أو اختر نسخة أخرى.');
          if(format==='image/png') break; // PNG ignores the quality setting.
        }
      }
      throw new Error('تعذر ضغط الصورة إلى حجم الرفع المسموح (2 MB). اختر نسخة أصغر.');
    } finally {canvas.width=0;canvas.height=0;}
  } finally {URL.revokeObjectURL(url);}
}
