import AdminDashboard from '../../components/admin/AdminDashboard';
import menu from '../../data/menu.json';
import slides from '../../data/hero-slides.json';
import './admin.css';
import { redirect } from 'next/navigation';
import { getStaffUser } from '../../lib/supabase/server';
import { logout } from './login/actions';
import { backendEnabled } from '../../lib/published-menu';

export const metadata = { title: 'قراميش | إدارة القائمة', robots: { index: false, follow: false } };

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getStaffUser();
  if (!user) redirect('/admin/login');
  return <AdminDashboard key={user.id} initialMenu={menu} initialSlides={slides} staffId={user.id} logoutAction={logout} shared={backendEnabled()}/>;
}
