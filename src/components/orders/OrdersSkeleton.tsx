export function OrdersSkeleton({ label }: { label: string }) {
  return (
    <>
      <p id="orders-loading-label" className="sr-only">{label}</p>
      <ul data-testid="orders-loading" aria-busy="true" aria-labelledby="orders-loading-label" className="space-y-3">
        {[0, 1, 2].map((index) => (
          <li
            key={index}
            aria-hidden="true"
            className="relative grid gap-3 rounded-lg border border-border bg-card p-4 motion-safe:animate-pulse md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-4"
          >
            <div className="aspect-[896/1831] w-16 rounded-lg bg-muted" />

            <div className="space-y-1">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-6 w-40 rounded bg-muted" />
              <div className="h-5 w-48 rounded bg-muted" />
              <div className="h-5 w-32 rounded bg-muted" />
            </div>

            <div className="grid gap-2 md:justify-items-end">
              <div className="h-6 w-24 rounded bg-muted" />
              <div className="absolute right-4 top-4 h-6 w-36 rounded-full bg-muted md:static" />
              <div className="h-5 w-28 rounded bg-muted" />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
