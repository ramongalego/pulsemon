import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the module
const mockDbUpdate = vi.fn().mockReturnValue({
  set: vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue(undefined),
  }),
});

vi.mock('@/lib/db', () => ({
  db: {
    update: (...args: unknown[]) => mockDbUpdate(...args),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  users: Symbol('users'),
}));

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: 'eq', args })),
}));

// Import after mocks
import { POST } from '@/app/api/webhooks/stripe/route';
import { stripe } from '@/lib/stripe';

function makeRequest(body: string, signature: string | null) {
  return {
    text: () => Promise.resolve(body),
    headers: {
      get: (name: string) => (name === 'stripe-signature' ? signature : null),
    },
  } as unknown as Request;
}

describe('Stripe Webhook Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when stripe-signature header is missing', async () => {
    const req = makeRequest('{}', null);
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Missing signature');
  });

  it('returns 400 when signature verification fails', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const req = makeRequest('{}', 'sig_invalid');
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid signature');
  });

  it('handles checkout.session.completed - sets plan and stripe IDs', async () => {
    const mockSet = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    mockDbUpdate.mockReturnValue({ set: mockSet });

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_123',
          subscription: 'sub_456',
          metadata: { userId: 'user-abc', plan: 'starter' },
        },
      },
    } as never);

    const req = makeRequest('{}', 'sig_valid');
    const res = await POST(req as never);
    expect(res.status).toBe(200);

    expect(mockDbUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_456',
        plan: 'starter',
      }),
    );
  });

  it('handles customer.subscription.deleted - downgrades to free', async () => {
    const mockSet = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    mockDbUpdate.mockReturnValue({ set: mockSet });

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_456',
        },
      },
    } as never);

    const req = makeRequest('{}', 'sig_valid');
    const res = await POST(req as never);
    expect(res.status).toBe(200);

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: 'free',
        stripeSubscriptionId: null,
      }),
    );
  });

  it('handles invoice.payment_failed - logs warning but returns 200', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'invoice.payment_failed',
      data: {
        object: {
          subscription: 'sub_456',
        },
      },
    } as never);

    const req = makeRequest('{}', 'sig_valid');
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Payment failed'),
    );

    warnSpy.mockRestore();
  });

  it('handles unknown event types gracefully', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'some.unknown.event',
      data: { object: {} },
    } as never);

    const req = makeRequest('{}', 'sig_valid');
    const res = await POST(req as never);
    expect(res.status).toBe(200);
  });

  it('handles customer.subscription.updated with price lookup key', async () => {
    const mockSet = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    mockDbUpdate.mockReturnValue({ set: mockSet });

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_456',
          status: 'active',
          items: {
            data: [
              {
                price: { lookup_key: 'pro_monthly' },
              },
            ],
          },
        },
      },
    } as never);

    const req = makeRequest('{}', 'sig_valid');
    const res = await POST(req as never);
    expect(res.status).toBe(200);

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ plan: 'pro' }),
    );
  });
});
