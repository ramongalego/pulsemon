import type { Metadata } from 'next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PricingCards } from '@/components/shared/pricing-toggle';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Simple, transparent pricing for cron job monitoring. Start free with 30 monitors.',
};

const comparisonRows = [
  { feature: 'Monitors', free: '30', starter: '100', pro: 'Unlimited' },
  { feature: 'Check interval', free: '60s', starter: '30s', pro: '10s' },
  {
    feature: 'Ping history',
    free: '7 days',
    starter: '30 days',
    pro: '90 days',
  },
  { feature: 'Alert channels', free: '2', starter: '5', pro: 'Unlimited' },
  { feature: 'Status pages', free: '1', starter: '2', pro: '5' },
  { feature: 'Custom webhooks', free: 'No', starter: 'Yes', pro: 'Yes' },
  { feature: 'API access', free: 'Yes', starter: 'Yes', pro: 'Yes' },
  {
    feature: 'Support',
    free: 'Community',
    starter: 'Email',
    pro: 'Priority email',
  },
];

const faqs = [
  {
    id: 'free-plan',
    question: 'Is the free plan really free?',
    answer:
      'Yes! The free plan includes 30 monitors with 60-second checks. No credit card required, no time limit. Use it forever.',
  },
  {
    id: 'upgrade',
    question: 'Can I upgrade or downgrade at any time?',
    answer:
      "Yes. Upgrade instantly to get more monitors and faster checks. Downgrade anytime — you'll keep your current plan until the end of the billing period. Your existing monitors and alert channels keep running even if you're over the new plan's limits.",
  },
  {
    id: 'billing',
    question: 'How does billing work?',
    answer:
      "Plans are billed monthly or yearly via Stripe. Yearly plans save up to 22%. You can cancel anytime. When you cancel, you'll keep access until the end of your current billing period.",
  },
  {
    id: 'annual',
    question: 'Do you offer annual billing?',
    answer:
      'Yes. Switch to yearly billing using the toggle above the pricing cards to save up to 22%. Starter is $84/year ($7/mo) and Pro is $180/year ($15/mo).',
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

      <PricingCards />

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
              {comparisonRows.map((row) => (
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
