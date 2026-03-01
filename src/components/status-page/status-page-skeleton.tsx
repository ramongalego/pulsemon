export function StatusPageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-4 py-8">
      {/* Title */}
      <div className="bg-muted h-9 w-64 rounded" />
      <div className="bg-muted mt-2 h-5 w-96 rounded" />

      {/* Status banner */}
      <div className="bg-muted mt-6 h-14 rounded-lg" />

      {/* Monitor list */}
      <div className="mt-8 space-y-0 rounded-lg border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
          >
            <div className="bg-muted h-2.5 w-2.5 rounded-full" />
            <div className="bg-muted h-4 flex-1 rounded" />
            <div className="bg-muted hidden h-6 w-48 rounded sm:block" />
            <div className="bg-muted h-4 w-16 rounded" />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-between border-t pt-4">
        <div className="bg-muted h-4 w-36 rounded" />
        <div className="bg-muted h-4 w-24 rounded" />
      </div>
    </div>
  );
}
