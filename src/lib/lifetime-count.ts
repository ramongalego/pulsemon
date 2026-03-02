import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { redis, redisKeys } from '@/lib/redis';

const CACHE_TTL = 300; // 5 minutes

export async function getLifetimeCount(): Promise<number> {
  const cached = await redis.get<number>(redisKeys.lifetimeCount);
  if (cached !== null) return cached;

  const [result] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(users)
    .where(eq(users.plan, 'lifetime'));

  const count = result?.count ?? 0;
  await redis.set(redisKeys.lifetimeCount, count, { ex: CACHE_TTL });
  return count;
}

export async function invalidateLifetimeCount(): Promise<void> {
  await redis.del(redisKeys.lifetimeCount);
}
