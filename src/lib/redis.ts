import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Redis key helpers
export const redisKeys = {
  lastPing: (monitorId: string) => `ping:${monitorId}:last`,
  slugToMonitor: (slug: string) => `slug:${slug}`,
  // Rate-limit bucket is scoped per status so a legitimate start→success
  // lifecycle from a single job doesn't rate-limit itself.
  pingRateLimit: (slug: string, status: string) => `rl:${slug}:${status}`,
  lifetimeCount: 'lifetime:count',
} as const;
