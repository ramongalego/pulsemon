'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 5) return 'just now';
  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

// Subscribe to a shared 10-second tick so relative times stay fresh
function subscribeToTick(callback: () => void) {
  const id = setInterval(callback, 10000);
  return () => clearInterval(id);
}

export function RelativeTime({ date }: { date: Date | string }) {
  const dateObj = useMemo(
    () => (typeof date === 'string' ? new Date(date) : date),
    [date],
  );

  const getSnapshot = useCallback(() => getRelativeTime(dateObj), [dateObj]);

  const relative = useSyncExternalStore(
    subscribeToTick,
    getSnapshot,
    () => '', // server snapshot — render empty to avoid hydration mismatch
  );

  if (!relative) {
    return (
      <time dateTime={dateObj.toISOString()} className="cursor-default">
        &nbsp;
      </time>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <time dateTime={dateObj.toISOString()} className="cursor-default">
          {relative}
        </time>
      </TooltipTrigger>
      <TooltipContent>{dateObj.toLocaleString()}</TooltipContent>
    </Tooltip>
  );
}
