import AdminDashboard from '../../components/admin/AdminDashboard';
import menu from '../../data/menu.json';
import slides from '../../data/hero-slides.json';
import './admin.css';

export const metadata = { title: 'قراميش | إدارة القائمة', robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminDashboard initialMenu={menu} initialSlides={slides} />;
}
