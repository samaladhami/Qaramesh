export function mediaUploadFailure(error) {
  const status=String(error?.statusCode || error?.status || '');
  const message=String(error?.message || '').toLowerCase();
  const cause=error?.originalError || error?.cause;
  const networkCode=cause?.cause?.code || cause?.code || '';
  if(message.includes('timeout') || error?.name==='TimeoutError' || cause?.name==='TimeoutError') return {code:'STORAGE_TIMEOUT',error:'انتهت مهلة الاتصال بتخزين الصور. حاول مجدداً بعد التحقق من الاتصال.'};
  if(message.includes('fetch failed') || message.includes('network') || error?.name==='StorageUnknownError') return {code:`STORAGE_NETWORK${networkCode ? `_${networkCode}` : ''}`,error:'تعذر اتصال الخادم بتخزين الصور. الصورة السابقة لم تتغير.'};
  if(message.includes('bucket') && (message.includes('not found') || status==='404')) return {code:'STORAGE_BUCKET_MISSING',error:'مجلد تخزين صور القائمة غير موجود. يجب التحقق من إعداد menu-media في Supabase.'};
  if(status==='403' || status==='401' || message.includes('row-level security') || message.includes('unauthorized')) return {code:'STORAGE_ACCESS_DENIED',error:'رفض التخزين صلاحية رفع الصورة. يجب التحقق من صلاحيات حساب الموظف وسياسة الرفع في Supabase.'};
  if(status==='413' || message.includes('maximum allowed size') || message.includes('exceeded the maximum')) return {code:'STORAGE_SIZE_LIMIT',error:'حد حجم الملف في التخزين لا يطابق إعداد الصور. يجب التحقق من إعداد menu-media في Supabase.'};
  if(status==='402' || message.includes('quota')) return {code:'STORAGE_QUOTA',error:'وصل تخزين الصور إلى حد الاستخدام. يجب مراجعة مساحة التخزين في Supabase.'};
  return {code:`STORAGE_${/^\d+$/.test(status) ? status : 'FAILED'}`,error:'تعذر رفع الصورة إلى التخزين. الصورة السابقة لم تتغير.'};
}
