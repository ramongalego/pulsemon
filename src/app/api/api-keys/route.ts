import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { createHash } from 'crypto';
import { checkMutationRateLimit } from '@/lib/rate-limit';

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
});

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

  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, session.user.id))
    .orderBy(apiKeys.createdAt);

  return NextResponse.json({ data: keys, error: null });
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

  const limited = await checkMutationRateLimit(session.user.id);
  if (limited) return limited;

  try {
    const body = await req.json();
    const parsed = createKeySchema.safeParse(body);

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

    // Generate key: pm_<nanoid>
    const rawKey = `pm_${nanoid(32)}`;
    const keyPrefix = rawKey.slice(0, 10) + '...';
    const keyHash = hashKey(rawKey);

    const [apiKey] = await db
      .insert(apiKeys)
      .values({
        userId: session.user.id,
        name: parsed.data.name,
        keyHash,
        keyPrefix,
      })
      .returning();

    // Return the full key ONCE — it won't be retrievable again
    return NextResponse.json(
      {
        data: { ...apiKey, rawKey },
        error: null,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create API key' },
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
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

  const limited = await checkMutationRateLimit(session.user.id);
  if (limited) return limited;

  const url = new URL(req.url);
  const keyId = url.searchParams.get('id');

  if (!keyId) {
    return NextResponse.json(
      {
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Missing key id' },
      },
      { status: 400 },
    );
  }

  await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, session.user.id)));

  return NextResponse.json({ data: { deleted: true }, error: null });
}
