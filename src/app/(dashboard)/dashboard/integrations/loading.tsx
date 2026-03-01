export default function IntegrationsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="bg-muted h-8 w-40 animate-pulse rounded" />
        <div className="bg-muted mt-2 h-4 w-72 animate-pulse rounded" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6">
            <div className="flex items-start gap-4">
              <div className="bg-muted h-10 w-10 animate-pulse rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="bg-muted h-5 w-24 animate-pulse rounded" />
                <div className="bg-muted h-4 w-full animate-pulse rounded" />
              </div>
            </div>
            <div className="bg-muted mt-4 h-9 w-24 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
