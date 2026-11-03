import AdminDashboard from '../../components/admin/AdminDashboard';
import menu from '../../data/menu.json';
import slides from '../../data/hero-slides.json';
import './admin.css';
import { redirect } from 'next/navigation';
import { createClient, getStaffUser } from '../../lib/supabase/server';
import { logout } from './login/actions';
import { backendEnabled } from '../../lib/published-menu';

export const metadata = { title: 'قراميش | إدارة القائمة', robots: { index: false, follow: false } };

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getStaffUser();
  if (!user) redirect('/admin/login');
  let mediaReady=false;
  if(backendEnabled()) {
    try {
      const client=await createClient();
      const {data,error}=await client.rpc('menu_media_staff');
      mediaReady=!error && data===true;
    } catch { /* Keep upload controls disabled until Storage setup is available. */ }
  }
  return <AdminDashboard key={user.id} initialMenu={menu} initialSlides={slides} staffId={user.id} logoutAction={logout} shared={backendEnabled()} mediaReady={mediaReady}/>;
}
