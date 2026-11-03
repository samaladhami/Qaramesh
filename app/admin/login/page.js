import Link from 'next/link';
import { redirect } from 'next/navigation';
import LoginForm from '../../../components/admin/LoginForm';
import { authConfigured, getStaffUser } from '../../../lib/supabase/server';
import './login.css';

export const metadata = { title: 'قراميش | دخول الموظفين', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await getStaffUser()) redirect('/admin');
  return <main className="staff-login-page"><section className="staff-login-card" aria-labelledby="staff-login-title">
    <img src="/logo-badge.webp" alt="قراميش" width="100" height="100"/>
    <span className="staff-login-eyebrow">فريق قراميش</span>
    <h1 id="staff-login-title">دخول الموظفين</h1>
    <p className="staff-login-intro">كل تفاصيل قائمتك، في مكان واحد.</p>
    <LoginForm configured={authConfigured()}/>
    <Link href="/" className="staff-login-back">العودة إلى قائمة الطعام ←</Link>
  </section></main>;
}
