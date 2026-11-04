import 'server-only';
import { cache } from 'react';
import localMenu from '../data/menu.json';
import localSlides from '../data/hero-slides.json';
import { validateMenu } from './menu-validation.mjs';
import { bundledPublishedMenu } from './bundled-menu-backup';

export const MENU_TAG = 'published-menu-v1';
export const backendEnabled = () => process.env.MENU_BACKEND_ENABLED === 'true';
export const localSnapshot = { ...localMenu, categories: localMenu.categories.map((name,i) => ({ id:`category-${i}`,name,icon:name })), slides:localSlides };

// No cookies or staff credentials enter the shared public cache.
export const getPublishedMenu = cache(async () => {
  if (!backendEnabled()) return { content:localSnapshot, revision:0 };
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/menu_public_read`, {
      method:'POST', headers:{ apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, 'Content-Type':'application/json' }, body:'{}',
      cache:'force-cache', next:{ revalidate:60, tags:[MENU_TAG] }, signal:AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('MENU_UNAVAILABLE');
    const published = await response.json();
    validateMenu(published?.content);
    return published;
  } catch {
    // Cold-request outage fallback is the version bundled with this deployment.
    const backup = bundledPublishedMenu();
    console.error(`Published menu unavailable; serving bundled revision ${backup?.revision ?? 0}.`);
    return backup ? { content:backup.content, revision:backup.revision, publishedAt:backup.publishedAt, fallback:true } : { content:localSnapshot, revision:0, fallback:true };
  }
});
