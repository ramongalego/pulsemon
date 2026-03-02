import { db } from '@/lib/db';
import { monitors, alertChannels, statusPages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserPlan, getPlanLimits } from '@/lib/plan-limits';
import type { PlanLimits } from '@/types';

export interface ResourceUsage {
  monitors: number;
  alertChannels: number;
  statusPages: number;
}

export interface PlanLimitCheck {
  allowed: boolean;
  current: number;
  limit: number;
}

export async function getUserUsage(userId: string): Promise<ResourceUsage> {
  const [monitorRows, channelRows, pageRows] = await Promise.all([
    db
      .select({ id: monitors.id })
      .from(monitors)
      .where(eq(monitors.userId, userId)),
    db
      .select({ id: alertChannels.id })
      .from(alertChannels)
      .where(eq(alertChannels.userId, userId)),
    db
      .select({ id: statusPages.id })
      .from(statusPages)
      .where(eq(statusPages.userId, userId)),
  ]);

  return {
    monitors: monitorRows.length,
    alertChannels: channelRows.length,
    statusPages: pageRows.length,
  };
}

export async function checkPlanLimit(
  userId: string,
  resource: 'monitors' | 'alertChannels' | 'statusPages',
): Promise<PlanLimitCheck> {
  const plan = await getUserPlan(userId);
  const limits = getPlanLimits(plan);

  const usage = await getResourceCount(userId, resource);
  const limit = limits[resource] as number;

  return {
    allowed: usage < limit,
    current: usage,
    limit,
  };
}

async function getResourceCount(
  userId: string,
  resource: 'monitors' | 'alertChannels' | 'statusPages',
): Promise<number> {
  const tableMap = {
    monitors,
    alertChannels,
    statusPages,
  } as const;

  const table = tableMap[resource];
  const rows = await db
    .select({ id: table.id })
    .from(table)
    .where(eq(table.userId, userId));

  return rows.length;
}

export function isOverLimit(usage: ResourceUsage, limits: PlanLimits): boolean {
  return (
    usage.monitors > limits.monitors ||
    usage.alertChannels > limits.alertChannels ||
    usage.statusPages > limits.statusPages
  );
}
