import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Redis
const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn().mockResolvedValue('OK');

vi.mock('@/lib/redis', () => ({
  redis: {
    get: (...args: unknown[]) => mockRedisGet(...args),
    set: (...args: unknown[]) => mockRedisSet(...args),
  },
  redisKeys: {
    lastPing: (id: string) => `ping:${id}:last`,
    slugToMonitor: (slug: string) => `slug:${slug}`,
    pingRateLimit: (slug: string, status: string) => `rl:${slug}:${status}`,
  },
}));

// Mock DB
const mockDbSelect = vi.fn().mockReturnValue({
  from: vi.fn().mockReturnValue({
    where: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue([]),
    }),
  }),
});
const mockDbUpdate = vi.fn().mockReturnValue({
  set: vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue(undefined),
  }),
});
const mockDbInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockResolvedValue(undefined),
});

vi.mock('@/lib/db', () => ({
  db: {
    select: (...args: unknown[]) => mockDbSelect(...args),
    update: (...args: unknown[]) => mockDbUpdate(...args),
    insert: (...args: unknown[]) => mockDbInsert(...args),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  monitors: Symbol('monitors'),
  pings: Symbol('pings'),
  incidents: Symbol('incidents'),
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  isNull: vi.fn(),
}));

vi.mock('@/lib/monitoring/constants', () => ({
  REDIS_TTL_BUFFER: 60,
}));

vi.mock('@/lib/monitoring/alerter', () => ({
  dispatchAlerts: vi.fn().mockResolvedValue(undefined),
}));

// Import after mocks
import { GET, POST } from '@/app/api/ping/[monitorSlug]/route';

function makeGetRequest(slug: string, query = '') {
  return new Request(
    `http://localhost:3000/api/ping/${slug}${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      headers: {
        'x-forwarded-for': '1.2.3.4',
      },
    },
  );
}

function makePostRequest(slug: string, body: Record<string, unknown>) {
  return new Request(`http://localhost:3000/api/ping/${slug}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '1.2.3.4',
    },
    body: JSON.stringify(body),
  });
}

const MONITOR = {
  id: 'mon-123',
  expectedInterval: 300,
  gracePeriod: 60,
  isPaused: false,
};

describe('Ping Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/ping/[slug]', () => {
    it('returns 200 and updates Redis when monitor found in cache', async () => {
      mockRedisGet.mockResolvedValue(MONITOR);

      const req = makeGetRequest('my-monitor');
      const res = await GET(req as never, {
        params: Promise.resolve({ monitorSlug: 'my-monitor' }),
      });

      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.ok).toBe(true);

      // Should read from Redis cache
      expect(mockRedisGet).toHaveBeenCalledWith('slug:my-monitor');

      // Should write last ping to Redis with correct TTL
      expect(mockRedisSet).toHaveBeenCalledWith(
        'ping:mon-123:last',
        expect.any(Number),
        { ex: 300 + 60 + 60 }, // interval + grace + buffer
      );
    });

    it('falls back to DB when Redis cache misses', async () => {
      mockRedisGet.mockResolvedValue(null);
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([MONITOR]),
          }),
        }),
      });

      const req = makeGetRequest('my-monitor');
      const res = await GET(req as never, {
        params: Promise.resolve({ monitorSlug: 'my-monitor' }),
      });

      expect(res.status).toBe(200);
      expect(mockDbSelect).toHaveBeenCalled();

      // Should cache the result in Redis
      expect(mockRedisSet).toHaveBeenCalledWith('slug:my-monitor', MONITOR, {
        ex: 300,
      });
    });

    it('returns 404 when monitor not found', async () => {
      mockRedisGet.mockResolvedValue(null);
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const req = makeGetRequest('nonexistent');
      const res = await GET(req as never, {
        params: Promise.resolve({ monitorSlug: 'nonexistent' }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
    });

    it('returns ok with paused flag when monitor is paused', async () => {
      mockRedisGet.mockResolvedValue({ ...MONITOR, isPaused: true });

      const req = makeGetRequest('paused-monitor');
      const res = await GET(req as never, {
        params: Promise.resolve({ monitorSlug: 'paused-monitor' }),
      });

      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.paused).toBe(true);
    });

    it('parses status=fail from query params', async () => {
      mockRedisGet.mockResolvedValue(MONITOR);

      const req = makeGetRequest('my-monitor', 'status=fail&duration=1234');
      const res = await GET(req as never, {
        params: Promise.resolve({ monitorSlug: 'my-monitor' }),
      });

      expect(res.status).toBe(200);
      // Fail pings do NOT reset the deadline (only success pings do).
      // Redis set should only be called for the rate limit key.
      expect(mockRedisSet).not.toHaveBeenCalledWith(
        'ping:mon-123:last',
        expect.any(Number),
        expect.any(Object),
      );
    });
  });

  describe('POST /api/ping/[slug]', () => {
    it('accepts POST with JSON body', async () => {
      mockRedisGet.mockResolvedValue(MONITOR);

      const req = makePostRequest('my-monitor', {
        status: 'success',
        duration: 1500,
        body: 'Backup completed successfully',
      });

      const res = await POST(req as never, {
        params: Promise.resolve({ monitorSlug: 'my-monitor' }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
    });

    it('handles POST with fail status', async () => {
      mockRedisGet.mockResolvedValue(MONITOR);

      const req = makePostRequest('my-monitor', { status: 'fail' });
      const res = await POST(req as never, {
        params: Promise.resolve({ monitorSlug: 'my-monitor' }),
      });

      expect(res.status).toBe(200);
    });

    it('handles POST with malformed body gracefully', async () => {
      mockRedisGet.mockResolvedValue(MONITOR);

      const req = new Request('http://localhost:3000/api/ping/my-monitor', {
        method: 'POST',
        body: 'not json',
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      const res = await POST(req as never, {
        params: Promise.resolve({ monitorSlug: 'my-monitor' }),
      });

      // Should still succeed - body parsing is optional
      expect(res.status).toBe(200);
    });
  });

  describe('resilience', () => {
    it('returns 200 even when Redis write fails', async () => {
      mockRedisGet.mockResolvedValue(MONITOR);
      mockRedisSet
        .mockResolvedValueOnce('OK') // cache write
        .mockRejectedValueOnce(new Error('Redis down')); // This won't actually fail the request due to order

      // The ping endpoint catches errors and returns 200 anyway
      const req = makeGetRequest('my-monitor');
      const res = await GET(req as never, {
        params: Promise.resolve({ monitorSlug: 'my-monitor' }),
      });

      expect(res.status).toBe(200);
    });
  });
});
