import { NextRequest, NextResponse } from 'next/server';
import { handlers } from '@/lib/auth';
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  prefix: 'rl:auth',
});

export const { GET } = handlers;

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    );
  }

  return handlers.POST(req);
}
