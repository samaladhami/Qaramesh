import Link from 'next/link';
import { redirect } from 'next/navigation';
import Menu from '../../../components/Menu';
import { getStaffUser } from '../../../lib/supabase/server';
import { readSharedMenu } from '../menu-actions';

export const dynamic = 'force-dynamic';
export const metadata = { title:'معاينة المسودة | قراميش', robots:{index:false,follow:false} };
export default async function PreviewPage() {
  if (!await getStaffUser()) redirect('/admin/login');
  const result=await readSharedMenu();
  if (result.error) return <main style={{padding:30}}><p role="alert">{result.error}</p><Link href="/admin">العودة إلى الإدارة</Link></main>;
  const draft=result.state.draft;
  return <><div className="draft-preview-banner">معاينة المسودة · ليست القائمة المنشورة <Link href="/admin">العودة إلى الإدارة</Link></div><Menu categories={draft.categories.map(c=>c.name)} categoryRecords={draft.categories} items={draft.items} slides={draft.slides} preview/></>;
}
