import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { monitors } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createMonitorSchema } from '@/lib/validations/monitor';
import { getUserPlan, getPlanLimits } from '@/lib/plan-limits';
import { checkPlanLimit } from '@/lib/plan-enforcement';
import { defaultGracePeriod } from '@/lib/monitoring/constants';

export async function GET() {
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

  const userMonitors = await db
    .select()
    .from(monitors)
    .where(eq(monitors.userId, session.user.id))
    .orderBy(monitors.createdAt);

  return NextResponse.json({ data: userMonitors, error: null });
}

export async function POST(req: NextRequest) {
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

  try {
    const body = await req.json();
    const parsed = createMonitorSchema.safeParse(body);

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

    const { name, slug, expectedInterval, tags } = parsed.data;
    const gracePeriod =
      parsed.data.gracePeriod ?? defaultGracePeriod(expectedInterval);

    // Check plan limits
    const plan = await getUserPlan(session.user.id);
    const limits = getPlanLimits(plan);

    const { allowed, limit } = await checkPlanLimit(
      session.user.id,
      'monitors',
    );
    if (!allowed) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'PLAN_LIMIT',
            message: `Your ${plan} plan allows ${limit} monitor${limit === 1 ? '' : 's'}. Upgrade to add more.`,
          },
        },
        { status: 403 },
      );
    }

    if (expectedInterval < limits.checkInterval) {
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

    // Check slug uniqueness
    const existing = await db
      .select({ id: monitors.id })
      .from(monitors)
      .where(eq(monitors.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'SLUG_TAKEN',
            message: 'A monitor with this slug already exists',
          },
        },
        { status: 409 },
      );
    }

    const [monitor] = await db
      .insert(monitors)
      .values({
        userId: session.user.id,
        name,
        slug,
        expectedInterval,
        gracePeriod,
        tags,
      })
      .returning();

    return NextResponse.json({ data: monitor, error: null }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create monitor' },
      },
      { status: 500 },
    );
  }
}
