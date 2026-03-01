import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { PLAN_LIMITS } from '@/lib/monitoring/constants';
import type { Plan, PlanLimits } from '@/types';

export async function getUserPlan(userId: string): Promise<Plan> {
  const [user] = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return (user?.plan as Plan) ?? 'free';
}

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}
