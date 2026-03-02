import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { alertChannels } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createAlertChannelSchema } from '@/lib/validations/alert-channel';
import { getUserPlan, getPlanLimits } from '@/lib/plan-limits';
import { checkPlanLimit } from '@/lib/plan-enforcement';
import type { AlertChannelType } from '@/types';

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

  const channels = await db
    .select()
    .from(alertChannels)
    .where(eq(alertChannels.userId, session.user.id))
    .orderBy(alertChannels.createdAt);

  return NextResponse.json({ data: channels, error: null });
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
    const parsed = createAlertChannelSchema.safeParse(body);

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

    // Check plan limits
    const plan = await getUserPlan(session.user.id);
    const limits = getPlanLimits(plan);
    const requestedType = parsed.data.type as AlertChannelType;

    // Check if channel type is allowed on this plan
    if (!limits.allowedChannelTypes.includes(requestedType)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'PLAN_LIMIT',
            message: `Custom webhooks are not available on the ${plan} plan. Upgrade to Pro to use webhooks.`,
          },
        },
        { status: 403 },
      );
    }

    // Check total channel count
    const { allowed, limit } = await checkPlanLimit(
      session.user.id,
      'alertChannels',
    );
    if (!allowed) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'PLAN_LIMIT',
            message: `Your ${plan} plan allows ${limit} alert channel${limit === 1 ? '' : 's'}. Upgrade to add more.`,
          },
        },
        { status: 403 },
      );
    }

    // Check non-email type diversity (free plan: email + 1 other type)
    const existing = await db
      .select({ id: alertChannels.id, type: alertChannels.type })
      .from(alertChannels)
      .where(eq(alertChannels.userId, session.user.id));

    if (requestedType !== 'email') {
      const existingNonEmailTypes = new Set(
        existing.filter((c) => c.type !== 'email').map((c) => c.type),
      );

      if (
        !existingNonEmailTypes.has(requestedType) &&
        existingNonEmailTypes.size >= limits.maxNonEmailTypes
      ) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: 'PLAN_LIMIT',
              message: `Your ${plan} plan allows email plus ${limits.maxNonEmailTypes} other integration type${limits.maxNonEmailTypes === 1 ? '' : 's'}. Upgrade to use more integration types.`,
            },
          },
          { status: 403 },
        );
      }
    }

    const [channel] = await db
      .insert(alertChannels)
      .values({
        userId: session.user.id,
        type: parsed.data.type,
        config: parsed.data.config,
        isDefault: parsed.data.isDefault,
      })
      .returning();

    return NextResponse.json({ data: channel, error: null }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create alert channel',
        },
      },
      { status: 500 },
    );
  }
}
