// Keep protected reads, draft saves and Storage operations from waiting indefinitely.
export function timedFetch(resource, options = {}) {
  const timeout=AbortSignal.timeout(20000);
  const signal=options.signal ? AbortSignal.any([options.signal,timeout]) : timeout;
  return fetch(resource,{...options,signal});
}

export async function withTimeout(promise, milliseconds, message) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(message)),milliseconds);}),
    ]);
  } finally {clearTimeout(timer);}
}
