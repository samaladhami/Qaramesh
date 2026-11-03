import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import DishContent from '../../../../../components/DishContent';
import { getStaffUser } from '../../../../../lib/supabase/server';
import { readSharedMenu } from '../../../menu-actions';

export const dynamic='force-dynamic';
export const metadata={ title:'معاينة الطبق | قراميش', robots:{index:false,follow:false} };
export default async function PreviewDish({ params }) {
  if (!await getStaffUser()) redirect('/admin/login');
  const result=await readSharedMenu();
  if (result.error) return <main style={{padding:30}}><p role="alert">{result.error}</p><Link href="/admin">العودة إلى الإدارة</Link></main>;
  const { id }=await params;
  const item=result.state.draft.items.find(i=>i.id===id);
  if (!item) notFound();
  const related=result.state.draft.items.filter(i=>i.category===item.category && i.id!==id);
  return <><div className="draft-preview-banner">معاينة طبق من المسودة <Link href="/admin/preview">العودة إلى المعاينة</Link></div><DishContent item={item} related={related} preview/></>;
}
