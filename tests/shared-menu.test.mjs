import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { validateMenu } from '../lib/menu-validation.mjs';

const source=JSON.parse(fs.readFileSync(new URL('../data/menu.json',import.meta.url)));
const seed={...source,categories:source.categories.map((name,i)=>({id:`category-${i}`,name,icon:name})),slides:JSON.parse(fs.readFileSync(new URL('../data/hero-slides.json',import.meta.url)))};
const first='11111111-1111-4111-8111-111111111111';
const second='22222222-2222-4222-8222-222222222222';
const outsider='33333333-3333-4333-8333-333333333333';

test('server validation accepts the import and rejects malformed menu data',()=>{
  validateMenu(seed);
  for(const mutate of [
    d=>d.items[0].price=-1,
    d=>delete d.items[0].id,
    d=>d.items[0].price=1.5,
    d=>d.items[0].category='missing',
    d=>d.items.push(d.items[0]),
    d=>d.categories.push(d.categories[0]),
    d=>d.items[0].image='https://untrusted.example/image.png',
    d=>d.items[0].image='/menu/../secret.png',
    d=>d.items[0].description='x'.repeat(3001),
  ]) {const value=structuredClone(seed);mutate(value);assert.throws(()=>validateMenu(value));}
});

test('database protects drafts, prevents lost updates, publishes atomically, and restores retained revisions',async()=>{
 const db=new PGlite();
 try {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key,email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema public,auth to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;`);
  for(const id of [first,second,outsider])await db.query('insert into auth.users values($1,now())',[id]);
  const migration=fs.readFileSync(new URL('../supabase/migrations/001_shared_menu.sql',import.meta.url),'utf8');
  await db.exec(migration);
  // The migration is repeatable and must not reset published content.
  await db.exec(migration);
  await db.query('insert into private.menu_staff values($1),($2)',[first,second]);
  await db.query('insert into private.menu_revisions(content) values($1)',[JSON.stringify(seed)]);
  await db.query('insert into private.menu_state(draft,published_id) values($1,1)',[JSON.stringify(seed)]);
  const state=async()=> (await db.query('select public.menu_admin_read() as data')).rows[0].data;
  const published=async()=> (await db.query('select public.menu_public_read() as data')).rows[0].data;
  const login=async(id)=>{await db.exec('reset role; set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);};
  await db.exec('set role anon');
  assert.equal((await published()).content.items.length,145);
  await assert.rejects(()=>state());
  await assert.rejects(()=>db.query('select public.menu_history()'));
  await assert.rejects(()=>db.query('select * from private.menu_state'));
  await login(outsider);await assert.rejects(()=>state(),/STAFF_REQUIRED/);
  await login(first);
  const original=await state();
  const draft=structuredClone(original.draft);draft.items[0].price+=1000;
  await db.query('select public.menu_save($1::jsonb,$2)',[JSON.stringify(draft),original.version]);
  assert.deepEqual((await published()).content,seed);
  await login(second);
  const shared=await state();assert.equal(shared.draft.items[0].price,draft.items[0].price);
  await assert.rejects(()=>db.query('select public.menu_save($1::jsonb,$2)',[JSON.stringify(draft),original.version]),/VERSION_CONFLICT/);
  await assert.rejects(()=>db.query('select public.menu_publish($1)',[original.version]),/VERSION_CONFLICT/);
  for(const mutate of [d=>d.categories=[],d=>d.items[0].image='/menu/../secret.png',d=>d.items[0].description='x'.repeat(3001)]){
   const invalid=structuredClone(draft);mutate(invalid);await assert.rejects(()=>db.query('select public.menu_save($1::jsonb,$2)',[JSON.stringify(invalid),shared.version]));
  }
  await db.query('select public.menu_publish($1)',[shared.version]);
  const live=await published();assert.equal(live.content.items[0].price,draft.items[0].price);assert.equal(live.revision,2);
  const afterPublish=await state();assert.deepEqual(afterPublish.baseline,afterPublish.draft);
  await db.query('select public.menu_restore(1,$1)',[afterPublish.version]);
  assert.deepEqual((await state()).draft,seed);assert.equal((await published()).revision,2);
  // Restore version 2 after version 1: the draft matches the live snapshot again.
  const restoredFirst=await state();
  await db.query('select public.menu_restore(2,$1)',[restoredFirst.version]);
  assert.deepEqual((await state()).draft,live.content);
  assert.deepEqual((await state()).draft,(await state()).baseline);
  assert.equal((await published()).revision,2);
  assert.equal((await db.query('select public.menu_history() as data')).rows[0].data.length,2);
  await db.exec('reset role');await db.query('delete from private.menu_staff where user_id=$1',[second]);
  await login(second);await assert.rejects(()=>state(),/STAFF_REQUIRED/);
 } finally {await db.close();}
});
