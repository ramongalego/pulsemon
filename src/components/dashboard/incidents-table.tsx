'use client';

import { useState, useCallback, useEffect } from 'react';
import { RelativeTime } from '@/components/shared/relative-time';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Incident } from '@/lib/db/schema';

const PAGE_SIZE = 10;
const MAX_INLINE = 50;

export function IncidentsTable({
  initialIncidents,
  monitorId,
}: {
  initialIncidents: Incident[];
  monitorId: string;
}) {
  const [allIncidents, setAllIncidents] = useState(initialIncidents);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialIncidents.length >= PAGE_SIZE);
  const [loading, setLoading] = useState(false);

  // Sync with server data on refresh (reset to page 1)
  useEffect(() => {
    setAllIncidents(initialIncidents);
    setPage(1);
    setHasMore(initialIncidents.length >= PAGE_SIZE);
  }, [initialIncidents]);

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/monitors/${monitorId}/incidents?page=${nextPage}`,
      );
      const json = await res.json();
      if (json.data) {
        setAllIncidents((prev) => {
          const existingIds = new Set(prev.map((inc) => inc.id));
          const newIncidents = json.data.filter(
            (inc: Incident) => !existingIds.has(inc.id),
          );
          return [...prev, ...newIncidents];
        });
        setPage(nextPage);
        setHasMore(json.hasMore);
      }
    } finally {
      setLoading(false);
    }
  }, [monitorId, page]);

  if (allIncidents.length === 0) {
    return (
      <div className="text-muted-foreground flex h-20 items-center justify-center">
        No incidents
      </div>
    );
  }

  const reachedCap = allIncidents.length >= MAX_INLINE;

  return (
    <div className="space-y-2">
      {allIncidents.map((incident) => (
        <div
          key={incident.id}
          className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
        >
          <div>
            <span className="font-medium">
              {incident.cause === 'missed_ping'
                ? 'Missed Ping'
                : incident.cause === 'duration_exceeded'
                  ? 'Duration Exceeded'
                  : incident.cause}
            </span>
            <span className="text-muted-foreground ml-2">
              <RelativeTime date={incident.startedAt} />
            </span>
          </div>
          <div>
            {incident.resolvedAt ? (
              <span className="text-xs text-green-600">
                Resolved <RelativeTime date={incident.resolvedAt} />
              </span>
            ) : (
              <span className="text-xs font-medium text-red-600">Ongoing</span>
            )}
          </div>
        </div>
      ))}
      {hasMore && (
        <div className="flex justify-center pt-2">
          {reachedCap ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/monitors/${monitorId}/incidents`}>
                View full incident history
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
