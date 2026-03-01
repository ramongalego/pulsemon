import { SkeletonCard } from '@/components/shared/skeleton-card';

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="bg-muted h-8 w-40 animate-pulse rounded" />
        <div className="bg-muted mt-2 h-4 w-64 animate-pulse rounded" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6">
            <div className="bg-muted mb-3 h-4 w-24 animate-pulse rounded" />
            <div className="bg-muted h-8 w-12 animate-pulse rounded" />
          </div>
        ))}
      </div>
      <SkeletonCard lines={5} />
    </div>
  );
}
