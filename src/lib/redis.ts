import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Redis key helpers
export const redisKeys = {
  lastPing: (monitorId: string) => `ping:${monitorId}:last`,
  slugToMonitor: (slug: string) => `slug:${slug}`,
  pingRateLimit: (slug: string) => `rl:${slug}`,
} as const;
