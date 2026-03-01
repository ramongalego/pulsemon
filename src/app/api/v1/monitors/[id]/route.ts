import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/api-key-auth';
import { db } from '@/lib/db';
import { monitors } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { redis, redisKeys } from '@/lib/redis';
import { updateMonitorSchema } from '@/lib/validations/monitor';
import { getUserPlan, getPlanLimits } from '@/lib/plan-limits';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const apiKey = await verifyApiKey(req);
  if (!apiKey) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or missing API key',
        },
      },
      { status: 401 },
    );
  }

  const { id } = await params;

  const [monitor] = await db
    .select()
    .from(monitors)
    .where(and(eq(monitors.id, id), eq(monitors.userId, apiKey.userId)))
    .limit(1);

  if (!monitor) {
    return NextResponse.json(
      {
        data: null,
        error: { code: 'NOT_FOUND', message: 'Monitor not found' },
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: monitor, error: null });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const apiKey = await verifyApiKey(req);
  if (!apiKey) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or missing API key',
        },
      },
      { status: 401 },
    );
  }

  const { id } = await params;

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
      const plan = await getUserPlan(apiKey.userId);
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

    const [existing] = await db
      .select({ id: monitors.id, slug: monitors.slug })
      .from(monitors)
      .where(and(eq(monitors.id, id), eq(monitors.userId, apiKey.userId)))
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
      .where(eq(monitors.id, id))
      .returning();

    await redis.del(redisKeys.slugToMonitor(existing.slug));

    return NextResponse.json({ data: updated, error: null });
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update monitor',
        },
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const apiKey = await verifyApiKey(req);
  if (!apiKey) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or missing API key',
        },
      },
      { status: 401 },
    );
  }

  const { id } = await params;

  const [existing] = await db
    .select({ id: monitors.id, slug: monitors.slug })
    .from(monitors)
    .where(and(eq(monitors.id, id), eq(monitors.userId, apiKey.userId)))
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

  await db.delete(monitors).where(eq(monitors.id, id));

  await redis.del(redisKeys.slugToMonitor(existing.slug));
  await redis.del(redisKeys.lastPing(existing.id));

  return NextResponse.json({ data: { deleted: true }, error: null });
}
