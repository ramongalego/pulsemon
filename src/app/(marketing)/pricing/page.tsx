import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing - PulseMon',
  description:
    'Simple, transparent pricing for cron job monitoring. Start free with 30 monitors.',
};

const plans = [
  {
    name: 'Free',
    description: 'For side projects and personal use',
    price: '$0',
    highlighted: false,
    badge: null,
    cta: 'Get started',
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
    description: 'For indie devs and small teams',
    price: '$9',
    highlighted: true,
    badge: 'Most popular',
    cta: 'Start free trial',
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
    description: 'For growing SaaS and larger teams',
    price: '$19',
    highlighted: false,
    badge: null,
    cta: 'Start free trial',
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

const faqs = [
  {
    id: 'free-trial',
    question: 'Is the free plan really free?',
    answer:
      'Yes! The free plan includes 30 monitors with 60-second checks. No credit card required, no time limit. Use it forever.',
  },
  {
    id: 'upgrade',
    question: 'Can I upgrade or downgrade at any time?',
    answer:
      "Absolutely. Upgrade instantly to get more monitors and faster checks. Downgrade anytime — you'll keep your current plan until the end of the billing period.",
  },
  {
    id: 'billing',
    question: 'How does billing work?',
    answer:
      "Plans are billed monthly via Stripe. You can cancel anytime. When you cancel, you'll keep access until the end of your current billing period.",
  },
  {
    id: 'monitor-limit',
    question: 'What happens if I hit my monitor limit?',
    answer:
      "You won't be able to create new monitors, but your existing ones will keep running and alerting as normal. Upgrade your plan to add more.",
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">
          Start free. Upgrade when you need faster checks, more monitors, or
          longer history.
        </p>
      </div>

      {/* Plan cards */}
      <div className="mt-16 grid gap-8 md:grid-cols-3">
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
              <div className="mt-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  {feature}
                </div>
              ))}
              <Link href="/login" className="mt-4 block">
                <Button variant={plan.ctaVariant} className="w-full">
                  {plan.cta}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature comparison */}
      <div className="mt-24">
        <h2 className="text-center text-2xl font-bold tracking-tight">
          Compare plans
        </h2>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                  Feature
                </th>
                <th className="px-4 py-3 text-center font-semibold">Free</th>
                <th className="text-primary px-4 py-3 text-center font-semibold">
                  Starter
                </th>
                <th className="px-4 py-3 text-center font-semibold">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                {
                  feature: 'Monitors',
                  free: '30',
                  starter: '100',
                  pro: 'Unlimited',
                },
                {
                  feature: 'Check interval',
                  free: '60s',
                  starter: '30s',
                  pro: '10s',
                },
                {
                  feature: 'Ping history',
                  free: '7 days',
                  starter: '30 days',
                  pro: '90 days',
                },
                {
                  feature: 'Alert channels',
                  free: '2',
                  starter: '5',
                  pro: 'Unlimited',
                },
                {
                  feature: 'API access',
                  free: 'Yes',
                  starter: 'Yes',
                  pro: 'Yes',
                },
                {
                  feature: 'Email support',
                  free: '—',
                  starter: 'Yes',
                  pro: 'Priority',
                },
              ].map((row) => (
                <tr key={row.feature}>
                  <td className="px-4 py-3 font-medium">{row.feature}</td>
                  <td className="text-muted-foreground px-4 py-3 text-center">
                    {row.free}
                  </td>
                  <td className="text-primary px-4 py-3 text-center font-medium">
                    {row.starter}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-center">
                    {row.pro}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-24">
        <h2 className="text-center text-2xl font-bold tracking-tight">
          Pricing FAQ
        </h2>
        <div className="mx-auto mt-8 max-w-3xl">
          <Accordion type="single" collapsible>
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
