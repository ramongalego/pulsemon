import { db } from '@/lib/db';
import { monitors, incidents, pings } from '@/lib/db/schema';
import { redis, redisKeys } from '@/lib/redis';
import { eq, and, ne, isNull, desc } from 'drizzle-orm';
import { dispatchAlerts } from './alerter';
import { isMonitorLate, shouldSendReminder, isDurationExceeded } from './utils';
import type { Monitor, Incident } from '@/lib/db/schema';

async function maybeEscalate(
  monitor: Monitor,
  incident: Incident,
  now: number,
): Promise<void> {
  if (!shouldSendReminder(incident.startedAt, incident.alertsSent, now)) return;
  await dispatchAlerts(monitor, 'monitor.down', incident);
  await db
    .update(incidents)
    .set({ alertsSent: incident.alertsSent + 1 })
    .where(eq(incidents.id, incident.id));
}

export type CheckResult = {
  monitorId: string;
  monitorName: string;
  slug: string;
  previousStatus: string;
  newStatus: 'up' | 'down';
  action:
    | 'none'
    | 'went_down'
    | 'recovered'
    | 'still_down'
    | 'slow'
    | 'slow_recovered';
};

export async function checkMonitors(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  // Get all active monitors (not paused, not new)
  const activeMonitors = await db
    .select()
    .from(monitors)
    .where(and(eq(monitors.isPaused, false), ne(monitors.status, 'new')));

  if (activeMonitors.length === 0) return results;

  // Batch check Redis for last ping timestamps
  const redisKeysToCheck = activeMonitors.map((m) => redisKeys.lastPing(m.id));
  const lastPingTimes = await redis.mget<(number | null)[]>(
    ...redisKeysToCheck,
  );

  for (let i = 0; i < activeMonitors.length; i++) {
    const monitor = activeMonitors[i];
    const lastPing = lastPingTimes[i];
    const now = Date.now();

    const isLate = isMonitorLate(
      lastPing,
      monitor.expectedInterval,
      monitor.gracePeriod,
      now,
    );

    if (isLate && monitor.status !== 'down') {
      // Atomically set status to 'down' only if it hasn't been set already
      // (guards against overlapping checker runs / QStash retries)
      const [updated] = await db
        .update(monitors)
        .set({ status: 'down', updatedAt: new Date(now) })
        .where(and(eq(monitors.id, monitor.id), ne(monitors.status, 'down')))
        .returning({ id: monitors.id });

      if (!updated) {
        results.push({
          monitorId: monitor.id,
          monitorName: monitor.name,
          slug: monitor.slug,
          previousStatus: monitor.status,
          newStatus: 'down',
          action: 'none',
        });
        continue;
      }

      // Check if a fail ping already created an incident (explicit_failure or overlap)
      const [existingOpenIncident] = await db
        .select()
        .from(incidents)
        .where(
          and(
            eq(incidents.monitorId, monitor.id),
            isNull(incidents.resolvedAt),
          ),
        )
        .limit(1);

      if (existingOpenIncident) {
        await maybeEscalate(monitor, existingOpenIncident, now);
      } else {
        const [incident] = await db
          .insert(incidents)
          .values({
            monitorId: monitor.id,
            startedAt: new Date(now),
            cause: 'missed_ping',
            alertsSent: 1,
          })
          .returning();

        await dispatchAlerts(monitor, 'monitor.down', incident);
      }

      results.push({
        monitorId: monitor.id,
        monitorName: monitor.name,
        slug: monitor.slug,
        previousStatus: monitor.status,
        newStatus: 'down',
        action: 'went_down',
      });
    } else if (isLate && monitor.status === 'down') {
      // Still down — escalate if we hit the next reminder interval
      const [openIncident] = await db
        .select()
        .from(incidents)
        .where(
          and(
            eq(incidents.monitorId, monitor.id),
            isNull(incidents.resolvedAt),
          ),
        )
        .limit(1);

      if (openIncident) {
        await maybeEscalate(monitor, openIncident, now);
      }

      results.push({
        monitorId: monitor.id,
        monitorName: monitor.name,
        slug: monitor.slug,
        previousStatus: 'down',
        newStatus: 'down',
        action: 'still_down',
      });
    } else if (!isLate && monitor.status === 'down') {
      // Monitor recovered
      const [openIncident] = await db
        .select()
        .from(incidents)
        .where(
          and(
            eq(incidents.monitorId, monitor.id),
            isNull(incidents.resolvedAt),
          ),
        )
        .limit(1);

      if (openIncident) {
        const resolvedIncident = {
          ...openIncident,
          resolvedAt: new Date(now),
        };

        // Best-effort alert — resolve incident and update status regardless,
        // so a transient alert failure doesn't orphan the incident forever.
        try {
          await dispatchAlerts(monitor, 'monitor.up', resolvedIncident);
        } catch (err) {
          console.error(
            `Recovery alert failed for incident ${openIncident.id}:`,
            err,
          );
        }

        await Promise.all([
          db
            .update(incidents)
            .set({ resolvedAt: new Date(now) })
            .where(eq(incidents.id, openIncident.id)),
          db
            .update(monitors)
            .set({ status: 'up', updatedAt: new Date(now) })
            .where(eq(monitors.id, monitor.id)),
        ]);
      } else {
        await db
          .update(monitors)
          .set({ status: 'up', updatedAt: new Date(now) })
          .where(eq(monitors.id, monitor.id));
      }

      results.push({
        monitorId: monitor.id,
        monitorName: monitor.name,
        slug: monitor.slug,
        previousStatus: 'down',
        newStatus: 'up',
        action: 'recovered',
      });
    } else {
      results.push({
        monitorId: monitor.id,
        monitorName: monitor.name,
        slug: monitor.slug,
        previousStatus: monitor.status,
        newStatus: 'up',
        action: 'none',
      });
    }
  }

  // Duration threshold checks
  const monitorsWithMaxDuration = activeMonitors.filter(
    (m) => m.maxDuration !== null,
  );

  for (const monitor of monitorsWithMaxDuration) {
    const [latestPing] = await db
      .select({ id: pings.id, duration: pings.duration, body: pings.body })
      .from(pings)
      .where(eq(pings.monitorId, monitor.id))
      .orderBy(desc(pings.receivedAt))
      .limit(1);

    if (!latestPing || latestPing.duration === null) continue;

    // Check for open duration_exceeded incident
    const [openDurationIncident] = await db
      .select()
      .from(incidents)
      .where(
        and(
          eq(incidents.monitorId, monitor.id),
          eq(incidents.cause, 'duration_exceeded'),
          isNull(incidents.resolvedAt),
        ),
      )
      .limit(1);

    if (isDurationExceeded(latestPing.duration, monitor.maxDuration)) {
      if (!openDurationIncident) {
        // Create incident and alert
        const now = Date.now();
        const [incident] = await db
          .insert(incidents)
          .values({
            monitorId: monitor.id,
            startedAt: new Date(now),
            cause: 'duration_exceeded',
            alertsSent: 1,
          })
          .returning();

        await dispatchAlerts(monitor, 'monitor.slow', incident, {
          lastPingDuration: latestPing.duration,
        });

        results.push({
          monitorId: monitor.id,
          monitorName: monitor.name,
          slug: monitor.slug,
          previousStatus: monitor.status,
          newStatus: monitor.status as 'up' | 'down',
          action: 'slow',
        });
      }
      // If there's already an open incident, do nothing (avoid duplicate alerts)
    } else {
      // Duration is within threshold — resolve open incident if any
      if (openDurationIncident) {
        const now = Date.now();
        const resolvedIncident = {
          ...openDurationIncident,
          resolvedAt: new Date(now),
        };

        try {
          await dispatchAlerts(monitor, 'monitor.up', resolvedIncident, {
            lastPingDuration: latestPing.duration,
          });
        } catch (err) {
          console.error(
            `Duration recovery alert failed for incident ${openDurationIncident.id}:`,
            err,
          );
        }

        await db
          .update(incidents)
          .set({ resolvedAt: new Date(now) })
          .where(eq(incidents.id, openDurationIncident.id));

        results.push({
          monitorId: monitor.id,
          monitorName: monitor.name,
          slug: monitor.slug,
          previousStatus: monitor.status,
          newStatus: monitor.status as 'up' | 'down',
          action: 'slow_recovered',
        });
      }
    }
  }

  return results;
}

// Re-export pure functions for convenience
export { isMonitorLate, shouldSendReminder } from './utils';
