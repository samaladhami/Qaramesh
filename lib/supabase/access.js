import 'server-only';

export function authConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && process.env.SUPABASE_STAFF_USER_IDS?.trim());
}

export function isStaff(user) {
  const ids = (process.env.SUPABASE_STAFF_USER_IDS || '').split(',').map(value => value.trim()).filter(Boolean);
  return Boolean(user?.id && user.email_confirmed_at && ids.includes(user.id));
}
