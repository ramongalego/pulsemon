import { db } from '@/lib/db';
import { users, monitors, pings } from '@/lib/db/schema';
import { and, lt, inArray, sql, eq } from 'drizzle-orm';
import { PLAN_LIMITS } from '@/lib/monitoring/constants';

/**
 * Deletes pings older than each user's plan retention window.
 * Joins monitors → users to get the retention cutoff per monitor directly.
 */
export async function cleanupOldPings(): Promise<{
  monitorsProcessed: number;
  totalDeleted: number;
}> {
  // Single query: join monitors + users to get each monitor's retention cutoff
  const monitorRetentions = await db
    .select({
      monitorId: monitors.id,
      plan: users.plan,
    })
    .from(monitors)
    .innerJoin(users, eq(monitors.userId, users.id));

  if (monitorRetentions.length === 0) {
    return { monitorsProcessed: 0, totalDeleted: 0 };
  }

  // Group monitors by their effective retention days
  const byRetention = new Map<number, string[]>();
  for (const row of monitorRetentions) {
    const limits = PLAN_LIMITS[row.plan] ?? PLAN_LIMITS.free;
    const days = limits.pingHistoryDays;
    const existing = byRetention.get(days) ?? [];
    existing.push(row.monitorId);
    byRetention.set(days, existing);
  }

  let totalDeleted = 0;
  const BATCH_SIZE = 100;

  for (const [retentionDays, monitorIds] of byRetention) {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    for (let i = 0; i < monitorIds.length; i += BATCH_SIZE) {
      const batch = monitorIds.slice(i, i + BATCH_SIZE);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(pings)
        .where(
          and(inArray(pings.monitorId, batch), lt(pings.receivedAt, cutoff)),
        );

      if (count > 0) {
        await db
          .delete(pings)
          .where(
            and(inArray(pings.monitorId, batch), lt(pings.receivedAt, cutoff)),
          );
        totalDeleted += count;
      }
    }
  }

  return {
    monitorsProcessed: monitorRetentions.length,
    totalDeleted,
  };
}
