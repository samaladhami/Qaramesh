import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { authConfigured, isStaff } from './lib/supabase/access';
import { timedFetch } from './lib/request-timeout.mjs';

export async function proxy(request) {
  let response = NextResponse.next({ request });
  response.headers.set('Cache-Control', 'private, no-store');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const loginPage = request.nextUrl.pathname === '/admin/login';
  function deny() {
    const denied = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.getAll().forEach(cookie => denied.cookies.set(cookie));
    denied.headers.set('Cache-Control', 'private, no-store');
    return denied;
  }
  if (!authConfigured()) return loginPage ? response : deny();
  const client = createServerClient(url, key, {
    global:{fetch:timedFetch},
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        response.headers.set('Cache-Control', 'private, no-store');
      },
    },
  });
  let staff = false;
  try {
    const { data, error } = await client.auth.getUser();
    staff = !error && isStaff(data.user);
  } catch { /* Protected pages independently verify access and fail closed. */ }
  if (!loginPage && !staff) return deny();
  return response;
}

export const config = { matcher: ['/admin/:path*'] };
