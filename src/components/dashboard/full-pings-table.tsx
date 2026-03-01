import { RelativeTime } from '@/components/shared/relative-time';
import type { Ping } from '@/lib/db/schema';

export function FullPingsTable({ pings }: { pings: Ping[] }) {
  if (pings.length === 0) {
    return (
      <div className="text-muted-foreground flex h-20 items-center justify-center">
        No pings found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground grid grid-cols-4 gap-4 px-2 text-xs font-medium">
        <span>Status</span>
        <span>Received</span>
        <span>Duration</span>
        <span>Source IP</span>
      </div>
      {pings.map((ping) => (
        <div
          key={ping.id}
          className="grid grid-cols-4 gap-4 rounded-lg border px-2 py-2 text-sm"
        >
          <span
            className={
              ping.status === 'success' ? 'text-green-600' : 'text-red-600'
            }
          >
            {ping.status === 'success' ? 'OK' : 'FAIL'}
          </span>
          <span>
            <RelativeTime date={ping.receivedAt} />
          </span>
          <span className="text-muted-foreground">
            {ping.duration ? `${ping.duration}ms` : '—'}
          </span>
          <span className="text-muted-foreground truncate">
            {ping.sourceIp || '—'}
          </span>
        </div>
      ))}
    </div>
  );
}
