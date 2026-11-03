'use server';

import { redirect } from 'next/navigation';
import { authConfigured, createClient, isStaff } from '../../../lib/supabase/server';

export async function login(previous, formData) {
  if (!authConfigured()) return { error: 'دخول الموظفين غير متاح بعد. يرجى التواصل مع مسؤول المطعم.' };
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length > 1024) return { error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' };
  try {
    const client = await createClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !isStaff(data.user)) {
      if (!error) await client.auth.signOut({ scope: 'local' });
      return { error: 'تعذر تسجيل الدخول. تحقق من بياناتك وصلاحية حساب الموظف.' };
    }
  } catch { return { error: 'تعذر الاتصال بخدمة تسجيل الدخول. حاول مرة أخرى.' }; }
  redirect('/admin');
}

export async function logout() {
  if (authConfigured()) {
    const client = await createClient();
    await client.auth.signOut({ scope: 'local' });
  }
  redirect('/admin/login');
}
