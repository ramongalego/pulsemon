import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  statusPages,
  statusPageMonitors,
  monitors,
  incidents,
} from '@/lib/db/schema';
import { eq, and, gte, inArray } from 'drizzle-orm';
import { computeUptime } from '@/lib/monitoring/uptime';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // Fetch public status page
  const [page] = await db
    .select()
    .from(statusPages)
    .where(and(eq(statusPages.slug, slug), eq(statusPages.isPublic, true)))
    .limit(1);

  if (!page) {
    return NextResponse.json(
      {
        data: null,
        error: { code: 'NOT_FOUND', message: 'Status page not found' },
      },
      { status: 404 },
    );
  }

  // Fetch linked monitors with their status
  const linkedMonitors = await db
    .select({
      displayName: statusPageMonitors.displayName,
      sortOrder: statusPageMonitors.sortOrder,
      monitorId: statusPageMonitors.monitorId,
      name: monitors.name,
      status: monitors.status,
      isPaused: monitors.isPaused,
      lastPingAt: monitors.lastPingAt,
      createdAt: monitors.createdAt,
    })
    .from(statusPageMonitors)
    .innerJoin(monitors, eq(statusPageMonitors.monitorId, monitors.id))
    .where(eq(statusPageMonitors.statusPageId, page.id))
    .orderBy(statusPageMonitors.sortOrder);

  // Hide paused monitors from public status page
  const visibleMonitors = linkedMonitors.filter((m) => !m.isPaused);

  // Fetch incidents for last 14 days (display) and 30 days (uptime) in parallel
  const now = Date.now();
  const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const monitorIds = visibleMonitors.map((m) => m.monitorId);

  type IncidentRow = {
    id: string;
    monitorId: string;
    startedAt: Date;
    resolvedAt: Date | null;
  };
  let recentIncidents: IncidentRow[] = [];
  let uptimeIncidents: Omit<IncidentRow, 'id'>[] = [];

  if (monitorIds.length > 0) {
    [recentIncidents, uptimeIncidents] = await Promise.all([
      db
        .select({
          id: incidents.id,
          monitorId: incidents.monitorId,
          startedAt: incidents.startedAt,
          resolvedAt: incidents.resolvedAt,
        })
        .from(incidents)
        .where(
          and(
            inArray(incidents.monitorId, monitorIds),
            gte(incidents.startedAt, fourteenDaysAgo),
          ),
        ),
      db
        .select({
          monitorId: incidents.monitorId,
          startedAt: incidents.startedAt,
          resolvedAt: incidents.resolvedAt,
        })
        .from(incidents)
        .where(
          and(
            inArray(incidents.monitorId, monitorIds),
            gte(incidents.startedAt, thirtyDaysAgo),
          ),
        ),
    ]);
  }

  // Group uptime incidents by monitorId once (avoid O(n*m) filter per monitor)
  const incidentsByMonitor = new Map<
    string,
    Omit<IncidentRow, 'id' | 'monitorId'>[]
  >();
  for (const incident of uptimeIncidents) {
    const list = incidentsByMonitor.get(incident.monitorId) ?? [];
    list.push({
      startedAt: incident.startedAt,
      resolvedAt: incident.resolvedAt,
    });
    incidentsByMonitor.set(incident.monitorId, list);
  }

  // Compute uptime per monitor
  const monitorData = visibleMonitors.map((m) => {
    const monitorIncidents = incidentsByMonitor.get(m.monitorId) ?? [];
    const uptime = computeUptime(
      monitorIncidents,
      m.createdAt,
      m.status !== 'new',
    );

    return {
      name: m.displayName || m.name,
      status: m.status,
      uptime,
      sortOrder: m.sortOrder,
      createdAt: m.createdAt.toISOString(),
    };
  });

  // Build safe incident list (no IDs exposed)
  const incidentData = recentIncidents.map((i) => {
    const monitor = visibleMonitors.find((m) => m.monitorId === i.monitorId);
    return {
      monitorName: monitor ? monitor.displayName || monitor.name : 'Unknown',
      startedAt: i.startedAt.toISOString(),
      resolvedAt: i.resolvedAt?.toISOString() ?? null,
    };
  });

  const response = {
    title: page.title,
    description: page.description,
    showOverallUptime: page.showOverallUptime,
    showIncidentHistory: page.showIncidentHistory,
    monitors: monitorData,
    incidents: incidentData,
  };

  return NextResponse.json(
    { data: response, error: null },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    },
  );
}
