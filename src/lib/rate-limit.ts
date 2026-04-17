import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

const mutationLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  prefix: 'rl:mutation',
});

const apiKeyLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(120, '60 s'),
  prefix: 'rl:apikey',
});

const feedbackLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '300 s'),
  prefix: 'rl:feedback',
});

function rateLimitedResponse() {
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

export async function checkMutationRateLimit(userId: string) {
  const { success } = await mutationLimiter.limit(userId);
  return success ? null : rateLimitedResponse();
}

export async function checkApiKeyRateLimit(userId: string) {
  const { success } = await apiKeyLimiter.limit(userId);
  return success ? null : rateLimitedResponse();
}

export async function checkFeedbackRateLimit(userId: string) {
  const { success } = await feedbackLimiter.limit(userId);
  return success ? null : rateLimitedResponse();
}
