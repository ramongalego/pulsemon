'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Plan } from '@/types';

type Billing = 'monthly' | 'yearly';

const PLANS = [
  {
    key: 'free' as Plan,
    name: 'Free',
    monthly: 0,
    yearly: 0,
    features: [
      '30 monitors',
      '2 min check intervals',
      '7 days ping history',
      '2 alert channels',
      'Email + 1 integration',
    ],
  },
  {
    key: 'starter' as Plan,
    name: 'Starter',
    monthly: 9,
    yearly: 84,
    features: [
      '100 monitors',
      '60s check intervals',
      '30 days ping history',
      '5 alert channels',
      'All integrations',
    ],
  },
  {
    key: 'pro' as Plan,
    name: 'Pro',
    monthly: 19,
    yearly: 180,
    features: [
      'Unlimited monitors',
      '10s check intervals',
      '90 days ping history',
      'Unlimited alert channels',
      'Webhooks + all integrations',
    ],
  },
] as const;

const LIFETIME_LIMIT = 100;

const LIFETIME_FEATURES = [
  '200 monitors',
  '10s check intervals',
  '90 days ping history',
  'Unlimited alert channels',
  'All integrations',
  '3 status pages',
  'No monthly fees, ever',
];

function formatPrice(plan: (typeof PLANS)[number], billing: Billing): string {
  if (plan.monthly === 0) return '$0';
  if (billing === 'monthly') return `$${plan.monthly}`;
  return `$${plan.yearly / 12}`;
}

function savingsPercent(plan: (typeof PLANS)[number]): number {
  if (plan.monthly === 0) return 0;
  return Math.round((1 - plan.yearly / (plan.monthly * 12)) * 100);
}

function getRecommendedPlan(currentPlan: Plan): Plan {
  if (currentPlan === 'lifetime') return 'lifetime';
  if (currentPlan === 'free') return 'starter';
  if (currentPlan === 'starter') return 'pro';
  return 'pro';
}

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: Plan;
  message?: string;
}

export function UpgradeModal({
  open,
  onOpenChange,
  currentPlan,
  message,
}: UpgradeModalProps) {
  const [billing, setBilling] = useState<'monthly' | 'yearly' | 'lifetime'>(
    currentPlan === 'lifetime' ? 'lifetime' : 'monthly',
  );
  const [lifetimeCount, setLifetimeCount] = useState(0);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = useCallback(
    async (
      plan: 'starter' | 'pro' | 'lifetime',
      billingCycle: 'monthly' | 'yearly',
    ) => {
      setLoadingPlan(plan);
      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, billing: billingCycle }),
        });
        const json = await res.json();
        if (json.error) {
          toast.error(json.error.message ?? 'Something went wrong');
          return;
        }
        if (json.data?.url) {
          window.location.href = json.data.url;
        }
      } catch {
        toast.error('Failed to start checkout. Please try again.');
      } finally {
        setLoadingPlan(null);
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    fetch('/api/lifetime-count')
      .then((res) => res.json())
      .then((json) => setLifetimeCount(json.data?.count ?? 0))
      .catch(() => setLifetimeCount(0));
  }, [open]);

  if (!open) return null;

  const recommended = getRecommendedPlan(currentPlan);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="bg-card relative mx-4 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border shadow-lg">
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="text-muted-foreground hover:text-foreground absolute top-4 right-4 rounded-sm p-1 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Upgrade Your Plan
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {message || 'Get more monitors, faster checks, and longer history'}
          </p>

          {/* Billing toggle: Monthly / Yearly / Lifetime */}
          <div className="mt-4 inline-flex items-center rounded-full border p-1">
            <button
              onClick={() => setBilling('monthly')}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                billing === 'monthly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                billing === 'yearly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  billing === 'yearly'
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-green-500/10 text-green-600'
                }`}
              >
                Save 22%
              </span>
            </button>
            <button
              onClick={() => setBilling('lifetime')}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                billing === 'lifetime'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Lifetime
            </button>
          </div>
        </div>

        {billing !== 'lifetime' ? (
          <div className="grid min-h-[420px] gap-4 p-6 md:h-[420px] md:grid-cols-3">
            {PLANS.map((plan) => {
              const isCurrent = plan.key === currentPlan;
              const isRecommended = plan.key === recommended && !isCurrent;
              const isUpgrade =
                !isCurrent &&
                PLANS.findIndex((p) => p.key === plan.key) >
                  PLANS.findIndex((p) => p.key === currentPlan);

              return (
                <div
                  key={plan.key}
                  className={`relative flex flex-col rounded-lg border p-5 ${
                    isRecommended
                      ? 'border-primary ring-primary/20 ring-2'
                      : isCurrent
                        ? 'bg-muted/50'
                        : ''
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold">{plan.name}</span>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Current plan
                      </Badge>
                    )}
                    {isRecommended && (
                      <Badge className="text-xs">Recommended</Badge>
                    )}
                  </div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-3xl font-bold">
                        {formatPrice(plan, billing)}
                      </span>
                      <span className="text-muted-foreground text-sm">/mo</span>
                    </div>
                    {billing === 'yearly' && plan.yearly > 0 && (
                      <div className="text-right text-xs text-green-600">
                        <p>${plan.yearly}/yr</p>
                        <p>Save {savingsPercent(plan)}%</p>
                      </div>
                    )}
                  </div>
                  <ul className="mb-6 flex-1 space-y-2">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button variant="outline" disabled className="w-full">
                      Current plan
                    </Button>
                  ) : isUpgrade ? (
                    <Button
                      className="w-full"
                      disabled={loadingPlan === plan.key}
                      onClick={() =>
                        handleCheckout(
                          plan.key as 'starter' | 'pro',
                          billing as 'monthly' | 'yearly',
                        )
                      }
                    >
                      {loadingPlan === plan.key ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Upgrade to {plan.name}
                    </Button>
                  ) : (
                    <Button variant="outline" disabled className="w-full">
                      {plan.name}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[420px] flex-col items-center justify-center p-6 md:h-[420px]">
            <div
              className={`w-full max-w-md rounded-lg border p-6 ${
                currentPlan === 'lifetime'
                  ? 'bg-muted/50'
                  : lifetimeCount >= LIFETIME_LIMIT
                    ? 'opacity-60'
                    : 'border-amber-500/30 bg-amber-500/5'
              }`}
            >
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  Founding Member — Lifetime Plan
                </h3>
                <div className="mt-3 flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">$349</span>
                  <span className="text-muted-foreground text-sm">
                    one-time
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  Pay once, use forever. Limited to {LIFETIME_LIMIT} spots.
                </p>
              </div>
              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {LIFETIME_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-col items-center gap-3">
                {currentPlan === 'lifetime' ? (
                  <Button variant="outline" disabled className="w-full">
                    Current plan
                  </Button>
                ) : lifetimeCount >= LIFETIME_LIMIT ? (
                  <Button disabled className="w-full">
                    Sold out
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    size="lg"
                    disabled={loadingPlan === 'lifetime'}
                    onClick={() => handleCheckout('lifetime', 'monthly')}
                  >
                    {loadingPlan === 'lifetime' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Get Lifetime Access
                  </Button>
                )}
                <p className="text-muted-foreground text-sm">
                  {lifetimeCount} / {LIFETIME_LIMIT} claimed
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
