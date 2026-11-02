export default function Loading() {
  return (
    <div className="page-stack" role="status" aria-label="Loading page">
      <div className="h-8 w-40 rounded bg-muted animate-pulse" />
      <div className="panel p-5 space-y-4">
        {["w-full", "w-4/5", "w-3/5"].map((width) => (
          <div
            className={`h-6 rounded bg-muted animate-pulse ${width}`}
            key={width}
          />
        ))}
      </div>
      <span className="sr-only">Loading monitoring data…</span>
    </div>
  );
}
