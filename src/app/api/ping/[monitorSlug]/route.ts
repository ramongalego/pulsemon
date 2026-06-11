import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { redis, redisKeys } from '@/lib/redis';
import { db } from '@/lib/db';
import { monitors, pings, incidents } from '@/lib/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { REDIS_TTL_BUFFER } from '@/lib/monitoring/constants';
import { dispatchAlerts } from '@/lib/monitoring/alerter';
import type { Incident } from '@/lib/db/schema';

export const runtime = 'edge';

// Postgres integer column limit; also rejects negative/NaN/Infinity input.
const MAX_DURATION_MS = 2_147_483_647;

function parseDuration(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const ms = Math.round(n);
  return ms >= 0 && ms <= MAX_DURATION_MS ? ms : null;
}

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

  // Resolve the rate-limit bucket's status from the query string. A POST body
  // can override the recorded status later, but the bucket is keyed by query
  // param so the common start→success lifecycle doesn't rate-limit itself.
  // 'success' is the default, matching the handler's initial pingStatus below.
  const url = new URL(req.url);
  const qStatus = url.searchParams.get('status');
  const rlStatus: 'start' | 'fail' | 'success' =
    qStatus === 'start' || qStatus === 'fail' ? qStatus : 'success';

  // Rate limit: max 1 ping per second per slug per status
  const rlKey = redisKeys.pingRateLimit(monitorSlug, rlStatus);
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
      return NextResponse.json(
        { ok: false, error: 'Monitor not found' },
        { status: 404 },
      );
    }

    monitor = dbMonitor;
    await redis.set(cacheKey, monitor, { ex: 300 });
  }

  if (monitor.isPaused) {
    return NextResponse.json({ ok: true, paused: true });
  }

  // From here on, monitor exists. Errors return 200 to not break cron jobs.
  try {
    let pingStatus: 'success' | 'fail' | 'start' = rlStatus;
    let duration: number | null = null;
    let body: string | null = null;

    const qDuration = url.searchParams.get('duration');
    if (qDuration) duration = parseDuration(qDuration);

    if (req.method === 'POST') {
      try {
        const json = await req.json();
        if (json.status === 'fail') pingStatus = 'fail';
        if (json.status === 'start') pingStatus = 'start';
        if (json.duration != null) duration = parseDuration(json.duration);
        if (json.body) body = String(json.body).slice(0, 10000);
      } catch {
        // Body parsing is optional, ignore errors
      }
    }

    // Only success pings reset the deadline. Start pings don't touch it.
    // Fail pings clear it so the checker sees the monitor as late — otherwise
    // a fresh lastPing from a prior success would make !isLate && status=down,
    // which the checker would misread as a recovery and instantly resolve
    // the explicit_failure incident.
    if (pingStatus === 'success') {
      const ttl =
        monitor.expectedInterval + monitor.gracePeriod + REDIS_TTL_BUFFER;
      await redis.set(redisKeys.lastPing(monitor.id), now, { ex: ttl });
    } else if (pingStatus === 'fail') {
      await redis.del(redisKeys.lastPing(monitor.id));
    }

    const sourceIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      null;

    after(async () => {
      try {
        if (pingStatus === 'start') {
          // Check if already running (overlap detection)
          const [fullMonitor] = await db
            .select()
            .from(monitors)
            .where(eq(monitors.id, monitor.id))
            .limit(1);

          if (fullMonitor?.isRunning) {
            // Skip if an overlap incident is already open (e.g. the start
            // ping was retried) so we don't stack duplicates.
            const [openOverlap] = await db
              .select({ id: incidents.id })
              .from(incidents)
              .where(
                and(
                  eq(incidents.monitorId, monitor.id),
                  eq(incidents.cause, 'overlap'),
                  isNull(incidents.resolvedAt),
                ),
              )
              .limit(1);

            if (!openOverlap) {
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
                await dispatchAlerts(fullMonitor, 'monitor.overlap', incident);
              } catch (alertErr) {
                console.error(
                  `Overlap alert failed for monitor ${monitor.id}:`,
                  alertErr,
                );
              }
            }
          }

          await db
            .update(monitors)
            .set({
              isRunning: true,
              lastStartAt: new Date(now),
              updatedAt: new Date(now),
            })
            .where(eq(monitors.id, monitor.id));
        } else if (pingStatus === 'fail') {
          // Fail ping: mark monitor down, create incident if none open
          const [fullMonitor] = await db
            .update(monitors)
            .set({
              lastPingAt: new Date(now),
              status: 'down',
              isRunning: false,
              updatedAt: new Date(now),
            })
            .where(eq(monitors.id, monitor.id))
            .returning();

          // Check for open incidents to avoid duplicates
          const [openIncident] = await db
            .select({ id: incidents.id })
            .from(incidents)
            .where(
              and(
                eq(incidents.monitorId, monitor.id),
                isNull(incidents.resolvedAt),
              ),
            )
            .limit(1);

          if (fullMonitor && !openIncident) {
            const [incident] = await db
              .insert(incidents)
              .values({
                monitorId: monitor.id,
                startedAt: new Date(now),
                cause: 'explicit_failure',
                alertsSent: 1,
              })
              .returning();

            try {
              await dispatchAlerts(fullMonitor, 'monitor.down', incident);
            } catch (alertErr) {
              console.error(
                `Fail alert failed for monitor ${monitor.id}:`,
                alertErr,
              );
            }
          }
        } else {
          // Success ping: mark up, clear isRunning
          const [fullMonitor] = await db
            .update(monitors)
            .set({
              lastPingAt: new Date(now),
              status: 'up',
              isRunning: false,
              updatedAt: new Date(now),
            })
            .where(eq(monitors.id, monitor.id))
            .returning();

          // Resolve all open incidents, newest first for the alert payload
          const openIncidents = await db
            .select()
            .from(incidents)
            .where(
              and(
                eq(incidents.monitorId, monitor.id),
                isNull(incidents.resolvedAt),
              ),
            )
            .orderBy(desc(incidents.startedAt));

          if (openIncidents.length > 0) {
            // Resolve before alerting so a failed alert can't leave open
            // incidents on a monitor that's already marked up.
            await db
              .update(incidents)
              .set({ resolvedAt: new Date(now) })
              .where(
                and(
                  eq(incidents.monitorId, monitor.id),
                  isNull(incidents.resolvedAt),
                ),
              );

            if (fullMonitor) {
              const latest = openIncidents[0];
              const resolvedIncident: Incident = {
                ...latest,
                resolvedAt: new Date(now),
              };

              try {
                await dispatchAlerts(
                  fullMonitor,
                  'monitor.up',
                  resolvedIncident,
                );
              } catch (alertErr) {
                console.error(
                  `Recovery alert failed for incident ${latest.id}:`,
                  alertErr,
                );
              }
            }
          }
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
      } catch (err) {
        console.error('Background ping sync failed:', err);
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Ping endpoint error:', err);
    return NextResponse.json({ ok: true });
  }
}
