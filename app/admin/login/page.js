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
    <Link href="/" className="staff-login-close" aria-label="إغلاق والعودة إلى قائمة الطعام"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></Link>
    <img src="/logo-badge.webp" alt="قراميش" width="100" height="100"/>
    <span className="staff-login-eyebrow">فريق قراميش</span>
    <h1 id="staff-login-title">دخول الموظفين</h1>
    <p className="staff-login-intro">كل تفاصيل قائمتك، في مكان واحد.</p>
    <LoginForm configured={authConfigured()}/>
    <Link href="/" className="staff-login-back">العودة إلى قائمة الطعام ←</Link>
  </section></main>;
}
