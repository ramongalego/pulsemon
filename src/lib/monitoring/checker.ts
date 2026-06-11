import { db } from '@/lib/db';
import { monitors, incidents, pings } from '@/lib/db/schema';
import { redis, redisKeys } from '@/lib/redis';
import { eq, and, ne, isNull, asc, desc, inArray } from 'drizzle-orm';
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

  const now = Date.now();
  const lateById = new Map<string, boolean>();
  for (let i = 0; i < activeMonitors.length; i++) {
    const monitor = activeMonitors[i];
    lateById.set(
      monitor.id,
      isMonitorLate(
        lastPingTimes[i],
        monitor.expectedInterval,
        monitor.gracePeriod,
        now,
      ),
    );
  }

  const monitorsWithMaxDuration = activeMonitors.filter(
    (m) => m.maxDuration !== null,
  );

  // Batch-fetch every open incident the loops below could need, instead of
  // querying per monitor. Oldest first, so [0] is the primary incident.
  const incidentLookupIds = new Set<string>(
    monitorsWithMaxDuration.map((m) => m.id),
  );
  for (const monitor of activeMonitors) {
    if (lateById.get(monitor.id) || monitor.status === 'down') {
      incidentLookupIds.add(monitor.id);
    }
  }

  const openIncidentsByMonitor = new Map<string, Incident[]>();
  if (incidentLookupIds.size > 0) {
    const openIncidents = await db
      .select()
      .from(incidents)
      .where(
        and(
          inArray(incidents.monitorId, [...incidentLookupIds]),
          isNull(incidents.resolvedAt),
        ),
      )
      .orderBy(asc(incidents.startedAt));

    for (const incident of openIncidents) {
      const list = openIncidentsByMonitor.get(incident.monitorId) ?? [];
      list.push(incident);
      openIncidentsByMonitor.set(incident.monitorId, list);
    }
  }

  for (const monitor of activeMonitors) {
    const isLate = lateById.get(monitor.id) ?? false;
    const openForMonitor = openIncidentsByMonitor.get(monitor.id) ?? [];

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

      // A fail ping may already have created an incident (explicit_failure
      // or overlap); escalate that one instead of opening a duplicate.
      const existingOpenIncident = openForMonitor[0];

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

        openIncidentsByMonitor.set(monitor.id, [...openForMonitor, incident]);
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
      // Still down: escalate if we hit the next reminder interval
      const openIncident = openForMonitor[0];
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
      const openIncident = openForMonitor[0];

      if (openIncident) {
        const resolvedIncident = {
          ...openIncident,
          resolvedAt: new Date(now),
        };

        // Best-effort alert: resolve incident and update status regardless,
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

        // Keep the in-cycle view coherent for the duration checks below
        openIncidentsByMonitor.set(
          monitor.id,
          openForMonitor.filter((i) => i.id !== openIncident.id),
        );
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

  // Duration threshold checks. Latest ping per monitor in one query
  // (DISTINCT ON walks the (monitor_id, received_at) index).
  if (monitorsWithMaxDuration.length > 0) {
    const latestPings = await db
      .selectDistinctOn([pings.monitorId], {
        monitorId: pings.monitorId,
        duration: pings.duration,
      })
      .from(pings)
      .where(
        inArray(
          pings.monitorId,
          monitorsWithMaxDuration.map((m) => m.id),
        ),
      )
      .orderBy(pings.monitorId, desc(pings.receivedAt));

    const latestPingByMonitor = new Map(
      latestPings.map((p) => [p.monitorId, p]),
    );

    for (const monitor of monitorsWithMaxDuration) {
      const latestPing = latestPingByMonitor.get(monitor.id);
      if (!latestPing || latestPing.duration === null) continue;

      const openDurationIncident = (
        openIncidentsByMonitor.get(monitor.id) ?? []
      ).find((i) => i.cause === 'duration_exceeded');

      if (isDurationExceeded(latestPing.duration, monitor.maxDuration)) {
        if (!openDurationIncident) {
          // Create incident and alert
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
      } else if (openDurationIncident) {
        // Duration is back within threshold: resolve the open incident
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
