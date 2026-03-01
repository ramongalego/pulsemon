import { db } from '@/lib/db';
import { monitors, incidents } from '@/lib/db/schema';
import { redis, redisKeys } from '@/lib/redis';
import { eq, and, ne, isNull } from 'drizzle-orm';
import { dispatchAlerts } from './alerter';
import { isMonitorLate, shouldSendReminder } from './utils';

export type CheckResult = {
  monitorId: string;
  monitorName: string;
  slug: string;
  previousStatus: string;
  newStatus: 'up' | 'down';
  action: 'none' | 'went_down' | 'recovered' | 'still_down';
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
      // Monitor just went down
      const [incident] = await db
        .insert(incidents)
        .values({
          monitorId: monitor.id,
          startedAt: new Date(now),
          cause: 'missed_ping',
        })
        .returning();

      await db
        .update(monitors)
        .set({ status: 'down', updatedAt: new Date(now) })
        .where(eq(monitors.id, monitor.id));

      await dispatchAlerts(monitor, 'monitor.down', incident);

      results.push({
        monitorId: monitor.id,
        monitorName: monitor.name,
        slug: monitor.slug,
        previousStatus: monitor.status,
        newStatus: 'down',
        action: 'went_down',
      });
    } else if (isLate && monitor.status === 'down') {
      // Still down - check if we should send a reminder
      const openIncident = await db
        .select()
        .from(incidents)
        .where(
          and(
            eq(incidents.monitorId, monitor.id),
            isNull(incidents.resolvedAt),
          ),
        )
        .limit(1);

      if (openIncident.length > 0) {
        const incident = openIncident[0];
        const shouldEscalate = shouldSendReminder(
          incident.startedAt,
          incident.alertsSent,
          now,
        );

        if (shouldEscalate) {
          await dispatchAlerts(monitor, 'monitor.down', incident);
          await db
            .update(incidents)
            .set({ alertsSent: incident.alertsSent + 1 })
            .where(eq(incidents.id, incident.id));
        }
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
      const openIncident = await db
        .select()
        .from(incidents)
        .where(
          and(
            eq(incidents.monitorId, monitor.id),
            isNull(incidents.resolvedAt),
          ),
        )
        .limit(1);

      if (openIncident.length > 0) {
        const incident = openIncident[0];
        const resolvedIncident = { ...incident, resolvedAt: new Date(now) };

        // Alert first, resolve second — if alert fails, leave open for retry
        try {
          await dispatchAlerts(monitor, 'monitor.up', resolvedIncident);
          await db
            .update(incidents)
            .set({ resolvedAt: new Date(now) })
            .where(eq(incidents.id, incident.id));
        } catch (err) {
          console.error(
            `Recovery alert failed for incident ${incident.id}, leaving open for retry:`,
            err,
          );
        }
      }

      await db
        .update(monitors)
        .set({ status: 'up', updatedAt: new Date(now) })
        .where(eq(monitors.id, monitor.id));

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

  return results;
}

// Re-export pure functions for convenience
export { isMonitorLate, shouldSendReminder } from './utils';
