import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/api-key-auth';
import { db } from '@/lib/db';
import { monitors } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { redis, redisKeys } from '@/lib/redis';
import { checkApiKeyRateLimit } from '@/lib/rate-limit';

export async function POST(
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
    .set({ isPaused: false, updatedAt: new Date() })
    .where(and(eq(monitors.id, id), eq(monitors.userId, apiKey.userId)))
    .returning();

  await redis.del(redisKeys.slugToMonitor(existing.slug));

  return NextResponse.json({ data: updated, error: null });
}
