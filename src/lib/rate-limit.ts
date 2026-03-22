import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

const mutationLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  prefix: 'rl:mutation',
});

export async function checkMutationRateLimit(userId: string) {
  const { success } = await mutationLimiter.limit(userId);
  if (!success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
        },
      },
      { status: 429 },
    );
  }
  return null;
}
