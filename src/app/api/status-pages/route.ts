import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { statusPages, statusPageMonitors } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { createStatusPageSchema } from '@/lib/validations/status-page';
import { getUserPlan, getPlanLimits } from '@/lib/plan-limits';

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

  const pages = await db
    .select({
      id: statusPages.id,
      title: statusPages.title,
      slug: statusPages.slug,
      description: statusPages.description,
      isPublic: statusPages.isPublic,
      showOverallUptime: statusPages.showOverallUptime,
      showIncidentHistory: statusPages.showIncidentHistory,
      createdAt: statusPages.createdAt,
      updatedAt: statusPages.updatedAt,
      monitorCount: sql<number>`cast(count(${statusPageMonitors.monitorId}) as int)`,
    })
    .from(statusPages)
    .leftJoin(
      statusPageMonitors,
      eq(statusPages.id, statusPageMonitors.statusPageId),
    )
    .where(eq(statusPages.userId, session.user.id))
    .groupBy(statusPages.id)
    .orderBy(statusPages.createdAt);

  return NextResponse.json({ data: pages, error: null });
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
    const parsed = createStatusPageSchema.safeParse(body);

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

    const { title, slug, description } = parsed.data;

    // Check plan limits
    const plan = await getUserPlan(session.user.id);
    const limits = getPlanLimits(plan);

    const existing = await db
      .select({ id: statusPages.id })
      .from(statusPages)
      .where(eq(statusPages.userId, session.user.id));

    if (existing.length >= limits.statusPages) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'PLAN_LIMIT',
            message: `Your ${plan} plan allows ${limits.statusPages} status page${limits.statusPages === 1 ? '' : 's'}. Upgrade to add more.`,
          },
        },
        { status: 403 },
      );
    }

    // Check slug uniqueness
    const slugExists = await db
      .select({ id: statusPages.id })
      .from(statusPages)
      .where(eq(statusPages.slug, slug))
      .limit(1);

    if (slugExists.length > 0) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'SLUG_TAKEN',
            message: 'A status page with this slug already exists',
          },
        },
        { status: 409 },
      );
    }

    const [page] = await db
      .insert(statusPages)
      .values({
        userId: session.user.id,
        title,
        slug,
        description: description ?? null,
      })
      .returning();

    return NextResponse.json({ data: page, error: null }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create status page',
        },
      },
      { status: 500 },
    );
  }
}
