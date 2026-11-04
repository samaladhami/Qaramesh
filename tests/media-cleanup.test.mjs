import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const staff='11111111-1111-4111-8111-111111111111';
const outsider='22222222-2222-4222-8222-222222222222';
const filename=index=>`00000000-0000-4000-8000-${String(index).padStart(12,'0')}.webp`;
const document=index=>({items:[{id:'dish',name:'Dish',category:'A',price:1,available:true,size:'',description:'',shortDescription:'',addOn:'',image:`/media/${filename(index)}`}],categories:[{id:'a',name:'A',icon:'الأطباق',image:`/media/${filename(11)}`}],slides:[]});

test('cleanup report is staff-only, read-only and protects icons, all revisions and unclassified uploads',async()=>{
 const db=new PGlite();
 try {
  await db.exec(`create role anon;create role authenticated;create schema auth;
    create table auth.users(id uuid primary key,email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema public,auth to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(name text primary key,bucket_id text references storage.buckets(id),created_at timestamptz default now(),metadata jsonb,user_metadata jsonb);
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated;
    grant select on storage.objects to anon,authenticated;
    grant insert,update,delete on storage.objects to authenticated;`);
  for(const migration of ['001_shared_menu.sql','002_menu_media.sql','003_media_cleanup_report.sql']) await db.exec(await readFile(new URL(`../supabase/migrations/${migration}`,import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/003_media_cleanup_report.sql',import.meta.url),'utf8'));
  await db.query('insert into auth.users values($1,now()),($2,now())',[staff,outsider]);
  await db.query('insert into private.menu_staff values($1)',[staff]);
  const assets=[
    [1,'dish',100,'14 days'],[2,'offer',100,'14 days'],[3,'dish',100,'14 days'],
    [4,'category',100,'14 days'],[5,null,100,'14 days'],[6,'dish',100,'1 day'],
    [7,'dish',200,'14 days'],[8,'offer',300,'8 days'],[9,'dish',100,'14 days'],
    [10,'offer',100,null],[11,'dish',100,'14 days'],
  ];
  for(const [id,kind,size,age] of assets) await db.query(`insert into storage.objects(name,bucket_id,created_at,metadata,user_metadata)
    values($1,'menu-media',case when $2::text is null then null else now()-$2::interval end,$3::jsonb,$4::jsonb)`,[
      id===9 ? 'unexpected-name.webp' : filename(id),age,JSON.stringify({size}),JSON.stringify(kind ? {menuKind:kind} : {}),
    ]);
  await db.exec("insert into storage.buckets(id,name) values('other','other')");
  await db.query("insert into storage.objects(name,bucket_id,user_metadata,created_at) values($1,'other',$2,now()-interval '14 days')",[filename(12),JSON.stringify({menuKind:'dish'})]);
  await db.query('insert into private.menu_revisions(content) values($1),($2)',[JSON.stringify(document(3)),JSON.stringify(document(2))]);
  await db.query('insert into private.menu_state(draft,published_id) values($1,2)',[JSON.stringify(document(1))]);
  const report=async()=>(await db.query('select public.menu_media_cleanup_report() as data')).rows[0].data;
  await db.exec('set role anon');await assert.rejects(report);
  await db.exec('reset role;set role authenticated');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[outsider]);
  await assert.rejects(report,/STAFF_REQUIRED/);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[staff]);
  const before=(await db.query('select name,metadata,user_metadata from storage.objects order by name')).rows;
  const result=await report();
  assert.equal(result.readOnly,true);assert.equal(result.minimumAgeDays,7);
  assert.equal(result.totalCount,11);assert.equal(result.protectedCount,9);
  assert.equal(result.candidateCount,2);assert.equal(result.candidateBytes,500);
  assert.deepEqual(result.candidates.map(asset=>asset.filename),[filename(7),filename(8)]);
  assert.deepEqual(result.protectedReasons,{referenced:4,category_icon:1,unclassified:1,recent:1,unknown_path:1,unknown_age:1});
  assert.deepEqual((await db.query('select name,metadata,user_metadata from storage.objects order by name')).rows,before);
  assert.equal((await db.query('delete from storage.objects returning name')).rows.length,0,'Report does not enable deletion');
  await db.exec('reset role');
  await db.exec(`insert into storage.objects(name,bucket_id,created_at,metadata,user_metadata)
    select '00000000-0000-4000-8000-'||lpad(i::text,12,'0')||'.webp','menu-media',now()-interval '14 days','{"size":100}','{"menuKind":"offer"}' from generate_series(100,304) i;`);
  await db.exec('set role authenticated');
  const large=await report();
  assert.equal(large.candidates.length,200);assert.equal(large.candidateCount,207);
  assert.equal(large.candidateBytes,21000);assert.equal(large.truncated,true);
 } finally {await db.close();}
});
