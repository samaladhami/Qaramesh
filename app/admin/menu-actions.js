'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient, getStaffUser } from '../../lib/supabase/server';
import { backendEnabled, MENU_TAG } from '../../lib/published-menu';
import { validateMenu } from '../../lib/menu-validation.mjs';

async function staffClient() {
  if (!backendEnabled()) throw new Error('MENU_NOT_READY');
  if (!await getStaffUser()) throw new Error('STAFF_REQUIRED');
  return createClient();
}
function failure(error) {
  const message = error?.message || '';
  if (message.includes('VERSION_CONFLICT')) return { error:'عدّل موظف آخر القائمة. احتفظ بتعديلاتك ثم حمّل أحدث مسودة قبل المحاولة مجدداً.', conflict:true };
  if (message.includes('STAFF_REQUIRED') || error?.code === '42501') return { error:'لا تملك صلاحية الوصول. سجّل الدخول بحساب موظف مخوّل.' };
  if (message.includes('INVALID') || message.includes('DUPLICATE')) return { error:'تحقق من بيانات الأطباق والأقسام والصور قبل الحفظ.' };
  return { error:'تعذر الاتصال بالمسودة المشتركة. لم تُحذف تعديلاتك؛ حاول مرة أخرى.' };
}

export async function readSharedMenu() {
  try {
    const client = await staffClient();
    const { data, error } = await client.rpc('menu_admin_read');
    if (error) throw error;
    validateMenu(data.draft); validateMenu(data.baseline);
    return { state:data };
  } catch (error) { return failure(error); }
}
export async function saveSharedMenu(value, version) {
  try {
    validateMenu(value);
    if (!Number.isSafeInteger(version) || version < 1) throw new Error('INVALID_VERSION');
    const client = await staffClient();
    const { data, error } = await client.rpc('menu_save', { value, expected_version:version });
    if (error) throw error;
    return { state:data };
  } catch (error) { return failure(error); }
}
export async function publishSharedMenu(version) {
  let state;
  try {
    if (!Number.isSafeInteger(version) || version < 1) throw new Error('INVALID_VERSION');
    const client = await staffClient();
    const { data, error } = await client.rpc('menu_publish', { expected_version:version });
    if (error) throw error;
    state=data;
  } catch (error) { return failure(error); }
  // A cache invalidation error must never misreport a committed publication as a failed DB transaction.
  try {
    revalidateTag(MENU_TAG, { expire:0 });
    revalidatePath('/', 'layout');
  } catch { return { state, warning:'تم النشر. قد يستغرق تحديث القائمة العامة دقيقة واحدة.' }; }
  return { state };
}

export async function sharedMenuHistory() {
  try {
    const client=await staffClient();
    const {data,error}=await client.rpc('menu_history');
    if(error) throw error;
    return { revisions:data };
  } catch(error) { return failure(error); }
}

export async function readMediaCleanupReport() {
  try {
    const client=await staffClient();
    const {data,error}=await client.rpc('menu_media_cleanup_report');
    if(error?.code==='PGRST202' || error?.code==='42883') return {error:'يلزم تشغيل تحديث تقرير الصور (003) في Supabase أولاً.'};
    if(error) throw error;
    return {report:data};
  } catch(error) {return failure(error);}
}
export async function restoreSharedMenu(revision,version) {
  try {
    if(!Number.isSafeInteger(revision) || revision < 1 || !Number.isSafeInteger(version) || version < 1) throw new Error('INVALID_VERSION');
    const client=await staffClient();
    const {data,error}=await client.rpc('menu_restore',{revision_id:revision,expected_version:version});
    if(error) throw error;
    return {state:data};
  } catch(error) { return failure(error); }
}
