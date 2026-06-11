import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/api-key-auth';
import { db } from '@/lib/db';
import { monitors, incidents } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { parsePageParam } from '@/lib/utils';
import { checkApiKeyRateLimit } from '@/lib/rate-limit';

const PAGE_SIZE = 10;

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

  const limited = await checkApiKeyRateLimit(apiKey.userId);
  if (limited) return limited;

  const { id } = await params;

  const [monitor] = await db
    .select({ id: monitors.id })
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

  const page = parsePageParam(req.nextUrl.searchParams.get('page'));
  const offset = (page - 1) * PAGE_SIZE;

  const rows = await db
    .select()
    .from(incidents)
    .where(eq(incidents.monitorId, id))
    .orderBy(desc(incidents.startedAt))
    .limit(PAGE_SIZE + 1)
    .offset(offset);

  const hasMore = rows.length > PAGE_SIZE;
  const data = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  return NextResponse.json({ data, hasMore, page, error: null });
}
