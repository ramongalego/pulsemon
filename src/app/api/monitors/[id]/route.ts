import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { monitors } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { redis, redisKeys } from '@/lib/redis';
import { updateMonitorSchema } from '@/lib/validations/monitor';
import { getUserPlan, getPlanLimits } from '@/lib/plan-limits';
import { checkMutationRateLimit } from '@/lib/rate-limit';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      {
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      },
      { status: 401 },
    );
  }

  const { id } = await params;

  const limited = await checkMutationRateLimit(session.user.id);
  if (limited) return limited;

  try {
    const body = await req.json();
    const parsed = updateMonitorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues.map((i) => i.message).join(', '),
          },
        },
        { status: 400 },
      );
    }

    // Validate check interval against plan limits
    if (parsed.data.expectedInterval !== undefined) {
      const plan = await getUserPlan(session.user.id);
      const limits = getPlanLimits(plan);

      if (parsed.data.expectedInterval < limits.checkInterval) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: 'PLAN_LIMIT',
              message: `Your ${plan} plan requires a minimum check interval of ${limits.checkInterval} seconds. Upgrade for faster intervals.`,
            },
          },
          { status: 403 },
        );
      }
    }

    // Verify ownership and get current monitor (need slug for cache invalidation)
    const [existing] = await db
      .select({ id: monitors.id, slug: monitors.slug })
      .from(monitors)
      .where(and(eq(monitors.id, id), eq(monitors.userId, session.user.id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        {
          data: null,
          error: { code: 'NOT_FOUND', message: 'Monitor not found' },
        },
        { status: 404 },
      );
    }

    const [updated] = await db
      .update(monitors)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(monitors.id, id), eq(monitors.userId, session.user.id)))
      .returning();

    // Issue #3: Invalidate Redis slug cache so changes (especially isPaused) take effect immediately
    await redis.del(redisKeys.slugToMonitor(existing.slug));

    return NextResponse.json({ data: updated, error: null });
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update monitor' },
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      {
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      },
      { status: 401 },
    );
  }

  const { id } = await params;

  const limited = await checkMutationRateLimit(session.user.id);
  if (limited) return limited;

  // Verify ownership and get slug for cache cleanup
  const [existing] = await db
    .select({ id: monitors.id, slug: monitors.slug })
    .from(monitors)
    .where(and(eq(monitors.id, id), eq(monitors.userId, session.user.id)))
    .limit(1);

  if (!existing) {
    return NextResponse.json(
      {
        data: null,
        error: { code: 'NOT_FOUND', message: 'Monitor not found' },
      },
      { status: 404 },
    );
  }

  await db
    .delete(monitors)
    .where(and(eq(monitors.id, id), eq(monitors.userId, session.user.id)));

  // Clean up Redis cache
  await redis.del(redisKeys.slugToMonitor(existing.slug));
  await redis.del(redisKeys.lastPing(existing.id));

  return NextResponse.json({ data: { deleted: true }, error: null });
}
