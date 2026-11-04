import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import sharp from 'sharp';
import { sha256, uploadedImages, validatePublishedBackup } from '../lib/menu-backup.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const staff='11111111-1111-4111-8111-111111111111';
const backup=validatePublishedBackup(JSON.parse(await readFile(new URL('../data/published-menu-backup.json',import.meta.url),'utf8')));
const files=uploadedImages(backup.content);
const empty={items:[],categories:[],slides:[]};
const token=`${Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')}.${Buffer.from(JSON.stringify({sub:staff,role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.local-test-signature`;

test('real restore command recovers the saved menu and photos into an isolated draft', {timeout:60000},async()=>{
  const db=new PGlite();
  const objects=new Map();
  let uploadCount=0;
  let publishCalls=0;
  let authenticated=false;
  let failUpload=false;
  const readState=async()=>{
    await db.exec('reset role');
    return (await db.query('select draft,version,published_id from private.menu_state')).rows[0];
  };
  const setRole=async user=>{
    await db.exec(`reset role; set role ${user ? 'authenticated' : 'anon'}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user ? staff : '']);
  };
  const server=createServer(async(request,response)=>{
    const reply=(status,data)=>{response.writeHead(status,{'Content-Type':'application/json'});response.end(JSON.stringify(data));};
    try {
      const pathname=new URL(request.url,'http://localhost').pathname;
      if(pathname==='/auth/v1/token') {
        const chunks=[];for await(const chunk of request) chunks.push(chunk);
        const login=JSON.parse(Buffer.concat(chunks));
        assert.equal(login.email,'recovery@example.invalid');assert.equal(login.password,'local-fixture-only');
        authenticated=true;
        return reply(200,{access_token:token,token_type:'bearer',expires_in:3600,refresh_token:'local-refresh',user:{id:staff,email:login.email,role:'authenticated',aud:'authenticated',email_confirmed_at:new Date().toISOString()}});
      }
      if(pathname==='/auth/v1/logout') return reply(200,{});
      const signedIn=authenticated && request.headers.authorization===`Bearer ${token}`;
      await setRole(signedIn);
      if(pathname.startsWith('/rest/v1/rpc/')) {
        const name=pathname.split('/').at(-1);
        const chunks=[];for await(const chunk of request) chunks.push(chunk);
        const params=JSON.parse(Buffer.concat(chunks).toString()||'{}');
        let result;
        if(name==='menu_admin_read') result=await db.query('select public.menu_admin_read() as data');
        else if(name==='menu_save') result=await db.query('select public.menu_save($1::jsonb,$2) as data',[JSON.stringify(params.value),params.expected_version]);
        else if(name==='menu_publish') {publishCalls++;throw Error('Restore must never publish.');}
        else throw Error('Unexpected RPC');
        return reply(200,result.rows[0].data);
      }
      if(pathname.startsWith('/storage/v1/object/menu-media/')) {
        const filename=pathname.split('/').at(-1);
        if(request.method==='GET') {
          const visible=await db.query('select name from storage.objects where name=$1',[filename]);
          if(!visible.rows.length || !objects.has(filename)) return reply(404,{statusCode:'404',message:'Object not found',error:'not_found'});
          response.writeHead(200,{'Content-Type':'image/webp'});response.end(objects.get(filename));return;
        }
        if(request.method==='POST') {
          if(failUpload) return reply(500,{statusCode:'500',message:'Simulated Storage outage'});
          assert(signedIn,'Uploads require the local staff identity');
          assert.equal(request.headers['x-upsert'],'false');
          assert.match(request.headers['content-type'],/^image\/webp/);
          const chunks=[];for await(const chunk of request) chunks.push(chunk);
          const bytes=Buffer.concat(chunks);
          assert(bytes.length<=500000);assert(!objects.has(filename),'Never overwrite immutable files');
          await db.query('insert into storage.objects(name,bucket_id) values($1,$2)',[filename,'menu-media']);
          objects.set(filename,bytes);uploadCount++;
          return reply(200,{Key:`menu-media/${filename}`,Id:filename});
        }
      }
      reply(404,{message:'Unknown local fixture endpoint'});
    } catch(error) {reply(400,{message:error.message,code:error.code});}
  });
  let endpoint;
  async function restore() {
    return await new Promise((resolve,reject)=>{
      const child=spawn(process.execPath,['scripts/restore-menu-backup.mjs','--restore-draft'],{
        cwd:root,env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:endpoint,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_local_recovery_fixture',MENU_RECOVERY_EMAIL:'recovery@example.invalid',MENU_RECOVERY_PASSWORD:'local-fixture-only'},
        stdio:['ignore','pipe','pipe'],timeout:20000,
      });
      let output='';child.stdout.on('data',chunk=>{output+=chunk;});child.stderr.on('data',chunk=>{output+=chunk;});
      child.on('error',reject);child.on('close',code=>resolve({code,output}));
    });
  }
  async function cleanDraft() {
    await db.exec('reset role');
    await db.query('update private.menu_state set draft=$1::jsonb,version=version+1',[JSON.stringify(empty)]);
  }
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key,email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema public,auth to anon,authenticated;
      grant execute on function auth.uid() to anon,authenticated;
      create schema storage;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(name text primary key,bucket_id text references storage.buckets(id));
      alter table storage.objects enable row level security;
      grant usage on schema storage to anon,authenticated;
      grant select on storage.objects to anon,authenticated;
      grant insert,update,delete on storage.objects to authenticated;`);
    await db.exec(await readFile(new URL('../supabase/migrations/001_shared_menu.sql',import.meta.url),'utf8'));
    await db.exec(await readFile(new URL('../supabase/migrations/002_menu_media.sql',import.meta.url),'utf8'));
    await db.query('insert into auth.users values($1,now())',[staff]);
    await db.query('insert into private.menu_staff values($1)',[staff]);
    await db.query('insert into private.menu_revisions(content) values($1)',[JSON.stringify(empty)]);
    await db.query('insert into private.menu_state(draft,published_id) values($1,1)',[JSON.stringify(empty)]);
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    endpoint=`http://127.0.0.1:${server.address().port}`;

    if(files.length) {
      failUpload=true;
      const interrupted=await restore();
      assert.notEqual(interrupted.code,0);
      assert.match(interrupted.output,/Image recovery failed/);
      assert.deepEqual((await readState()).draft,empty);
      assert.equal((await readState()).published_id,1);
      failUpload=false;
    }
    const restored=await restore();
    assert.equal(restored.code,0,restored.output);
    assert.match(restored.output,/restored as a shared draft/);
    const state=await readState();
    assert.deepEqual(state.draft,backup.content);
    assert.equal(state.published_id,1);
    assert.equal(publishCalls,0);
    assert.equal(uploadCount,files.length);
    for(const filename of files) {
      const bytes=objects.get(filename);
      assert.equal(sha256(bytes),backup.images[filename]);
      const metadata=await sharp(bytes).metadata();
      assert.equal(metadata.format,'webp');assert(metadata.width>0 && metadata.height>0);
    }
    await setRole(false);
    assert.equal((await db.query('select * from storage.objects')).rows.length,0,'Restored draft images stay private');

    const blocked=await restore();
    assert.notEqual(blocked.code,0);
    assert.match(blocked.output,/unpublished changes/);
    assert.deepEqual(await readState(),state);

    await cleanDraft();
    const uploadsBefore=uploadCount;
    assert.equal((await restore()).code,0,'Repeated recovery reuses identical files');
    assert.equal(uploadCount,uploadsBefore);
    if(files.length) {
      await cleanDraft();
      objects.set(files[0],Buffer.from('damaged existing object'));
      const damaged=await restore();
      assert.notEqual(damaged.code,0);
      assert.match(damaged.output,/Existing immutable image differs/);
      assert.deepEqual((await readState()).draft,empty,'Corrupt existing file prevents draft replacement');
      objects.set(files[0],await readFile(new URL(`../data/published-media/${files[0]}`,import.meta.url)));
      assert.equal((await restore()).code,0);
    }
    const recovered=await readState();
    await setRole(true);
    await db.query('select public.menu_publish($1)',[recovered.version]);
    await setRole(false);
    const published=(await db.query('select public.menu_public_read() as data')).rows[0].data;
    assert.deepEqual(published.content,backup.content);
    assert.equal((await db.query('select * from storage.objects')).rows.length,files.length);
    console.log(`Recovery drill passed: revision ${backup.revision}, ${backup.content.items.length} dishes, ${files.length} photo(s); draft isolation, repeat recovery, corruption protection and explicit local publication verified.`);
  } finally {
    server.closeAllConnections();
    if(server.listening) await new Promise(resolve=>server.close(resolve));
    await db.close();
  }
});
