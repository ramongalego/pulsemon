import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
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
      // Issue #4: Return 404 for unknown slugs
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

  // From here on, monitor exists. Errors return 200 to not break cron jobs.
  try {
    // Parse optional params (from query string or POST body)
    const url = new URL(req.url);
    let pingStatus: 'success' | 'fail' | 'start' = 'success';
    let duration: number | null = null;
    let body: string | null = null;

    const qStatus = url.searchParams.get('status');
    const qDuration = url.searchParams.get('duration');

    if (qStatus === 'fail') pingStatus = 'fail';
    if (qStatus === 'start') pingStatus = 'start';
    if (qDuration) duration = parseInt(qDuration, 10) || null;

    if (req.method === 'POST') {
      try {
        const json = await req.json();
        if (json.status === 'fail') pingStatus = 'fail';
        if (json.status === 'start') pingStatus = 'start';
        if (json.duration) duration = Number(json.duration) || null;
        if (json.body) body = String(json.body).slice(0, 10000);
      } catch {
        // Body parsing is optional, ignore errors
      }
    }

    // Start pings do NOT reset the deadline (only success pings do)
    if (pingStatus !== 'start') {
      const ttl =
        monitor.expectedInterval + monitor.gracePeriod + REDIS_TTL_BUFFER;
      await redis.set(redisKeys.lastPing(monitor.id), now, { ex: ttl });
    }

    const sourceIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      null;

    after(async () => {
      try {
        if (pingStatus === 'start') {
          // Check if already running (overlap detection)
          const [monitorState] = await db
            .select({
              isRunning: monitors.isRunning,
              lastStartAt: monitors.lastStartAt,
            })
            .from(monitors)
            .where(eq(monitors.id, monitor.id));

          if (monitorState?.isRunning) {
            // Overlap detected: create incident and alert
            const [fullMonitor] = await db
              .select()
              .from(monitors)
              .where(eq(monitors.id, monitor.id))
              .limit(1);

            if (fullMonitor) {
              const [incident] = await db
                .insert(incidents)
                .values({
                  monitorId: monitor.id,
                  startedAt: new Date(now),
                  cause: 'overlap',
                  alertsSent: 1,
                })
                .returning();

              try {
                await dispatchAlerts(
                  fullMonitor as Monitor,
                  'monitor.overlap',
                  incident,
                );
              } catch (alertErr) {
                console.error(
                  `Overlap alert failed for monitor ${monitor.id}:`,
                  alertErr,
                );
              }
            }
          }

          // Set isRunning and lastStartAt (don't update status or lastPingAt)
          await db
            .update(monitors)
            .set({
              isRunning: true,
              lastStartAt: new Date(now),
              updatedAt: new Date(now),
            })
            .where(eq(monitors.id, monitor.id));
        } else {
          // Success or fail ping
          const updateFields: Partial<typeof monitors.$inferInsert> = {
            lastPingAt: new Date(now),
            updatedAt: new Date(now),
            isRunning: false,
          };
          if (pingStatus === 'success') {
            updateFields.status = 'up';
          }

          await db
            .update(monitors)
            .set(updateFields)
            .where(eq(monitors.id, monitor.id));
        }

        // Insert ping record
        await db.insert(pings).values({
          monitorId: monitor.id,
          receivedAt: new Date(now),
          sourceIp,
          duration,
          status: pingStatus,
          body,
        });

        // Resolve open incidents on success or fail pings
        if (pingStatus === 'success' || pingStatus === 'fail') {
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
            if (pingStatus === 'success') {
              // Fetch full monitor for alert dispatch
              const [fullMonitor] = await db
                .select()
                .from(monitors)
                .where(eq(monitors.id, monitor.id))
                .limit(1);

              if (fullMonitor) {
                // Send one recovery alert for the most recent incident
                const latest = openIncidents[openIncidents.length - 1];
                const resolvedIncident: Incident = {
                  ...latest,
                  resolvedAt: new Date(now),
                };

                try {
                  await dispatchAlerts(
                    fullMonitor as Monitor,
                    'monitor.up',
                    resolvedIncident,
                  );
                } catch (alertErr) {
                  console.error(
                    `Recovery alert failed for incident ${latest.id}, leaving open for retry:`,
                    alertErr,
                  );
                }
              }
            }

            // Resolve all open incidents (both success and fail)
            for (const incident of openIncidents) {
              await db
                .update(incidents)
                .set({ resolvedAt: new Date(now) })
                .where(eq(incidents.id, incident.id));
            }
          }
        }
      } catch (err) {
        console.error('Background ping sync failed:', err);
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Ping endpoint error:', err);
    // Monitor exists but something else failed. Return 200 so cron jobs don't break.
    return NextResponse.json({ ok: true });
  }
}
