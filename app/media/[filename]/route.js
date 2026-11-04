import { createClient as createPublicClient } from '@supabase/supabase-js';
import { createClient, getStaffUser } from '../../../lib/supabase/server';
import { MEDIA_BUCKET, mediaFilenamePattern } from '../../../lib/media-path.mjs';
import { bundledPublishedImage } from '../../../lib/bundled-menu-backup';

export const runtime='nodejs';
export async function GET(request,{params}) {
  const {filename}=await params;
  const missing=()=>new Response(null,{status:404,headers:{'Cache-Control':'private, no-store'}});
  const fallback=async()=>{
    const bytes=await bundledPublishedImage(filename);
    return bytes ? new Response(bytes,{headers:{'Content-Type':'image/webp','X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=31536000, s-maxage=31536000, immutable'}}) : missing();
  };
  if(!mediaFilenamePattern.test(filename)) return missing();
  if(!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return fallback();
  try {
    // The anonymous Storage policy permits only assets in the current published snapshot.
    const publicClient=createPublicClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(url,options)=>fetch(url,{...options,signal:AbortSignal.timeout(8000)})}});
    let result=await publicClient.storage.from(MEDIA_BUCKET).download(filename);
    const published=!result.error && Boolean(result.data);
    if(!published) {
      const backedUp=await bundledPublishedImage(filename);
      if(backedUp) return fallback();
      if(!await getStaffUser()) return missing();
      const client=await createClient();
      result=await client.storage.from(MEDIA_BUCKET).download(filename);
    }
    if(result.error || !result.data || result.data.size > 500000) return fallback();
    return new Response(await result.data.arrayBuffer(),{headers:{
      'Content-Type':'image/webp','X-Content-Type-Options':'nosniff',
      'Cache-Control':published ? 'public, max-age=31536000, s-maxage=31536000, immutable' : 'private, no-store',
    }});
  } catch { return fallback(); }
}
