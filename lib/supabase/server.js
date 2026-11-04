import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { authConfigured, isStaff } from './access';
import { timedFetch } from '../request-timeout.mjs';
export { authConfigured, isStaff } from './access';

export async function createClient() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    global:{fetch:timedFetch},
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        // Server Components cannot write cookies; proxy.js refreshes them first.
        try { values.forEach(({ name, value, options }) => store.set(name, value, options)); } catch {}
      },
    },
  });
}

export async function getStaffUser() {
  if (!authConfigured()) return null;
  try {
    const client = await createClient();
    const { data, error } = await client.auth.getUser();
    return !error && isStaff(data.user) ? data.user : null;
  } catch { return null; }
}
