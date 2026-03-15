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

function formatDurationLabel(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

function niceMax(value: number): number {
  if (value <= 0) return 100;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  if (normalized <= 1) return magnitude;
  if (normalized <= 2) return 2 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function spansMultipleDays(points: PingPoint[]): boolean {
  if (points.length < 2) return false;
  const first = new Date(points[0].receivedAt);
  const last = new Date(points[points.length - 1].receivedAt);
  return first.toDateString() !== last.toDateString();
}

function formatTimeLabel(date: Date, showDate: boolean): string {
  if (showDate) {
    return `${date.getMonth() + 1}/${date.getDate()} ${formatTime(date)}`;
  }
  return formatTime(date);
}

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

  // Single data point: show as a simple stat
  if (withDuration.length === 1) {
    const ping = withDuration[0];
    return (
      <div className="flex h-32 flex-col items-center justify-center gap-1">
        <span className="text-3xl font-bold tracking-tight">
          {formatDurationLabel(ping.duration!)}
        </span>
        <span className="text-muted-foreground text-sm">
          Only one ping recorded so far
        </span>
      </div>
    );
  }

  const durations = withDuration.map((p) => p.duration!);
  const maxValue = Math.max(...durations);
  const ceilMax = niceMax(maxValue);
  const median = durations.slice().sort((a, b) => a - b)[
    Math.floor(durations.length / 2)
  ];

  // Y axis: 5 evenly spaced labels
  const yTicks = Array.from({ length: 5 }, (_, i) => (ceilMax / 4) * i);

  // X axis: pick which labels to show
  const showDate = spansMultipleDays(withDuration);
  const xLabelInterval =
    withDuration.length <= 10 ? 1 : Math.ceil(withDuration.length / 6);

  function getColor(duration: number): string {
    if (duration <= median) return 'bg-green-500/80';
    if (duration <= median * 2) return 'bg-amber-500/80';
    return 'bg-red-500/80';
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex" style={{ height: '8rem' }}>
        {/* Y axis labels */}
        <div className="flex flex-col-reverse justify-between pr-2 text-right">
          {yTicks.map((tick) => (
            <span
              key={tick}
              className="text-muted-foreground text-[10px] leading-none"
            >
              {formatDurationLabel(tick)}
            </span>
          ))}
        </div>

        {/* Chart area */}
        <div className="relative flex flex-1 items-end gap-0.5 border-b border-l">
          {withDuration.map((ping) => {
            const height = ceilMax > 0 ? (ping.duration! / ceilMax) * 100 : 0;
            const date = new Date(ping.receivedAt);
            return (
              <Tooltip key={ping.id}>
                <TooltipTrigger asChild>
                  <div
                    className={`flex-1 rounded-t-sm ${getColor(ping.duration!)}`}
                    style={{
                      height: `${Math.max(Math.min(height, 95), 1.5)}%`,
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
      </div>

      {/* X axis labels */}
      <div className="flex">
        <div className="pr-2" style={{ minWidth: '3rem' }} />
        <div className="flex flex-1 gap-0.5">
          {withDuration.map((ping, i) => {
            const showLabel = i % xLabelInterval === 0;
            const date = new Date(ping.receivedAt);
            return (
              <div key={ping.id} className="flex-1 text-center">
                {showLabel && (
                  <span className="text-muted-foreground text-[10px] leading-none">
                    {formatTimeLabel(date, showDate)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
