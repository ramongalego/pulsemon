import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { monitors } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ status: 'unknown' }, { status: 401 });
  }

  const { id } = await params;

  const [monitor] = await db
    .select({ status: monitors.status, lastPingAt: monitors.lastPingAt })
    .from(monitors)
    .where(and(eq(monitors.id, id), eq(monitors.userId, session.user.id)))
    .limit(1);

  if (!monitor) {
    return NextResponse.json({ status: 'unknown' }, { status: 404 });
  }

  return NextResponse.json({
    status: monitor.status,
    lastPingAt: monitor.lastPingAt,
  });
}
