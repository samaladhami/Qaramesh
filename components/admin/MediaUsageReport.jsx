'use client';

import { useState } from 'react';
import { readMediaUsage } from '../../app/admin/menu-actions';
import { withTimeout } from '../../lib/request-timeout.mjs';

const megabytes=bytes=>new Intl.NumberFormat('ar-IQ',{maximumFractionDigits:2}).format(bytes/1000000);

export default function MediaUsageReport() {
  const [usage,setUsage]=useState(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function refresh() {
    setBusy(true);setError('');
    try {
      const result=await withTimeout(readMediaUsage(),45000,'استغرق تحميل الاستخدام وقتاً طويلاً. حاول مجدداً.');
      if(result.error) setError(result.error); else setUsage(result.usage);
    } catch(error) {setError(error.message || 'تعذر تحميل استخدام الصور.');}
    finally {setBusy(false);}
  }
  return <details className="adm-media-report">
    <summary>استخدام مساحة الصور</summary>
    <p>يعرض مساحة صور القائمة المرفوعة فقط. الاستخدام الكامل والحدود والفوترة تظهر في لوحات الخدمات.</p>
    <button type="button" className="adm-button secondary full" disabled={busy} onClick={refresh}>{busy ? 'جارٍ تحميل الاستخدام…' : 'تحديث الاستخدام'}</button>
    {error && <p className="adm-error" role="alert">{error}</p>}
    {usage && <div aria-live="polite">
      <p>عدد الصور: {usage.imageCount} · المساحة المعروفة: <bdi>{megabytes(usage.totalBytes)} MB</bdi></p>
      <p>أكبر صورة: <bdi>{megabytes(usage.largestFileBytes)} MB</bdi></p>
      {usage.unknownSizeCount>0 && <p>حجم {usage.unknownSizeCount} صورة غير متوفر؛ المساحة المعروضة لا تشملها.</p>}
      <p>وقت الفحص: {new Intl.DateTimeFormat('ar-IQ',{dateStyle:'short',timeStyle:'short'}).format(new Date(usage.generatedAt))}</p>
    </div>}
    <div className="adm-usage-links"><a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">لوحة Supabase</a><a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">لوحة Vercel</a></div>
  </details>;
}
