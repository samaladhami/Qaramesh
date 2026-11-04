'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import CategoryIcon, { categoryIconNames } from '../CategoryIcon';
import { readSharedMenu, saveSharedMenu, publishSharedMenu, sharedMenuHistory, restoreSharedMenu } from '../../app/admin/menu-actions';
import { uploadMenuImage } from '../../app/admin/media-actions';
import { prepareImage } from './prepare-image';
import { changedDishOrders, moveDish, restoreDishOrder } from '../../lib/dish-order.mjs';
import { withTimeout } from '../../lib/request-timeout.mjs';
import { moveToEdge } from '../../lib/list-order.mjs';
import MediaCleanupReport from './MediaCleanupReport';

const KEY = 'qaramesh-admin-prototype-v1';
const tabs = [['dishes', 'الأطباق', 'dish'], ['categories', 'الأقسام', 'layers'], ['offers', 'العروض', 'image'], ['publish', 'النشر', 'send']];
const money = value => new Intl.NumberFormat('en-US').format(value);

function Icon({ name, ...props }) {
  const paths = {
    dish: <><path d="M3 17h18M5 17a7 7 0 0 1 14 0M12 8V5M9 21h6" /></>,
    layers: <><path d="m12 3 10 5-10 5L2 8Zm-9 9 9 5 9-5M3 16l9 5 9-5" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="4"/><path d="m3 17 6-6 4 4 3-3 5 5"/><circle cx="16" cy="8" r="1"/></>,
    send: <path d="m3 10 18-7-7 18-4-7Zm7 4L21 3"/>,
    edit: <><path d="m4 16 12-12 4 4L8 20l-5 1ZM14 6l4 4"/></>,
    plus: <path d="M12 4v16M4 12h16"/>,
    close: <path d="m6 6 12 12M6 18 18 6"/>,
    search: <><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></>,
    back: <path d="m9 4 8 8-8 8"/>,
    trash: <><path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/></>,
    save: <><path d="M4 3h13l4 4v14H3V3ZM7 3v6h10V3M7 21v-8h10v8"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    refresh: <><path d="M3 11a9 9 0 0 1 15.36-6.36L21 7M21 3v4h-4"/><path d="M21 13a9 9 0 0 1-15.36 6.36L3 17M3 21v-4h4"/></>,
    logout: <><path d="M9 4H4v16h5M14 8l4 4-4 4M8 12h10"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
    up: <path d="m6 14 6-6 6 6"/>,
    down: <path d="m6 10 6 6 6-6"/>,
    top: <><path d="m6 11 6-6 6 6"/><path d="m6 18 6-6 6 6"/></>,
    bottom: <><path d="m6 6 6 6 6-6"/><path d="m6 13 6 6 6-6"/></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  };
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.dish}</svg>;
}

function TimedNotice({ notice, onDismiss }) {
  useEffect(() => {
    const timer=setTimeout(() => onDismiss(notice.id),5000);
    return () => clearTimeout(timer);
  },[notice.id,onDismiss]);
  return <div className={`adm-toast ${notice.kind === 'success' ? 'is-success' : 'is-warning'}`} role="status" aria-atomic="true"><Icon name={notice.kind === 'success' ? 'check' : 'info'}/><span>{notice.message}</span><button type="button" className="adm-icon-button" aria-label="إخفاء الإشعار" onClick={() => onDismiss(notice.id)}><Icon name="close" width="18" height="18"/></button></div>;
}

function Dialog({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.showModal(); }, []);
  return <dialog ref={ref} className="adm-dialog" aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="adm-dialog-heading"><h2>{title}</h2><button type="button" className="adm-icon-button" aria-label="إغلاق" onClick={onClose}><Icon name="close"/></button></div>{children}
  </dialog>;
}

function Upload({ label, onChange, shared = false, kind = 'dish', onBusy, disabled = false }) {
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [stage,setStage]=useState('');
  async function read(event) {
    const input=event.target;
    const file = input.files[0];
    if (!file) return;
    setError(''); setUploading(true); setStage('جارٍ تجهيز الصورة…'); onBusy?.(true);
    try {
      const prepared=await prepareImage(file,kind);
      if(shared) {
        const formData=new FormData(); formData.set('image',prepared); formData.set('kind',kind);
        setStage('جارٍ رفع الصورة…');
        const result=await withTimeout(uploadMenuImage(formData),60000,'استغرق رفع الصورة وقتاً طويلاً. تحقق من الاتصال وحاول مجدداً. لم تتغير الصورة السابقة.');
        if(result.error) throw new Error(result.error);
        setStage('جارٍ حفظ الصورة في المسودة…');
        await onChange(result.src);
      } else {
        const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(prepared);});
        await onChange(src);
      }
    } catch(error) { setError(error instanceof Error && error.message ? error.message : 'تعذر رفع الصورة. جرّب صورة أخرى.'); }
    finally {input.value='';setUploading(false);setStage('');onBusy?.(false);}
  }
  return <div className="adm-upload"><label><Icon name="image"/>{uploading ? stage : label}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={read} disabled={uploading || disabled} aria-label={label}/></label>{disabled && <p className="adm-muted">رفع الصور غير متاح حالياً.</p>}{uploading && <span role="status" className="sr-only">{stage}</span>}{error && <p role="alert" className="adm-error">{error}</p>}</div>;
}

function differences(base, draft) {
  const changes = [];
  for (const item of draft.items) {
    const old = base.items.find(value => value.id === item.id);
    if (!old) changes.push({ id: item.id, title: item.name, detail: 'طبق جديد', type: 'new' });
    else {
      const fields = [];
      if (old.name !== item.name) fields.push('الاسم');
      if (old.price !== item.price) fields.push(`السعر: ${money(old.price)} ← ${money(item.price)} IQD`);
      if (old.category !== item.category) fields.push(`القسم: ${old.category} ← ${item.category}`);
      if (old.available !== item.available) fields.push(item.available ? 'متوفر الآن' : 'غير متوفر');
      if (['description', 'shortDescription', 'size', 'addOn', 'image'].some(key => old[key] !== item[key])) fields.push('تفاصيل الطبق');
      if (fields.length) changes.push({ id: item.id, title: item.name, detail: fields.join('، '), type: 'edit' });
    }
  }
  for (const item of base.items) if (!draft.items.some(value => value.id === item.id)) changes.push({ id: item.id, title: item.name, detail: 'حذف طبق', type: 'delete' });
  if (JSON.stringify(base.categories) !== JSON.stringify(draft.categories)) changes.push({ id: 'categories', title: 'الأقسام', detail: 'تعديل الأقسام أو الأيقونات أو ترتيب العرض', type: 'edit' });
  if (JSON.stringify(base.slides) !== JSON.stringify(draft.slides)) changes.push({ id: 'slides', title: 'العروض', detail: 'تعديل صور العروض أو ترتيبها', type: 'edit' });
  for(const category of changedDishOrders(base,draft)) changes.push({id:`dish-order:${category.id}`,categoryId:category.id,title:`ترتيب أطباق ${category.name}`,detail:'تغيير ترتيب الأطباق داخل القسم',type:'edit'});
  return changes;
}

export default function AdminDashboard({ initialMenu, initialSlides, staffId, logoutAction, shared = false, mediaReady = false }) {
  const storageKey = `${KEY}:${staffId}`;
  const seed = { items: initialMenu.items, categories: initialMenu.categories.map((name, index) => ({ id: `category-${index}`, name, icon: name })), slides: initialSlides };
  const [draft, setDraft] = useState(seed);
  const [baseline, setBaseline] = useState(seed);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [tab, setTab] = useState('dishes');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [editor, setEditor] = useState(null);
  const [original, setOriginal] = useState(null);
  const [modal, setModal] = useState(null);
  const [notices, setNotices] = useState([]);
  const noticeSequence=useRef(0);
  function setNotice(message, kind = 'warning') {
    if (!message) return;
    const id=++noticeSequence.current;
    setNotices(current=>[...current,{id,message,kind}]);
  }
  const dismissNotice=useCallback(id=>setNotices(current=>current.filter(notice=>notice.id!==id)),[]);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const uploadRef=useRef(false);
  function uploadBusy(value) {uploadRef.current=value;setUploading(value);}
  const [remoteError, setRemoteError] = useState(null);
  const [publishedAt, setPublishedAt] = useState(null);
  const [publishedId, setPublishedId] = useState(null);
  const [history, setHistory] = useState(null);
  const versionRef = useRef(null);
  const workingRef = useRef(false);
  const headerRef = useRef(null);
  const toastRef = useRef(null);
  const changes = differences(baseline, draft);

  useEffect(() => {
    if (!notices.length) return;
    const position = () => {
      if (headerRef.current && toastRef.current) toastRef.current.style.top = `${Math.max(0,headerRef.current.getBoundingClientRect().bottom) + 8}px`;
    };
    position();
    const observer = new ResizeObserver(position);
    if (headerRef.current) observer.observe(headerRef.current);
    window.addEventListener('scroll',position,{passive:true});
    window.addEventListener('resize',position);
    return () => { observer.disconnect(); window.removeEventListener('scroll',position); window.removeEventListener('resize',position); };
  },[notices.length]);

  function applyShared(state) {
    setDraft(state.draft); setBaseline(state.baseline); versionRef.current=state.version; setPublishedAt(state.publishedAt); setPublishedId(state.publishedId); setReady(true);
  }
  async function refreshShared(discard = false) {
    if (discard && !window.confirm('تحميل أحدث مسودة سيستبدل تعديلات هذه الصفحة. هل تريد المتابعة؟')) return;
    if (workingRef.current) return;
    workingRef.current=true; setBusy(true);
    try {
      const result=await readSharedMenu();
      if (result.error) setRemoteError(result);
      else { applyShared(result.state); setRemoteError(null); }
    } catch { setRemoteError({error:'تعذر تحميل المسودة المشتركة. حاول مرة أخرى.'}); }
    finally { workingRef.current=false; setBusy(false); }
  }
  async function persistShared(next) {
    if (workingRef.current) return;
    workingRef.current=true; setBusy(true); setRemoteError(null);
    try {
      const result=await withTimeout(saveSharedMenu(next,versionRef.current),60000,'DRAFT_SAVE_TIMEOUT');
      if (result.error) setRemoteError(result);
      else { applyShared(result.state); setNotice('تم حفظ المسودة المشتركة','success'); }
    } catch { setRemoteError({error:'تعذر حفظ المسودة. تعديلاتك باقية هنا؛ حاول مرة أخرى.'}); }
    finally { workingRef.current=false; setBusy(false); }
  }
  async function publish() {
    if (workingRef.current || remoteError || !ready) return;
    workingRef.current=true; setBusy(true);
    try {
      const result=await publishSharedMenu(versionRef.current);
      if (result.error) setRemoteError(result);
      else { applyShared(result.state); setHistory(null); setNotice(result.warning || 'تم النشر بنجاح. القائمة العامة محدّثة.',result.warning ? 'warning' : 'success'); }
    } catch { setRemoteError({error:'تعذر تأكيد النشر. حمّل أحدث مسودة للتحقق من حالة النشر قبل إعادة المحاولة.'}); }
    finally { workingRef.current=false; setBusy(false); }
  }
  async function loadHistory() {
    if (history) { setHistory(null); return; }
    try {
      const result=await sharedMenuHistory();
      if(result.error) setNotice(result.error); else setHistory(result.revisions);
    } catch { setNotice('تعذر تحميل سجل النشر. حاول مرة أخرى.'); }
  }
  async function restoreRevision(revision) {
    if(workingRef.current || !window.confirm('استعادة هذه النسخة ستستبدل المسودة المشتركة الحالية. ستحتاج نشرها لتظهر للعملاء. هل تريد المتابعة؟')) return;
    workingRef.current=true; setBusy(true);
    try {
      const result=await restoreSharedMenu(revision,versionRef.current);
      if(result.error) setRemoteError(result); else {
        applyShared(result.state);
        setNotice(differences(result.state.baseline,result.state.draft).length ? `تمت استعادة النسخة ${revision} كمسودة. راجع التغييرات ثم انشرها لتظهر للعملاء.` : `تمت استعادة النسخة ${revision}. المسودة تطابق القائمة المنشورة، ولا توجد تغييرات للنشر.`,'success');
      }
    } catch { setRemoteError({error:'تعذرت استعادة النسخة. حمّل أحدث مسودة للتحقق.'}); }
    finally {workingRef.current=false;setBusy(false);}
  }
  function exportRecovery() {
    const url=URL.createObjectURL(new Blob([JSON.stringify(draft,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='qaramesh-draft-recovery.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  useEffect(() => {
    const dirty = (editor && JSON.stringify(editor) !== JSON.stringify(original)) || busy || remoteError || uploading;
    if (!dirty) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [editor, original, busy, remoteError, uploading]);

  useEffect(() => {
    if (shared) { refreshShared(); return; }
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (stored && Array.isArray(stored.items) && Array.isArray(stored.categories) && stored.categories.every(value => value && typeof value.name === 'string') && Array.isArray(stored.slides) && stored.items.every(value => value && typeof value.id === 'string' && typeof value.name === 'string' && typeof value.category === 'string' && Number.isFinite(value.price))) setDraft(stored);
    } catch { setStorageError('تعذر استعادة المسودة المحلية. يمكنك العمل في هذه الجلسة.'); }
    setReady(true);
  }, [storageKey, shared]);

  useEffect(() => {
    if (!ready || shared) return;
    try { localStorage.setItem(storageKey, JSON.stringify(draft)); setStorageError(''); }
    catch { setStorageError('تعذر حفظ المسودة على هذا الجهاز. احتفظ بالصفحة مفتوحة؛ قد تكون مساحة التخزين ممتلئة.'); }
  }, [draft, ready, storageKey, shared]);

  useEffect(() => {
    if (!shared || !ready || busy || uploading || remoteError || editor || modal) return;
    let cancelled=false;
    const timer=setInterval(async () => {
      if (document.hidden || workingRef.current || uploadRef.current) return;
      try {
        const result=await readSharedMenu();
        if (!cancelled && !workingRef.current && result.state && result.state.version > versionRef.current) { applyShared(result.state); setNotice('تم تحديث المسودة من الفريق'); }
      } catch { /* A failed background read must not discard the displayed draft. */ }
    },20000);
    return () => { cancelled=true; clearInterval(timer); };
  },[shared,ready,busy,uploading,remoteError,editor,modal]);

  function update(next) { if (shared && (workingRef.current || remoteError)) return; setDraft(next); setNotice(shared ? 'جارٍ حفظ المسودة…' : 'تم تحديث المسودة'); if(shared) return persistShared(next); }
  function undoChange(change) {
    if(change.categoryId) {
      const category=draft.categories.find(value=>value.id===change.categoryId);
      if(category) update({...draft,items:restoreDishOrder(baseline,draft.items,category)});
    } else if (change.id === 'slides') {
      update({ ...draft, slides: baseline.slides });
    } else if (change.id === 'categories') {
      const restoredItems = draft.items.map(item => {
        const current = draft.categories.find(cat => cat.name === item.category);
        const previous = baseline.categories.find(cat => cat.id === current?.id);
        return previous ? { ...item, category: previous.name } : item;
      });
      const addedInUse = draft.categories.filter(cat => !baseline.categories.some(old => old.id === cat.id) && restoredItems.some(item => item.category === cat.name));
      if (addedInUse.length) {
        setNotice('انقل الأطباق من الأقسام الجديدة أو تراجع عن إضافتها أولاً، ثم تراجع عن تغييرات الأقسام.');
        return;
      }
      update({ ...draft, categories: baseline.categories, items: restoredItems });
      setCategory('');
    } else {
      const previous = baseline.items.find(item => item.id === change.id);
      let items = draft.items.filter(item => item.id !== change.id);
      let categories = draft.categories;
      if (previous) {
        const previousCategory = baseline.categories.find(cat => cat.name === previous.category);
        const currentCategory = draft.categories.find(cat => cat.id === previousCategory?.id);
        const restored = { ...previous, category: currentCategory?.name || previous.category };
        if (!categories.some(cat => cat.name === restored.category) && previousCategory) categories = [...categories, previousCategory];
        const currentIndex = draft.items.findIndex(item => item.id === change.id);
        const baselineIndex = baseline.items.findIndex(item => item.id === change.id);
        const following = baseline.items.slice(baselineIndex + 1).find(item => items.some(value => value.id === item.id));
        const insertAt = currentIndex >= 0 ? currentIndex : following ? items.findIndex(item => item.id === following.id) : items.length;
        items.splice(insertAt, 0, restored);
      }
      update({ ...draft, categories, items });
    }
    setNotice(`تم التراجع عن تغيير «${change.title}»`);
  }
  function allowNavigation() {
    if(uploadRef.current) {setNotice('انتظر اكتمال رفع الصورة قبل الانتقال.');return false;}
    if (editor && JSON.stringify(editor) !== JSON.stringify(original)) {
      setNotice('احفظ التعديل أو ألغِه قبل الانتقال.');
      requestAnimationFrame(()=>document.querySelector('[data-active-edit]')?.scrollIntoView({block:'center',behavior:'smooth'}));
      return false;
    }
    return true;
  }
  function openEditor(type, value) { if(!allowNavigation()) return; const next = { type, ...value }; setOriginal(next); setEditor(next); }
  function closeEditor() { setEditor(null); }
  function navigate(next) { if(!allowNavigation()) return; setEditor(null); setPreview(false); setTab(next); window.scrollTo(0, 0); }
  function filterCategory(value) { if(value !== category && !allowNavigation()) return; setCategory(value); }
  function filterQuery(value) { if(value !== query && !allowNavigation()) return; setQuery(value); }
  function headerBack() { if(!allowNavigation()) return; if(editor) closeEditor(); else if(preview) setPreview(false); else window.location.assign('/'); }
  function move(key, index, delta) { const values = [...draft[key]]; [values[index], values[index + delta]] = [values[index + delta], values[index]]; update({ ...draft, [key]: values }); }
  function reorderDish(item,delta) {
    if(query.trim() || !allowNavigation()) return;
    if(delta==='top' || delta==='bottom') {setModal({type:'moveDish',value:item,direction:delta});return;}
    const items=moveDish(draft.items,item.id,delta);
    if(items!==draft.items) update({...draft,items});
  }
  function removeCategory(value) {
    if (draft.items.some(item => item.category === value.name)) setModal({ type: 'blocked', value });
    else setModal({ type: 'deleteCategory', value });
  }
  function saveEditor(event) {
    event.preventDefault();
    const { type, ...value } = editor;
    value.name = value.name?.trim();
    if (type === 'dish') {
      if (!value.name || !draft.categories.some(cat => cat.name === value.category) || !Number.isSafeInteger(Number(value.price)) || Number(value.price) < 0) return;
      value.price = Number(value.price);
      const exists = draft.items.some(item => item.id === value.id);
      update({ ...draft, items: exists ? draft.items.map(item => item.id === value.id ? value : item) : [...draft.items, value] });
    } else {
      if (!value.name) return;
      if (draft.categories.some(cat => cat.id !== value.id && cat.name === value.name)) { setNotice('يوجد قسم بهذا الاسم بالفعل'); return; }
      const old = draft.categories.find(cat => cat.id === value.id);
      update({ ...draft, categories: old ? draft.categories.map(cat => cat.id === value.id ? value : cat) : [...draft.categories, value], items: old ? draft.items.map(item => item.category === old.name ? { ...item, category: value.name } : item) : draft.items });
      if (category === old?.name) setCategory(value.name);
    }
    setEditor(null);
  }
  const title = preview ? 'معاينة المسودة' : editor ? (editor.type === 'dish' ? 'تعديل الطبق' : 'تعديل القسم') : ({ dishes: 'إدارة القائمة', categories: 'الأقسام', offers: 'العروض', publish: 'مراجعة التغييرات' }[tab]);
  const filtered = draft.items.filter(item => (!category || item.category === category) && item.name.includes(query.trim()));
  function reorderButtons(key, index, length) { return <div className={`adm-reorder${key==='slides' ? ' adm-reorder-offers' : ''}`}><button type="button" className="adm-icon-button" aria-label="نقل لأعلى" disabled={!index} onClick={() => move(key, index, -1)}><Icon name="up"/></button><button type="button" className="adm-icon-button" aria-label="نقل لأسفل" disabled={index === length - 1} onClick={() => move(key, index, 1)}><Icon name="down"/></button>{key==='slides' && <><button type="button" className="adm-icon-button" aria-label={`نقل الصورة ${index+1} إلى أول العروض`} title="نقل إلى أول العروض" disabled={!index} onClick={()=>setModal({type:'moveSlide',value:draft.slides[index],direction:'top'})}><Icon name="top"/></button><button type="button" className="adm-icon-button" aria-label={`نقل الصورة ${index+1} إلى آخر العروض`} title="نقل إلى آخر العروض" disabled={index===length-1} onClick={()=>setModal({type:'moveSlide',value:draft.slides[index],direction:'bottom'})}><Icon name="bottom"/></button></>}</div>; }

  return <div className="adm-root">
    <aside className="adm-desktop-brand"><span>QARAMESH</span><p>مساحة إدارة قائمتك</p><small>من أول طبق، إلى آخر تفصيلة.</small></aside>
    <div className="adm-shell">
      <header ref={headerRef} className="adm-header"><button className="adm-icon-button" aria-label={editor || preview ? 'رجوع' : 'القائمة العامة'} onClick={headerBack}><Icon name="back"/></button><h1>{title}</h1><img className="adm-header-logo" src="/logo-badge.webp" alt="قراميش" width="48" height="48"/></header>
      <div className="adm-prototype">{shared ? 'مسودة مشتركة للفريق · لا تظهر التعديلات للعملاء إلا بعد النشر.' : 'نسخة تجريبية · التعديلات محفوظة على هذا الجهاز فقط ولا تغيّر القائمة العامة.'}</div>
      <div className="adm-toolbar">
        <form action={logoutAction} className="adm-logout" onSubmit={event=>{if(!allowNavigation()) event.preventDefault();}}><button type="submit"><Icon name="logout" width="18" height="18"/>تسجيل الخروج</button></form>
        {shared && <button className="adm-icon-button" aria-label="تحديث المسودة" title="تحديث المسودة" aria-busy={busy} disabled={busy || uploading || Boolean(editor)} onClick={() => refreshShared(Boolean(remoteError))}><Icon name="refresh"/></button>}
      </div>
      <main className="adm-main">
        {remoteError && <div role="alert" className="adm-error"><p>{remoteError.error}</p><div className="adm-actions">{ready && !remoteError.conflict && <button className="adm-button" disabled={busy} onClick={() => persistShared(draft)}>إعادة الحفظ</button>}<button className="adm-button secondary" disabled={busy} onClick={() => refreshShared(ready)}>تحميل أحدث مسودة</button>{ready && <button className="adm-button secondary" onClick={exportRecovery}>حفظ نسخة من تعديلاتي</button>}</div></div>}
        <fieldset className="adm-workspace" disabled={uploading || (shared && (busy || Boolean(remoteError)))}>
        {!ready ? <p role="status">جارٍ تحميل المسودة…</p> : <>
        {storageError && <p role="alert" className="adm-error">{storageError}</p>}
        {editor ? <form onSubmit={saveEditor} className="adm-editor" data-active-edit>
          {editor.type === 'dish' ? <>
            <div className="adm-editor-photo">{editor.image ? <img src={editor.image} alt={editor.name || 'صورة الطبق'}/> : <Icon name="dish" width="70" height="70"/>}<Upload disabled={shared && !mediaReady} shared={shared} kind="dish" onBusy={uploadBusy} label="تغيير الصورة" onChange={image => setEditor(current=>current ? { ...current, image } : current)}/></div>
            <label>اسم الطبق <b>*</b><input required maxLength={120} value={editor.name} onChange={e => setEditor({ ...editor, name: e.target.value })}/></label>
            <label>السعر <b>*</b><div className="adm-price-input"><input aria-label="السعر" dir="ltr" type="number" required min="0" max="999999999" step="1" value={editor.price} onChange={e => setEditor({ ...editor, price: e.target.value })}/><span>IQD</span></div></label>
            <label>القسم <b>*</b><select required value={editor.category} onChange={e => setEditor({ ...editor, category: e.target.value })}>{draft.categories.map(cat => <option key={cat.id}>{cat.name}</option>)}</select></label>
            <label>الحجم<input maxLength={100} value={editor.size} onChange={e => setEditor({ ...editor, size: e.target.value })}/></label>
            <label>الوصف المختصر<input maxLength={240} value={editor.shortDescription} onChange={e => setEditor({ ...editor, shortDescription: e.target.value })}/></label>
            <label>الوصف<textarea rows="3" maxLength={3000} value={editor.description} onChange={e => setEditor({ ...editor, description: e.target.value })}/></label>
            <label>الإضافات<input maxLength={300} value={editor.addOn} onChange={e => setEditor({ ...editor, addOn: e.target.value })}/></label>
            <label className="adm-availability">متوفر<input type="checkbox" role="switch" checked={editor.available} onChange={e => setEditor({ ...editor, available: e.target.checked })}/></label>
          </> : <>
            <label>اسم القسم <b>*</b><input required maxLength={100} value={editor.name} onChange={e => setEditor({ ...editor, name: e.target.value })}/></label>
            <fieldset><legend>أيقونة القسم</legend><div className="adm-icon-grid">{[...new Set([...initialMenu.categories,...categoryIconNames])].map(name => <button type="button" key={name} className={editor.icon === name && !editor.image ? 'selected' : ''} aria-label={name} aria-pressed={editor.icon === name && !editor.image} onClick={() => setEditor({ ...editor, icon: name, image: '' })}><CategoryIcon name={name}/></button>)}</div></fieldset>
          </>}
          <div className="adm-actions"><button type="submit" className="adm-button"><Icon name="save"/>حفظ المسودة</button><button type="button" className="adm-button secondary" onClick={closeEditor}>إلغاء</button></div>
        </form> : preview ? <section className="adm-preview">
          <div className="adm-section-heading"><h2>قائمتك كما ستظهر</h2><span className="adm-pill">معاينة محلية</span></div>
          {draft.slides[0] && <img className="adm-preview-hero" src={draft.slides[0].src} alt={draft.slides[0].alt}/>}
          {draft.categories.map(cat => { const items = draft.items.filter(item => item.category === cat.name); return items.length > 0 && <section key={cat.id}><h3>{cat.name}</h3>{items.map(item => <article className={`adm-preview-item ${!item.available ? 'unavailable' : ''}`} key={item.id}>{item.image && <img src={item.image} alt=""/>}<div><h4>{item.name}</h4><p>{item.shortDescription}</p>{!item.available && <small>غير متوفر</small>}</div><strong>{money(item.price)} <small>IQD</small></strong></article>)}</section>; })}
        </section> : tab === 'dishes' ? <>
          <div className="adm-section-heading"><div><span className="adm-eyebrow">قائمة قراميش</span><h2>كل طبق، بأحلى صورة.</h2></div><span className="adm-count">{draft.items.length}<small>طبق</small></span></div>
          <div className="adm-filters" aria-label="تصفية الأقسام"><button className={!category ? 'selected' : ''} onClick={() => filterCategory('')}>الكل</button>{draft.categories.map(cat => <button key={cat.id} className={category === cat.name ? 'selected' : ''} onClick={() => filterCategory(cat.name)}>{cat.name}</button>)}</div>
          <div className="adm-search"><input aria-label="ابحث عن طبق" placeholder="ابحث عن طبق…" value={query} onChange={e => filterQuery(e.target.value)}/><Icon name="search"/></div>
          <button className="adm-button full" disabled={!draft.categories.length} onClick={() => openEditor('dish', { id: crypto.randomUUID(), name: '', price: '', category: category || draft.categories[0]?.name, size: '', description: '', shortDescription: '', addOn: '', image: '', available: true })}><Icon name="plus"/>إضافة طبق</button>
          {!draft.categories.length && <p>أضف قسماً أولاً من شاشة الأقسام.</p>}
          <p className="adm-order-hint">{query.trim() ? 'امسح البحث لتغيير ترتيب الأطباق داخل القسم.' : 'استخدم الأسهم أسفل كل طبق لترتيبه داخل قسمه. يظهر الترتيب للعملاء بعد النشر.'}</p>
          <div className="adm-list">{filtered.map(item => <article className="adm-dish-row" key={item.id}>
            <button className="adm-dish-open" aria-label={`تعديل ${item.name}`} onClick={() => openEditor('dish', item)}>{item.image ? <img src={item.image} alt=""/> : <Icon name="dish"/>}</button>
            <button className="adm-dish-text" onClick={() => openEditor('dish',item)} aria-label={`تعديل ${item.name}`}><strong>{item.name}</strong><span>{money(item.price)} <small>IQD</small></span></button>
            <button className="adm-icon-button adm-dish-edit" aria-label={`تحرير تفاصيل ${item.name}`} onClick={() => openEditor('dish', item)}><Icon name="edit" width="24" height="24"/></button>
            <button role="switch" aria-checked={item.available} aria-label={`توفر ${item.name}`} className={`adm-switch ${item.available ? 'on' : ''}`} onClick={() => { if(allowNavigation()) update({ ...draft, items: draft.items.map(value => value.id === item.id ? { ...value, available: !value.available } : value) }); }}><span/></button>
            <button className="adm-icon-button adm-danger" aria-label={`حذف ${item.name}`} onClick={() => { if(allowNavigation()) setModal({ type: 'deleteDish', value: item }); }}><Icon name="trash" width="18"/></button>
            <div className="adm-dish-order"><span>ترتيب الطبق داخل {item.category}</span><div className="adm-dish-order-controls">{[
              {action:-1,icon:'up',label:'لأعلى',first:true},
              {action:1,icon:'down',label:'لأسفل',first:false},
              {action:'top',icon:'top',label:'إلى أول القسم',first:true},
              {action:'bottom',icon:'bottom',label:'إلى آخر القسم',first:false},
            ].map(control=><button key={control.icon} type="button" className="adm-icon-button" aria-label={`نقل ${item.name} ${control.label}`} title={control.label} disabled={Boolean(query.trim()) || (control.first ? draft.items.find(value=>value.category===item.category) : draft.items.findLast(value=>value.category===item.category))?.id===item.id} onClick={()=>reorderDish(item,control.action)}><Icon name={control.icon} width="18"/></button>)}</div></div>
          </article>)}</div>
          {!filtered.length && <div className="adm-empty"><Icon name="search" width="38" height="38"/><h3>لا توجد أطباق</h3><p>جرّب اسماً آخر أو اختر قسماً مختلفاً.</p></div>}
        </> : tab === 'categories' ? <>
          <div className="adm-section-heading"><div><span className="adm-eyebrow">تنظيم القائمة</span><h2>لكل نكهة، مكان.</h2></div><span className="adm-count">{draft.categories.length}<small>قسم</small></span></div>
          <button className="adm-button full" onClick={() => openEditor('category', { id: crypto.randomUUID(), name: '', icon: initialMenu.categories[0], image: '' })}><Icon name="plus"/>إضافة قسم</button>
          <div className="adm-list">{draft.categories.map((cat, index) => <article className="adm-category-row" key={cat.id}>{reorderButtons('categories', index, draft.categories.length)}<div className="adm-category-info"><strong>{cat.name}</strong><span>{draft.items.filter(item => item.category === cat.name).length} طبق</span></div><div className="adm-category-art">{cat.image ? <img src={cat.image} alt=""/> : <CategoryIcon name={cat.icon}/>}</div><button className="adm-icon-button" aria-label={`تعديل ${cat.name}`} onClick={() => openEditor('category', cat)}><Icon name="edit"/></button><button className="adm-icon-button adm-danger" aria-label={`حذف ${cat.name}`} onClick={() => removeCategory(cat)}><Icon name="trash" width="18"/></button></article>)}</div>
          {!draft.categories.length && <p className="adm-empty">أضف القسم الأول لتنظيم أطباقك.</p>}
        </> : tab === 'offers' ? <>
          <div className="adm-section-heading"><div><span className="adm-eyebrow">واجهة مطعمك</span><h2>صور تفتح الشهية.</h2></div><span className="adm-count">{draft.slides.length}<small>صورة</small></span></div>
          <p className="adm-muted">رتّب صور العروض وغيّرها قبل النشر.</p>
          {draft.slides.map((slide, index) => <article className="adm-offer" key={slide.id}><img src={slide.src} alt={slide.alt}/><div className="adm-offer-controls">{reorderButtons('slides', index, draft.slides.length)}<Upload disabled={shared && !mediaReady} shared={shared} kind="offer" onBusy={uploadBusy} label="تغيير الصورة" onChange={src=>update({...draft,slides:draft.slides.map(value=>value.id===slide.id?{...value,src}:value)})}/><button className="adm-icon-button adm-danger" aria-label={`حذف الصورة ${index + 1}`} onClick={() => setModal({ type: 'deleteSlide', value: slide })}><Icon name="trash"/></button></div></article>)}
          <Upload disabled={shared && !mediaReady} shared={shared} kind="offer" onBusy={uploadBusy} label="إضافة صورة" onChange={src => update({ ...draft, slides: [...draft.slides, { id: crypto.randomUUID(), src, alt: 'عرض جديد من قراميش' }] })}/>
          {!draft.slides.length && <p className="adm-empty">أضف صورة العرض الأولى.</p>}
        </> : <>
          <div className="adm-section-heading"><div><span className="adm-eyebrow">جاهزة للمراجعة</span><h2>لمسة أخيرة، قبل النشر.</h2></div><Icon name="send" width="34" height="34"/></div>
          <p className="adm-info">{shared ? 'كل التغييرات هنا محفوظة كمسودة مشتركة. راجعها ثم انشرها لتظهر في القائمة العامة.' : 'كل التغييرات هنا مسودة محلية. النشر الفعلي يحتاج ربط حسابات الموظفين وقاعدة البيانات.'}</p>
          {shared && publishedAt && <p className="adm-muted">آخر نشر: {new Intl.DateTimeFormat('ar-IQ',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Baghdad'}).format(new Date(publishedAt))}</p>}
          <h3>التغييرات المعلقة ({changes.length})</h3>
          {changes.map(change => <article className="adm-change" key={change.id}><span className={`adm-change-icon ${change.type}`}><Icon name={change.type === 'delete' ? 'trash' : change.type === 'new' ? 'plus' : 'edit'}/></span><div className="adm-change-text"><strong>{change.title}</strong><p>{change.detail}</p></div><button className="adm-icon-button adm-danger" aria-label={`التراجع عن تغيير ${change.title}`} title="التراجع عن التغيير" onClick={() => undoChange(change)}><Icon name="close"/></button></article>)}
          {!changes.length && <div className="adm-empty"><Icon name="check" width="40" height="40"/><h3>كل شيء محدّث</h3><p>ستظهر تعديلاتك هنا لتراجعها.</p></div>}
          <div className="adm-actions"><button className="adm-button" disabled={!changes.length || busy} onClick={() => setModal({ type: 'publish' })}><Icon name="send"/>{shared ? 'نشر التغييرات' : 'تجربة النشر محلياً'}</button><button className="adm-button secondary" onClick={() => shared ? window.open('/admin/preview','_blank','noopener,noreferrer') : setPreview(true)}><Icon name="eye"/>معاينة</button></div>
          {shared && <MediaCleanupReport/>}
          {shared && <div className="adm-history">
            <button className="adm-button secondary full" onClick={loadHistory} aria-expanded={Boolean(history)} aria-controls="admin-publish-history">سجل النشر / استعادة نسخة<Icon name={history ? 'up' : 'down'}/></button>
            {history && <div id="admin-publish-history">
              <p className="adm-history-help">كل نسخة تشمل القائمة كاملة وقت النشر. الاستعادة تغيّر المسودة فقط؛ انشرها لتظهر للعملاء.</p>
              {history.map(revision=><div className="adm-change" key={revision.id}><div className="adm-change-text"><strong>النسخة {revision.id}</strong>{revision.id === publishedId && <p className="adm-current-revision">النسخة المنشورة حالياً</p>}<p>{new Intl.DateTimeFormat('ar-IQ',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Baghdad'}).format(new Date(revision.created_at))}</p></div><button className="adm-button secondary" disabled={revision.id === publishedId && !changes.length} onClick={()=>restoreRevision(revision.id)}>{revision.id === publishedId ? (changes.length ? 'استعادة المنشورة' : 'منشورة حالياً') : 'استعادة كمسودة'}</button></div>)}
            </div>}
          </div>}
        </>}
        </>}
        </fieldset>
      </main>
      <nav className="adm-nav" aria-label="التنقل في إدارة القائمة">{tabs.map(([id, label, icon]) => <button key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => navigate(id)}><Icon name={icon}/><span>{label}</span>{id === 'publish' && changes.length > 0 && <i>{changes.length}</i>}</button>)}</nav>
    </div>
    {notices.length > 0 && <div ref={toastRef} className="adm-toast-stack" aria-label="الإشعارات">{notices.map(notice=><TimedNotice key={notice.id} notice={notice} onDismiss={dismissNotice}/>)}</div>}
    {modal && ['moveDish','moveSlide'].includes(modal.type) && <Dialog title={modal.type==='moveSlide' ? 'تأكيد نقل صورة العرض' : 'تأكيد نقل الطبق'} onClose={()=>setModal(null)}>
      <p>{modal.type==='moveSlide' ? `هل أنت متأكد من نقل هذه الصورة لتصبح ${modal.direction==='top' ? 'أول' : 'آخر'} صورة في العروض؟` : `هل أنت متأكد من نقل الطبق «${modal.value.name}» إلى ${modal.direction==='top' ? 'أول' : 'آخر'} قسم «${modal.value.category}»؟`}</p>
      <div className="adm-actions"><button className="adm-button" disabled={busy || Boolean(remoteError)} onClick={()=>{
        if(modal.type==='moveSlide') {
          const slides=moveToEdge(draft.slides,modal.value.id,modal.direction);
          if(slides!==draft.slides) update({...draft,slides});
        } else {
          const items=moveDish(draft.items,modal.value.id,modal.direction);
          if(items!==draft.items) update({...draft,items});
        }
        setModal(null);
      }}>تأكيد النقل</button><button className="adm-button secondary" onClick={()=>setModal(null)}>إلغاء</button></div>
    </Dialog>}
    {modal && !['moveDish','moveSlide'].includes(modal.type) && <Dialog title={modal.type === 'blocked' ? 'لا يمكن حذف القسم' : modal.type === 'publish' ? (shared ? 'نشر التغييرات' : 'تجربة النشر محلياً') : 'تأكيد الحذف'} onClose={() => setModal(null)}>
      <div className="adm-dialog-symbol"><Icon name={modal.type === 'publish' ? 'send' : 'trash'} width="34" height="34"/></div>
      <p>{modal.type === 'blocked' ? 'يرجى نقل أو حذف جميع الأطباق في هذا القسم قبل حذفه.' : modal.type === 'publish' ? (shared ? 'هل تريد نشر جميع التغييرات المحفوظة؟ ستظهر النسخة الجديدة للعملاء في القائمة العامة.' : 'ستتم محاكاة نجاح النشر في هذه الجلسة فقط. لن تتغير القائمة العامة ولن تُرسل أي بيانات إلى الخادم.') : `هل تريد حذف «${modal.value.name || modal.value.alt}» من المسودة؟ ستبقى النسخة العامة كما هي.`}</p>
      <div className="adm-actions"><button className="adm-button" onClick={() => {
        if (modal.type === 'blocked') { setCategory(modal.value.name); navigate('dishes'); }
        else if (modal.type === 'publish') { if(shared) publish(); else { setBaseline(draft); setNotice('نجحت محاكاة النشر محلياً. لم تتغير القائمة العامة.'); } }
        else if (modal.type === 'deleteDish') update({ ...draft, items: draft.items.filter(item => item.id !== modal.value.id) });
        else if (modal.type === 'deleteSlide') update({ ...draft, slides: draft.slides.filter(slide => slide.id !== modal.value.id) });
        else { update({ ...draft, categories: draft.categories.filter(cat => cat.id !== modal.value.id) }); if (category === modal.value.name) setCategory(''); }
        setModal(null);
      }}>{modal.type === 'blocked' ? 'عرض الأطباق' : modal.type === 'publish' ? (shared ? 'تأكيد النشر' : 'تأكيد التجربة') : 'حذف من المسودة'}</button><button className="adm-button secondary" onClick={() => setModal(null)}>إلغاء</button></div>
    </Dialog>}
  </div>;
}
