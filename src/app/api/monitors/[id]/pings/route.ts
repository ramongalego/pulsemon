import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { monitors, pings } from '@/lib/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { parsePageParam } from '@/lib/utils';
import { getUserPlan, getPlanLimits } from '@/lib/plan-limits';

const PAGE_SIZE = 10;

export async function GET(
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

  // Verify ownership
  const [monitor] = await db
    .select({ id: monitors.id })
    .from(monitors)
    .where(and(eq(monitors.id, id), eq(monitors.userId, session.user.id)))
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

  const plan = await getUserPlan(session.user.id);
  const limits = getPlanLimits(plan);
  const retentionCutoff = new Date(
    Date.now() - limits.pingHistoryDays * 24 * 60 * 60 * 1000,
  );

  const page = parsePageParam(req.nextUrl.searchParams.get('page'));
  const offset = (page - 1) * PAGE_SIZE;

  const rows = await db
    .select()
    .from(pings)
    .where(and(eq(pings.monitorId, id), gte(pings.receivedAt, retentionCutoff)))
    .orderBy(desc(pings.receivedAt))
    .limit(PAGE_SIZE + 1) // fetch one extra to know if there's a next page
    .offset(offset);

  const hasMore = rows.length > PAGE_SIZE;
  const data = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  return NextResponse.json({ data, hasMore, page, error: null });
}
