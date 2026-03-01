import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <Card>
      <CardHeader>
        <div className="bg-muted h-5 w-1/3 animate-pulse rounded" />
        <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="bg-muted h-4 animate-pulse rounded" />
        ))}
      </CardContent>
    </Card>
  );
}
