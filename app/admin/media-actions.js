'use server';

import { randomUUID } from 'node:crypto';
import { createClient, getStaffUser } from '../../lib/supabase/server';
import { backendEnabled } from '../../lib/published-menu';
import { processMenuImage } from '../../lib/process-menu-image.mjs';
import { MEDIA_BUCKET } from '../../lib/media-path.mjs';

export async function uploadMenuImage(formData) {
  if(!backendEnabled() || !await getStaffUser()) return {error:'لا تملك صلاحية رفع الصور. سجّل الدخول مجدداً.'};
  if(!(formData instanceof FormData)) return {error:'يرجى اختيار صورة صالحة.'};
  const file=formData.get('image');
  const kind=formData.get('kind');
  if(!['dish','category','offer'].includes(kind) || !(file instanceof File) || !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 2000000) return {error:'اختر صورة PNG أو JPG أو WebP أصغر حجماً.'};
  let output;
  try {output=await processMenuImage(Buffer.from(await file.arrayBuffer()),kind);}
  catch {return {error:'تعذرت معالجة الصورة. اختر صورة ثابتة PNG أو JPG أو WebP أخرى.'};}
  try {
    const client=await createClient();
    const filename=`${randomUUID()}.webp`;
    const {error}=await client.storage.from(MEDIA_BUCKET).upload(filename,output,{contentType:'image/webp',cacheControl:'31536000',upsert:false});
    if(error) return {error:'تعذر رفع الصورة. تحقق من الاتصال وإعداد التخزين ثم حاول مرة أخرى.'};
    return {src:`/media/${filename}`};
  } catch {return {error:'تعذر الاتصال لرفع الصورة. لم تتغير الصورة السابقة.'};}
}
