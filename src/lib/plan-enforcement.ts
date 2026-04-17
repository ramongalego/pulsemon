import { db } from '@/lib/db';
import { monitors, alertChannels, statusPages } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getUserPlan, getPlanLimits } from '@/lib/plan-limits';
import type { Plan, PlanLimits } from '@/types';

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

const COUNT_EXPR = sql<number>`cast(count(*) as int)`;

export async function getUserUsage(userId: string): Promise<ResourceUsage> {
  const [monitorRows, channelRows, pageRows] = await Promise.all([
    db
      .select({ count: COUNT_EXPR })
      .from(monitors)
      .where(eq(monitors.userId, userId)),
    db
      .select({ count: COUNT_EXPR })
      .from(alertChannels)
      .where(eq(alertChannels.userId, userId)),
    db
      .select({ count: COUNT_EXPR })
      .from(statusPages)
      .where(eq(statusPages.userId, userId)),
  ]);

  return {
    monitors: monitorRows[0]?.count ?? 0,
    alertChannels: channelRows[0]?.count ?? 0,
    statusPages: pageRows[0]?.count ?? 0,
  };
}

export async function checkPlanLimit(
  userId: string,
  resource: 'monitors' | 'alertChannels' | 'statusPages',
  knownPlan?: Plan,
): Promise<PlanLimitCheck> {
  // Allow callers that already fetched the plan to skip the second lookup.
  const plan = knownPlan ?? (await getUserPlan(userId));
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
  const [row] = await db
    .select({ count: COUNT_EXPR })
    .from(table)
    .where(eq(table.userId, userId));

  return row?.count ?? 0;
}

export function isOverLimit(usage: ResourceUsage, limits: PlanLimits): boolean {
  return (
    usage.monitors > limits.monitors ||
    usage.alertChannels > limits.alertChannels ||
    usage.statusPages > limits.statusPages
  );
}
