'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Auto-refreshes the monitor detail page.
 * - For "new" monitors: polls every 3s for the first ping.
 * - For active monitors: refreshes every 30s to pick up new pings/status changes.
 *   (RelativeTime handles keeping timestamps visually fresh between refreshes.)
 */
export function PingWatcher({
  monitorId,
  status,
}: {
  monitorId: string;
  status: string;
}) {
  const router = useRouter();
  const isNew = status === 'new';
  useEffect(() => {
    if (isNew) {
      // Poll for status change (fast — every 3s)
      const pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/monitors/${monitorId}/status`);
          if (!res.ok) return;
          const json = await res.json();
          if (json.status !== 'new') {
            router.refresh();
          }
        } catch {
          // Ignore polling errors
        }
      }, 3000);

      return () => clearInterval(pollInterval);
    } else {
      // For active monitors, refresh the server component every 30s
      const refreshInterval = setInterval(() => {
        router.refresh();
      }, 30000);

      return () => clearInterval(refreshInterval);
    }
  }, [monitorId, isNew, router]);

  return null;
}
