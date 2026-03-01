import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Verify an API key from the Authorization header.
 * Returns the userId associated with the key, or null if invalid.
 */
export async function verifyApiKey(
  req: NextRequest,
): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer (pm_.+)$/);
  if (!match) return null;

  const rawKey = match[1];
  const keyHash = hashKey(rawKey);

  const [found] = await db
    .select({ id: apiKeys.id, userId: apiKeys.userId })
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);

  if (!found) return null;

  // Update lastUsedAt (fire-and-forget)
  void db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, found.id));

  return { userId: found.userId };
}
