export default function Loading() {
  return <main className="loading-shell" role="status" aria-label="جارٍ تحميل القائمة"><div className="skeleton skeleton-title" /><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div className="skeleton h-72 rounded-3xl" key={i} />)}</div><span className="sr-only">جارٍ تحميل القائمة…</span></main>;
}
