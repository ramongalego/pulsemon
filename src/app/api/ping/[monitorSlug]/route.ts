import { NextRequest, NextResponse } from 'next/server';
import { redis, redisKeys } from '@/lib/redis';
import { db } from '@/lib/db';
import { monitors, pings, incidents } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { REDIS_TTL_BUFFER } from '@/lib/monitoring/constants';
import { dispatchAlerts } from '@/lib/monitoring/alerter';
import type { Monitor, Incident } from '@/lib/db/schema';

export const runtime = 'edge';

type MonitorCache = {
  id: string;
  expectedInterval: number;
  gracePeriod: number;
  isPaused: boolean;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ monitorSlug: string }> },
) {
  return handlePing(req, await params);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ monitorSlug: string }> },
) {
  return handlePing(req, await params);
}

async function handlePing(
  req: NextRequest,
  { monitorSlug }: { monitorSlug: string },
) {
  const now = Date.now();

  // Rate limit: max 1 ping per second per slug
  const rlKey = redisKeys.pingRateLimit(monitorSlug);
  const allowed = await redis.set(rlKey, 1, { nx: true, ex: 1 });
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: 'Rate limited' },
      { status: 429 },
    );
  }

  // Look up monitor (check Redis cache first)
  const cacheKey = redisKeys.slugToMonitor(monitorSlug);
  let monitor = await redis.get<MonitorCache>(cacheKey);

  if (!monitor) {
    // Cache miss: fetch from Postgres
    const [dbMonitor] = await db
      .select({
        id: monitors.id,
        expectedInterval: monitors.expectedInterval,
        gracePeriod: monitors.gracePeriod,
        isPaused: monitors.isPaused,
      })
      .from(monitors)
      .where(eq(monitors.slug, monitorSlug))
      .limit(1);

    if (!dbMonitor) {
      // Issue #4: Return 404 for unknown slugs — don't swallow this
      return NextResponse.json(
        { ok: false, error: 'Monitor not found' },
        { status: 404 },
      );
    }

    monitor = dbMonitor;

    // Cache for 5 minutes
    await redis.set(cacheKey, monitor, { ex: 300 });
  }

  if (monitor.isPaused) {
    return NextResponse.json({ ok: true, paused: true });
  }

  // From here on, monitor exists — errors should return 200 to not break cron jobs
  try {
    // Parse optional params (from query string or POST body)
    const url = new URL(req.url);
    let pingStatus: 'success' | 'fail' = 'success';
    let duration: number | null = null;
    let body: string | null = null;

    const qStatus = url.searchParams.get('status');
    const qDuration = url.searchParams.get('duration');

    if (qStatus === 'fail') pingStatus = 'fail';
    if (qDuration) duration = parseInt(qDuration, 10) || null;

    if (req.method === 'POST') {
      try {
        const json = await req.json();
        if (json.status === 'fail') pingStatus = 'fail';
        if (json.duration) duration = Number(json.duration) || null;
        if (json.body) body = String(json.body).slice(0, 10000);
      } catch {
        // Body parsing is optional, ignore errors
      }
    }

    // Write to Redis: SET the last ping timestamp with TTL
    const ttl =
      monitor.expectedInterval + monitor.gracePeriod + REDIS_TTL_BUFFER;
    await redis.set(redisKeys.lastPing(monitor.id), now, { ex: ttl });

    // Update monitor + insert ping in Postgres (non-blocking)
    const sourceIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      null;

    void (async () => {
      try {
        // Issue #2: Only set status to 'up' on success pings.
        // Fail pings update lastPingAt but leave status unchanged.
        const updateFields: Partial<typeof monitors.$inferInsert> = {
          lastPingAt: new Date(now),
          updatedAt: new Date(now),
        };
        if (pingStatus === 'success') {
          updateFields.status = 'up';
        }

        await db
          .update(monitors)
          .set(updateFields)
          .where(eq(monitors.id, monitor.id));

        // Insert ping record
        await db.insert(pings).values({
          monitorId: monitor.id,
          receivedAt: new Date(now),
          sourceIp,
          duration,
          status: pingStatus,
          body,
        });

        // Issue #1: Resolve open incidents and send recovery alerts on success
        // Alert first, resolve second — if alerts fail, leave the incident
        // open so the checker can retry on its next pass.
        if (pingStatus === 'success') {
          const openIncidents = await db
            .select()
            .from(incidents)
            .where(
              and(
                eq(incidents.monitorId, monitor.id),
                isNull(incidents.resolvedAt),
              ),
            );

          if (openIncidents.length > 0) {
            // Fetch full monitor for alert dispatch
            const [fullMonitor] = await db
              .select()
              .from(monitors)
              .where(eq(monitors.id, monitor.id))
              .limit(1);

            if (fullMonitor) {
              for (const incident of openIncidents) {
                const resolvedIncident: Incident = {
                  ...incident,
                  resolvedAt: new Date(now),
                };

                // Dispatch recovery alert — only resolve if it succeeds
                try {
                  await dispatchAlerts(
                    fullMonitor as Monitor,
                    'monitor.up',
                    resolvedIncident,
                  );

                  await db
                    .update(incidents)
                    .set({ resolvedAt: new Date(now) })
                    .where(eq(incidents.id, incident.id));
                } catch (alertErr) {
                  console.error(
                    `Recovery alert failed for incident ${incident.id}, leaving open for retry:`,
                    alertErr,
                  );
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Background ping sync failed:', err);
      }
    })();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Ping endpoint error:', err);
    // Monitor exists but something else failed — return 200 so cron jobs don't break
    return NextResponse.json({ ok: true });
  }
}
