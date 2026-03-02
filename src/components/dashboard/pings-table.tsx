'use client';

import { useState, useCallback, useEffect } from 'react';
import { RelativeTime } from '@/components/shared/relative-time';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Ping } from '@/lib/db/schema';

const PAGE_SIZE = 10;
const MAX_INLINE = 50;

export function PingsTable({
  initialPings,
  monitorId,
}: {
  initialPings: Ping[];
  monitorId: string;
}) {
  const [allPings, setAllPings] = useState(initialPings);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialPings.length >= PAGE_SIZE);
  const [loading, setLoading] = useState(false);

  // Sync with server data on refresh (reset to page 1)
  useEffect(() => {
    setAllPings(initialPings);
    setPage(1);
    setHasMore(initialPings.length >= PAGE_SIZE);
  }, [initialPings]);

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/monitors/${monitorId}/pings?page=${nextPage}`,
      );
      const json = await res.json();
      if (json.data) {
        setAllPings((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newPings = json.data.filter(
            (p: Ping) => !existingIds.has(p.id),
          );
          return [...prev, ...newPings];
        });
        setPage(nextPage);
        setHasMore(json.hasMore);
      }
    } finally {
      setLoading(false);
    }
  }, [monitorId, page]);

  if (allPings.length === 0) {
    return (
      <div className="text-muted-foreground flex h-20 items-center justify-center">
        No pings yet
      </div>
    );
  }

  const reachedCap = allPings.length >= MAX_INLINE;

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground grid grid-cols-3 gap-4 px-2 text-xs font-medium sm:grid-cols-4">
        <span>Status</span>
        <span>Received</span>
        <span>Duration</span>
        <span className="hidden sm:block">Source IP</span>
      </div>
      {allPings.map((ping) => (
        <div
          key={ping.id}
          className="grid grid-cols-3 gap-4 rounded-lg border px-2 py-2 text-sm sm:grid-cols-4"
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
          <span className="text-muted-foreground hidden truncate sm:block">
            {ping.sourceIp || '—'}
          </span>
        </div>
      ))}
      {hasMore && (
        <div className="flex justify-center pt-2">
          {reachedCap ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/monitors/${monitorId}/pings`}>
                View full ping history
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load more'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
