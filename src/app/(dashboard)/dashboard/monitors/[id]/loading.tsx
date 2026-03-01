import { SkeletonCard } from '@/components/shared/skeleton-card';

export default function MonitorDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="bg-muted h-10 w-10 animate-pulse rounded" />
        <div>
          <div className="bg-muted h-7 w-48 animate-pulse rounded" />
          <div className="bg-muted mt-2 h-4 w-72 animate-pulse rounded" />
        </div>
      </div>
      <SkeletonCard lines={4} />
      <SkeletonCard lines={2} />
      <SkeletonCard lines={3} />
    </div>
  );
}
