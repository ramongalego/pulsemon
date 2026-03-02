import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { Plan } from '@/types';
import { invalidateLifetimeCount } from '@/lib/lifetime-count';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 },
    );
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    await handleStripeEvent(event);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook handler error:', err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}

async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as {
        customer: string;
        subscription: string | null;
        metadata?: { userId?: string; plan?: string };
      };
      if (session.metadata?.userId) {
        const isLifetime = session.metadata.plan === 'lifetime';
        await db
          .update(users)
          .set({
            stripeCustomerId: session.customer,
            stripeSubscriptionId: isLifetime ? null : session.subscription,
            plan: (session.metadata.plan as Plan) ?? 'starter',
            updatedAt: new Date(),
          })
          .where(eq(users.id, session.metadata.userId));
        if (isLifetime) {
          await invalidateLifetimeCount();
        }
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as {
        id: string;
        status: string;
        items: { data: Array<{ price: { lookup_key?: string } }> };
      };
      // Lifetime users have no subscription - skip if matched by accident
      const [updatedUser] = await db
        .select({ plan: users.plan })
        .from(users)
        .where(eq(users.stripeSubscriptionId, subscription.id))
        .limit(1);
      if (updatedUser?.plan === 'lifetime') break;

      const plan = mapPriceToplan(
        subscription.items.data[0]?.price?.lookup_key,
      );
      if (plan) {
        await db
          .update(users)
          .set({ plan, updatedAt: new Date() })
          .where(eq(users.stripeSubscriptionId, subscription.id));
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as { id: string };
      // Never downgrade lifetime users
      const [deletedUser] = await db
        .select({ plan: users.plan })
        .from(users)
        .where(eq(users.stripeSubscriptionId, subscription.id))
        .limit(1);
      if (deletedUser?.plan === 'lifetime') break;

      await db
        .update(users)
        .set({
          plan: 'free',
          stripeSubscriptionId: null,
          updatedAt: new Date(),
        })
        .where(eq(users.stripeSubscriptionId, subscription.id));
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as unknown as { subscription: string };
      // Log the failure but don't downgrade immediately - Stripe will retry
      console.warn(
        `Payment failed for subscription ${invoice.subscription}. Stripe will retry.`,
      );
      break;
    }

    default:
      // Unhandled event type - that's fine
      break;
  }
}

function mapPriceToplan(lookupKey?: string): Plan | null {
  switch (lookupKey) {
    case 'starter_monthly':
    case 'starter_yearly':
      return 'starter';
    case 'pro_monthly':
    case 'pro_yearly':
      return 'pro';
    default:
      return null;
  }
}
