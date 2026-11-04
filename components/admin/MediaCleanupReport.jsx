'use client';

import { useState } from 'react';
import { readMediaCleanupReport } from '../../app/admin/menu-actions';
import { withTimeout } from '../../lib/request-timeout.mjs';

export default function MediaCleanupReport() {
  const [report,setReport]=useState(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function inspect() {
    setBusy(true);setError('');
    try {
      const result=await withTimeout(readMediaCleanupReport(),45000,'استغرق فحص الصور وقتاً طويلاً. حاول مجدداً.');
      if(result.error) setError(result.error); else setReport(result.report);
    } catch(error) {setError(error.message || 'تعذر فحص الصور. حاول مجدداً.');}
    finally {setBusy(false);}
  }
  return <details className="adm-media-report">
    <summary>مراجعة الصور غير المستخدمة</summary>
    <p>تقرير فقط؛ لن تُحذف أي صورة. نحافظ على أيقونات الأقسام، والصور المستخدمة في المسودة وجميع النسخ المحفوظة، والملفات القديمة غير المصنّفة.</p>
    <button type="button" className="adm-button secondary full" disabled={busy} onClick={inspect}>{busy ? 'جارٍ فحص الصور…' : 'فحص الصور'}</button>
    {error && <p className="adm-error" role="alert">{error}</p>}
    {report && <div aria-live="polite">
      <p>إجمالي الصور: {report.totalCount} · المحمية: {report.protectedCount}</p>
      <p>صور محتملة للتنظيف: {report.candidateCount} · الحجم: {Math.round(report.candidateBytes/1024)} KB</p>
      <p>يعرض التقرير صور الأطباق والعروض غير المرتبطة بأي نسخة محفوظة، بعد مرور {report.minimumAgeDays} أيام على رفعها.</p>
      {report.candidates.length>0 ? <ul>{report.candidates.map(file=><li key={file.filename}><bdi>{file.filename}</bdi><span>{Math.round(file.bytes/1024)} KB</span></li>)}</ul> : <p>لا توجد صور مرشحة للتنظيف حالياً.</p>}
      {report.truncated && <p>تُعرض أقدم 200 صورة فقط؛ الإجمالي يشمل جميع النتائج.</p>}
      <p>النتيجة وقت الفحص فقط؛ يلزم فحص جديد قبل أي تنظيف مستقبلي.</p>
    </div>}
  </details>;
}
