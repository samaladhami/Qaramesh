export async function prepareImage(file,kind) {
  if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10000000) throw new Error('اختر صورة PNG أو JPG أو WebP بحجم أقل من 10 MB.');
  const url=URL.createObjectURL(file);
  try {
    const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=url;});
    if(!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 40000000) throw new Error('الصورة كبيرة جداً. اختر نسخة أصغر.');
    const max=kind==='category' ? 512 : 1920;
    const scale=Math.min(1,max/image.naturalWidth,max/image.naturalHeight);
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
    const context=canvas.getContext('2d');
    if(!context) throw new Error('تعذرت معالجة الصورة على هذا الجهاز.');
    context.drawImage(image,0,0,canvas.width,canvas.height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.85));
    if(!blob || blob.size > 2000000 || blob.type !== 'image/webp') throw new Error('تعذرت معالجة الصورة. جرّب صورة أصغر أو متصفحاً أحدث.');
    return new File([blob],'upload.webp',{type:'image/webp'});
  } finally {URL.revokeObjectURL(url);}
}
