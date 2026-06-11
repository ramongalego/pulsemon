'use client';

import { useState, useMemo } from 'react';
import type { Ping } from '@/lib/db/schema';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type TimeRange = '24h' | '7d' | '30d' | 'auto';

const SLOT_COUNT = 50;

const FIXED_RANGE_MS: Record<Exclude<TimeRange, 'auto'>, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

type SlotStatus = 'up' | 'down' | 'recovered' | 'idle';

type IncidentWindow = {
  startedAt: Date | string;
  resolvedAt: Date | string | null;
};

function toMs(d: Date | string): number {
  return typeof d === 'string' ? new Date(d).getTime() : d.getTime();
}

function computeSlots(
  pings: Ping[],
  incidents: IncidentWindow[],
  rangeMs: number,
): { status: SlotStatus; start: Date; end: Date; pingCount: number }[] {
  const now = Date.now();
  const rangeStart = now - rangeMs;
  const slotMs = rangeMs / SLOT_COUNT;

  // Count pings per slot
  const slotPingCounts = new Array<number>(SLOT_COUNT).fill(0);
  for (const ping of pings) {
    const pingMs = toMs(ping.receivedAt);
    if (pingMs < rangeStart || pingMs > now) continue;
    if (ping.status !== 'success') continue;
    const slotIndex = Math.min(
      Math.floor((pingMs - rangeStart) / slotMs),
      SLOT_COUNT - 1,
    );
    slotPingCounts[slotIndex]++;
  }

  // Pre-process incidents into ms ranges for overlap checks
  const incidentRanges = incidents.map((inc) => ({
    start: toMs(inc.startedAt),
    end: inc.resolvedAt ? toMs(inc.resolvedAt) : now,
  }));

  return Array.from({ length: SLOT_COUNT }, (_, i) => {
    const slotStartMs = rangeStart + i * slotMs;
    const slotEndMs = rangeStart + (i + 1) * slotMs;
    const start = new Date(slotStartMs);
    const end = new Date(slotEndMs);
    const count = slotPingCounts[i];

    // Check if any incident overlaps this slot
    const hasIncident = incidentRanges.some(
      (inc) => inc.start < slotEndMs && inc.end > slotStartMs,
    );

    if (hasIncident) {
      const status = count > 0 ? ('recovered' as const) : ('down' as const);
      return { status, start, end, pingCount: count };
    }

    if (count > 0) {
      return { status: 'up' as const, start, end, pingCount: count };
    }

    // No pings and no incident — idle/quiet
    return { status: 'idle' as const, start, end, pingCount: 0 };
  });
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `Last ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Last ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Last ${days}d`;
}

function formatSlotTime(date: Date, rangeMs: number): string {
  const slotMs = rangeMs / SLOT_COUNT;
  if (slotMs < 60_000) {
    // Slots narrower than 1 minute — show seconds to avoid "11:43 – 11:43"
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
  if (rangeMs <= 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const SLOT_COLORS: Record<SlotStatus, string> = {
  up: 'bg-green-500/80 hover:bg-green-500',
  down: 'bg-red-500/80 hover:bg-red-500',
  recovered:
    'bg-gradient-to-t from-red-500/80 to-green-500/80 hover:from-red-500 hover:to-green-500',
  idle: 'bg-muted-foreground/20 hover:bg-muted-foreground/30',
};

export function PingTimeline({
  pings,
  incidents,
  monitorAgeMs,
}: {
  pings: Ping[];
  incidents: IncidentWindow[];
  monitorAgeMs: number;
}) {
  const [selectedTab, setSelectedTab] = useState<TimeRange>('auto');

  const availableTabs = useMemo(() => {
    const tabs: Exclude<TimeRange, 'auto'>[] = [];
    if (monitorAgeMs >= FIXED_RANGE_MS['24h']) tabs.push('24h');
    if (monitorAgeMs >= FIXED_RANGE_MS['7d']) tabs.push('7d');
    if (monitorAgeMs >= FIXED_RANGE_MS['30d']) tabs.push('30d');
    return tabs;
  }, [monitorAgeMs]);

  // Compute the actual range in ms
  const rangeMs = useMemo(() => {
    if (selectedTab !== 'auto') return FIXED_RANGE_MS[selectedTab];
    // Auto: use monitor age, but at least 5 minutes so bars aren't jumpy
    return Math.max(monitorAgeMs, 5 * 60 * 1000);
  }, [selectedTab, monitorAgeMs]);

  const rangeLabel = useMemo(() => {
    if (selectedTab !== 'auto') {
      return {
        '24h': 'Last 24 hours',
        '7d': 'Last 7 days',
        '30d': 'Last 30 days',
      }[selectedTab];
    }
    return formatDuration(rangeMs);
  }, [selectedTab, rangeMs]);

  const slots = useMemo(
    () => computeSlots(pings, incidents, rangeMs),
    [pings, incidents, rangeMs],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500/80" />
            Healthy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500/80" />
            Incident
          </span>
          <span className="flex items-center gap-1.5">
            <span className="bg-muted-foreground/20 inline-block h-2.5 w-2.5 rounded-sm" />
            No activity
          </span>
        </div>
        {availableTabs.length > 0 && (
          <div className="flex gap-1">
            <button
              onClick={() => setSelectedTab('auto')}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                selectedTab === 'auto'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              All
            </button>
            {availableTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  selectedTab === tab
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-0.5">
        {slots.map((slot, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <div
                className={`h-8 flex-1 rounded-sm transition-colors ${SLOT_COLORS[slot.status]}`}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-medium">
                {formatSlotTime(slot.start, rangeMs)} –{' '}
                {formatSlotTime(slot.end, rangeMs)}
              </p>
              <p className="text-xs">
                {slot.status === 'up' &&
                  `${slot.pingCount} ping${slot.pingCount === 1 ? '' : 's'}`}
                {slot.status === 'down' && 'Incident, no pings'}
                {slot.status === 'recovered' &&
                  `Recovered, ${slot.pingCount} ping${slot.pingCount === 1 ? '' : 's'}`}
                {slot.status === 'idle' && 'No activity'}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">{rangeLabel}</p>
    </div>
  );
}
