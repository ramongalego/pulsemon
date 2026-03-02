'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check } from 'lucide-react';

type Billing = 'monthly' | 'yearly';

const plans = [
  {
    name: 'Free',
    description: 'For side projects and personal use',
    monthly: 0,
    yearly: 0,
    highlighted: false,
    badge: null,
    ctaVariant: 'outline' as const,
    features: [
      '30 monitors',
      '60-second checks',
      '7 days ping history',
      'Email + 1 integration',
      'API access',
    ],
  },
  {
    name: 'Starter',
    description: 'For indie devs going to production',
    monthly: 9,
    yearly: 84,
    highlighted: true,
    badge: 'Most popular',
    ctaVariant: 'default' as const,
    features: [
      '100 monitors',
      '30-second checks',
      '30 days ping history',
      'All integrations',
      'Email support',
    ],
  },
  {
    name: 'Pro',
    description: 'For production workloads and growing SaaS',
    monthly: 19,
    yearly: 180,
    highlighted: false,
    badge: null,
    ctaVariant: 'outline' as const,
    features: [
      'Unlimited monitors',
      '10-second checks',
      '90 days ping history',
      'All integrations + webhooks',
      'Priority email support',
    ],
  },
];

function formatPrice(plan: (typeof plans)[number], billing: Billing): string {
  if (plan.monthly === 0) return '$0';
  if (billing === 'monthly') return `$${plan.monthly}`;
  return `$${Math.round(plan.yearly / 12)}`;
}

export function PricingCards() {
  const [billing, setBilling] = useState<Billing>('monthly');

  return (
    <>
      {/* Billing toggle */}
      <div className="mt-8 flex justify-center">
        <div className="inline-flex items-center rounded-full border p-1">
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

      {/* Plan cards */}
      <div className="mt-10 grid gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={
              plan.highlighted ? 'border-primary shadow-lg' : undefined
            }
          >
            <CardHeader>
              {plan.badge && (
                <div className="bg-primary/10 text-primary mb-2 w-fit rounded-full px-3 py-1 text-xs font-medium">
                  {plan.badge}
                </div>
              )}
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">
                  {formatPrice(plan, billing)}
                </span>
                <span className="text-muted-foreground">/mo</span>
                {billing === 'yearly' && plan.yearly > 0 && (
                  <span className="ml-2 text-sm text-green-600">
                    ${plan.yearly}/yr
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 shrink-0 text-green-500" />
                  {feature}
                </div>
              ))}
              <Link href="/login" className="mt-4 block">
                <Button variant={plan.ctaVariant} className="w-full">
                  Get started
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
