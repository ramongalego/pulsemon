import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/api-key-auth';
import { db } from '@/lib/db';
import { monitors } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createMonitorSchema } from '@/lib/validations/monitor';
import { getUserPlan, getPlanLimits } from '@/lib/plan-limits';
import { defaultGracePeriod } from '@/lib/monitoring/constants';

export async function GET(req: NextRequest) {
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

  const userMonitors = await db
    .select()
    .from(monitors)
    .where(eq(monitors.userId, apiKey.userId))
    .orderBy(monitors.createdAt);

  return NextResponse.json({ data: userMonitors, error: null });
}

export async function POST(req: NextRequest) {
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
    const plan = await getUserPlan(apiKey.userId);
    const limits = getPlanLimits(plan);

    const existingMonitors = await db
      .select({ id: monitors.id })
      .from(monitors)
      .where(eq(monitors.userId, apiKey.userId));

    if (existingMonitors.length >= limits.monitors) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'PLAN_LIMIT',
            message: `Your ${plan} plan allows ${limits.monitors} monitor${limits.monitors === 1 ? '' : 's'}. Upgrade to add more.`,
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
        userId: apiKey.userId,
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
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create monitor',
        },
      },
      { status: 500 },
    );
  }
}
