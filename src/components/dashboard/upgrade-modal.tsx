'use client';

import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
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
      '60s check intervals',
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
      '30s check intervals',
      '30 days ping history',
      '3 team members',
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
      '10 team members',
      'Unlimited alert channels',
      'Webhooks + all integrations',
    ],
  },
] as const;

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
  if (currentPlan === 'free') return 'starter';
  if (currentPlan === 'starter') return 'pro';
  return 'pro';
}

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: Plan;
}

export function UpgradeModal({
  open,
  onOpenChange,
  currentPlan,
}: UpgradeModalProps) {
  const [billing, setBilling] = useState<Billing>('monthly');

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

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
            Get more monitors, faster checks, and longer history
          </p>

          {/* Billing toggle */}
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
          </div>
        </div>

        {/* Plan cards grid */}
        <div className="grid gap-4 p-6 md:grid-cols-3">
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
                {/* Badge */}
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

                {/* Price */}
                <div className="mb-4">
                  <span className="text-3xl font-bold">
                    {formatPrice(plan, billing)}
                  </span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                  {billing === 'yearly' && plan.yearly > 0 && (
                    <p className="mt-0.5 text-xs text-green-600">
                      ${plan.yearly}/yr &middot; Save {savingsPercent(plan)}%
                    </p>
                  )}
                </div>

                {/* Features */}
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

                {/* CTA */}
                {isCurrent ? (
                  <Button variant="outline" disabled className="w-full">
                    Current plan
                  </Button>
                ) : isUpgrade ? (
                  <Button
                    className="w-full"
                    onClick={() => {
                      toast.info(
                        'Stripe checkout coming soon — upgrade not yet wired up.',
                      );
                    }}
                  >
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
      </div>
    </div>
  );
}
