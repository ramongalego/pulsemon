import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { statusPages, statusPageMonitors, monitors } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { updateStatusPageMonitorsSchema } from '@/lib/validations/status-page';
import { getUserPlan, getPlanLimits } from '@/lib/plan-limits';
import { checkMutationRateLimit } from '@/lib/rate-limit';

export async function GET(
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

  // Verify ownership
  const [page] = await db
    .select({ id: statusPages.id })
    .from(statusPages)
    .where(and(eq(statusPages.id, id), eq(statusPages.userId, session.user.id)))
    .limit(1);

  if (!page) {
    return NextResponse.json(
      {
        data: null,
        error: { code: 'NOT_FOUND', message: 'Status page not found' },
      },
      { status: 404 },
    );
  }

  const linked = await db
    .select({
      monitorId: statusPageMonitors.monitorId,
      displayName: statusPageMonitors.displayName,
      sortOrder: statusPageMonitors.sortOrder,
    })
    .from(statusPageMonitors)
    .where(eq(statusPageMonitors.statusPageId, id))
    .orderBy(statusPageMonitors.sortOrder);

  return NextResponse.json({ data: linked, error: null });
}

export async function PUT(
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
    const parsed = updateStatusPageMonitorsSchema.safeParse(body);

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

    // Verify ownership of status page
    const [page] = await db
      .select({ id: statusPages.id })
      .from(statusPages)
      .where(
        and(eq(statusPages.id, id), eq(statusPages.userId, session.user.id)),
      )
      .limit(1);

    if (!page) {
      return NextResponse.json(
        {
          data: null,
          error: { code: 'NOT_FOUND', message: 'Status page not found' },
        },
        { status: 404 },
      );
    }

    const { monitors: monitorList } = parsed.data;

    // Check plan limits
    const plan = await getUserPlan(session.user.id);
    const limits = getPlanLimits(plan);

    if (monitorList.length > limits.monitorsPerStatusPage) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'PLAN_LIMIT',
            message: `Your ${plan} plan allows ${limits.monitorsPerStatusPage} monitors per status page. Upgrade to add more.`,
          },
        },
        { status: 403 },
      );
    }

    // Verify all monitors belong to the user
    if (monitorList.length > 0) {
      const monitorIds = monitorList.map((m) => m.monitorId);
      const userMonitors = await db
        .select({ id: monitors.id })
        .from(monitors)
        .where(
          and(
            inArray(monitors.id, monitorIds),
            eq(monitors.userId, session.user.id),
          ),
        );

      if (userMonitors.length !== monitorIds.length) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: 'FORBIDDEN',
              message: 'One or more monitors do not belong to you',
            },
          },
          { status: 403 },
        );
      }
    }

    // Replace all: delete existing, then insert new
    await db
      .delete(statusPageMonitors)
      .where(eq(statusPageMonitors.statusPageId, id));

    if (monitorList.length > 0) {
      await db.insert(statusPageMonitors).values(
        monitorList.map((m) => ({
          statusPageId: id,
          monitorId: m.monitorId,
          displayName: m.displayName ?? null,
          sortOrder: m.sortOrder,
        })),
      );
    }

    return NextResponse.json({ data: { updated: true }, error: null });
  } catch (err) {
    console.error('Update status page monitors failed:', err);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update monitors',
        },
      },
      { status: 500 },
    );
  }
}
