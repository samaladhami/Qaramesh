'use client';

import { useActionState } from 'react';
import { login } from '../../app/admin/login/actions';

export default function LoginForm({ configured }) {
  const [state, action, pending] = useActionState(login, {});
  return <form action={action} className="staff-login-form">
    {!configured && <p className="staff-login-info" role="status">دخول الموظفين غير متاح بعد. جارٍ تجهيز حسابات فريق المطعم.</p>}
    <label htmlFor="staff-email">البريد الإلكتروني</label>
    <input id="staff-email" name="email" type="email" dir="ltr" autoComplete="username" required maxLength={254} disabled={!configured || pending}/>
    <label htmlFor="staff-password">كلمة المرور</label>
    <input id="staff-password" name="password" type="password" dir="ltr" autoComplete="current-password" required maxLength={1024} disabled={!configured || pending}/>
    {state.error && <p role="alert" className="staff-login-error">{state.error}</p>}
    <button type="submit" disabled={!configured || pending}>{pending ? 'جارٍ تسجيل الدخول…' : 'تسجيل الدخول'}</button>
    <p className="staff-login-help">للموظفين المخوّلين فقط. للحصول على حساب أو استعادة كلمة المرور، تواصل مع مسؤول المطعم.</p>
  </form>;
}
