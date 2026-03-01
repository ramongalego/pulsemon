import { SkeletonCard } from '@/components/shared/skeleton-card';

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <div className="bg-muted h-8 w-32 animate-pulse rounded" />
        <div className="bg-muted mt-2 h-4 w-56 animate-pulse rounded" />
      </div>
      <SkeletonCard lines={3} />
      <SkeletonCard lines={2} />
      <SkeletonCard lines={2} />
    </div>
  );
}
