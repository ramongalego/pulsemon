'use client';

import { useState, useEffect, useRef } from 'react';
import { StatusPageHeader } from './status-page-header';
import { StatusPageMonitorList } from './status-page-monitor-list';
import { StatusPageIncidents } from './status-page-incidents';
import { StatusPageFooter } from './status-page-footer';
import { StatusPageSkeleton } from './status-page-skeleton';

export type MonitorData = {
  name: string;
  status: string;
  uptime: number | null;
  sortOrder: number;
  createdAt: string;
};

export type IncidentData = {
  monitorName: string;
  startedAt: string;
  resolvedAt: string | null;
};

type StatusPageData = {
  title: string;
  description: string | null;
  showOverallUptime: boolean;
  showIncidentHistory: boolean;
  monitors: MonitorData[];
  incidents: IncidentData[];
};

async function fetchStatusPage(slug: string) {
  const res = await fetch(`/api/public/status/${slug}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data as StatusPageData | null;
}

export function StatusPageView({ slug }: { slug: string }) {
  const [data, setData] = useState<StatusPageData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState(false);
  const initialFetchDone = useRef(false);

  // Initial fetch
  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;

    let cancelled = false;
    fetchStatusPage(slug).then((result) => {
      if (cancelled) return;
      if (result) {
        setData(result);
        setLastUpdated(new Date());
      } else {
        setError(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Polling interval
  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await fetchStatusPage(slug);
      if (result) {
        setData(result);
        setLastUpdated(new Date());
        setError(false);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [slug]);

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Status page not found.</p>
      </div>
    );
  }

  if (!data) {
    return <StatusPageSkeleton />;
  }

  // Compute overall status
  const monitorStatuses = data.monitors.map((m) => m.status);
  const allUp =
    monitorStatuses.length > 0 && monitorStatuses.every((s) => s === 'up');
  const allDown =
    monitorStatuses.length > 0 && monitorStatuses.every((s) => s === 'down');
  const overallStatus: 'operational' | 'partial' | 'major' = allUp
    ? 'operational'
    : allDown
      ? 'major'
      : 'partial';

  // Compute overall uptime
  const uptimes = data.monitors
    .map((m) => m.uptime)
    .filter((u): u is number => u !== null);
  const overallUptime =
    uptimes.length > 0
      ? uptimes.reduce((a, b) => a + b, 0) / uptimes.length
      : null;

  // Uptime label window — use the oldest monitor's age (capped at 30 days)
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const fetchTime = lastUpdated?.getTime() ?? Date.now(); // eslint-disable-line react-hooks/purity -- fallback only on first render before state settles
  const oldestCreatedAt = data.monitors.reduce((earliest, m) => {
    const t = new Date(m.createdAt).getTime();
    return t < earliest ? t : earliest;
  }, Infinity);
  const windowMs =
    oldestCreatedAt === Infinity
      ? thirtyDaysMs
      : Math.min(fetchTime - oldestCreatedAt, thirtyDaysMs);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <StatusPageHeader
        title={data.title}
        description={data.description}
        overallStatus={overallStatus}
        overallUptime={data.showOverallUptime ? overallUptime : null}
        uptimeWindowMs={data.showOverallUptime ? windowMs : null}
      />

      <div className="mt-8">
        <StatusPageMonitorList
          monitors={data.monitors}
          incidents={data.incidents}
        />
      </div>

      {data.showIncidentHistory && (
        <div className="mt-8">
          <StatusPageIncidents incidents={data.incidents} />
        </div>
      )}

      <div className="mt-8">
        <StatusPageFooter lastUpdated={lastUpdated} />
      </div>
    </div>
  );
}
