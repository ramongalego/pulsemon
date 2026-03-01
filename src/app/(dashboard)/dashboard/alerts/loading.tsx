import { SkeletonCard } from '@/components/shared/skeleton-card';

export default function AlertsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="bg-muted h-8 w-44 animate-pulse rounded" />
        <div className="bg-muted mt-2 h-4 w-80 animate-pulse rounded" />
      </div>
      <SkeletonCard lines={4} />
    </div>
  );
}
