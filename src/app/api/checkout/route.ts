import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '@/lib/env';

const checkoutSchema = z.object({
  plan: z.enum(['starter', 'pro', 'lifetime']),
  billing: z.enum(['monthly', 'yearly']),
});

const PRICE_MAP: Record<string, string | undefined> = {
  starter_monthly: env.STRIPE_STARTER_MONTHLY_PRICE_ID,
  starter_yearly: env.STRIPE_STARTER_YEARLY_PRICE_ID,
  pro_monthly: env.STRIPE_PRO_MONTHLY_PRICE_ID,
  pro_yearly: env.STRIPE_PRO_YEARLY_PRICE_ID,
  lifetime: env.STRIPE_LIFETIME_PRICE_ID,
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: 'Not signed in' } },
      { status: 401 },
    );
  }

  const body = await req.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: { code: 'INVALID_INPUT', message: parsed.error.message },
      },
      { status: 400 },
    );
  }

  const { plan, billing } = parsed.data;
  const isLifetime = plan === 'lifetime';
  const priceKey = isLifetime ? 'lifetime' : `${plan}_${billing}`;
  const priceId = PRICE_MAP[priceKey];

  if (!priceId) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'PRICE_NOT_CONFIGURED',
          message: 'Price not configured',
        },
      },
      { status: 400 },
    );
  }

  const userId = session.user.id;

  // Get or create Stripe customer
  const [user] = await db
    .select({ stripeCustomerId: users.stripeCustomerId, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  let customerId = user?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email ?? undefined,
      metadata: { userId },
    });
    customerId = customer.id;
    await db
      .update(users)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL;

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: isLifetime ? 'payment' : 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId, plan },
    ...(isLifetime ? {} : { subscription_data: { metadata: { userId } } }),
    success_url: `${appUrl}/dashboard?upgraded=1`,
    cancel_url: `${appUrl}/dashboard`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ data: { url: checkoutSession.url }, error: null });
}
