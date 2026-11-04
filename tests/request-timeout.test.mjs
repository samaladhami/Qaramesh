import test from 'node:test';
import assert from 'node:assert/strict';
import {timedFetch,withTimeout} from '../lib/request-timeout.mjs';

test('a timed-out upload does not apply a late image result',async context=>{
  context.mock.timers.enable({apis:['setTimeout']});
  let finish;
  let applied=false;
  const upload=new Promise(resolve=>{finish=resolve;});
  const operation=withTimeout(upload,60000,'UPLOAD_TIMEOUT').then(()=>{applied=true;});
  const rejected=assert.rejects(operation,/UPLOAD_TIMEOUT/);
  context.mock.timers.tick(60001);
  await rejected;
  finish({src:'/media/late.webp'});
  await Promise.resolve();
  assert.equal(applied,false);
  assert.equal(await withTimeout(Promise.resolve('done'),60000,'UPLOAD_TIMEOUT'),'done');
  context.mock.timers.reset();
});

test('provider requests preserve caller cancellation and include a deadline',async()=>{
  const original=globalThis.fetch;
  const controller=new AbortController();
  controller.abort();
  let received;
  globalThis.fetch=async(resource,options)=>{received=options;return new Response('ok');};
  try {
    await timedFetch('https://example.invalid',{signal:controller.signal,method:'POST'});
    assert.equal(received.signal.aborted,true);
    assert.equal(received.method,'POST');
    await timedFetch('https://example.invalid');
    assert(received.signal instanceof AbortSignal);
  } finally {globalThis.fetch=original;}
});
