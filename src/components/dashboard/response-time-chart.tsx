'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type PingPoint = {
  id: string;
  receivedAt: Date | string;
  duration: number | null;
};

export function ResponseTimeChart({ pings }: { pings: PingPoint[] }) {
  const withDuration = pings
    .filter((p) => p.duration !== null)
    .slice(0, 50)
    .reverse();

  if (withDuration.length === 0) {
    return (
      <div className="text-muted-foreground flex h-32 items-center justify-center text-sm">
        No duration data available
      </div>
    );
  }

  const durations = withDuration.map((p) => p.duration!);
  const max = Math.max(...durations);
  const median = durations.slice().sort((a, b) => a - b)[
    Math.floor(durations.length / 2)
  ];

  function getColor(duration: number): string {
    if (duration <= median) return 'bg-green-500/80';
    if (duration <= median * 2) return 'bg-amber-500/80';
    return 'bg-red-500/80';
  }

  return (
    <div className="flex items-end gap-0.5" style={{ height: '8rem' }}>
      {withDuration.map((ping) => {
        const height = max > 0 ? (ping.duration! / max) * 100 : 0;
        const date = new Date(ping.receivedAt);
        return (
          <Tooltip key={ping.id}>
            <TooltipTrigger asChild>
              <div
                className={`flex-1 rounded-t-sm ${getColor(ping.duration!)}`}
                style={{
                  height: `${Math.max(height, 4)}%`,
                  minWidth: '3px',
                }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-mono text-xs">
                {ping.duration}ms &middot; {date.toLocaleString()}
              </p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
