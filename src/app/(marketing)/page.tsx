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
import {
  Activity,
  ArrowRight,
  Clock,
  Code2,
  Globe,
  LayoutDashboard,
  Shield,
  Zap,
  Check,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'PulseMon',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Web',
            description:
              'Cron job and heartbeat monitoring for developers. Get instant alerts when your scheduled tasks stop running.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
          }),
        }}
      />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-20 md:pt-24 md:pb-32">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Your cron jobs fail silently.
            <br />
            <span className="text-primary">Not anymore.</span>
          </h1>
          <p className="text-muted-foreground mt-6 text-lg md:text-xl">
            PulseMon watches your cron jobs, background tasks, and scheduled
            scripts. When they stop running, you know in under 60 seconds. Add
            one line to your script. Done.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Start Monitoring - Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                See how it works
              </Button>
            </a>
          </div>
        </div>

        {/* Terminal mockup */}
        <div className="mx-auto mt-12 max-w-2xl">
          <div className="overflow-hidden rounded-xl border bg-slate-950 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="ml-2 text-xs text-slate-500">terminal</span>
            </div>
            <div className="p-4 font-mono text-sm">
              <p className="text-slate-500"># Your cron job script</p>
              <p className="text-green-400">$ ./backup-database.sh</p>
              <p className="text-slate-400">
                Backing up production database...
              </p>
              <p className="text-slate-400">Compressing dump... done.</p>
              <p className="text-slate-400">Uploading to S3... done.</p>
              <p className="mt-2 text-slate-500"># Tell PulseMon it ran</p>
              <p className="text-green-400">
                $ curl -fsS https://pulsemon.dev/api/ping/daily-backup
              </p>
              <p className="text-blue-400">{'{ "ok": true }'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="bg-muted/30 border-t py-20 md:py-28"
      >
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
            Three steps. Two minutes. Done.
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-center">
            No agents to install. No complex configuration. Just a URL to ping.
          </p>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold">Create a monitor</h3>
              <p className="text-muted-foreground mt-2 text-sm">
                Name it, pick how often it should run. Takes 10 seconds.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold">
                Add one line to your script
              </h3>
              <p className="text-muted-foreground mt-2 text-sm">
                Append{' '}
                <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
                  curl https://pulsemon.dev/api/ping/your-slug
                </code>{' '}
                at the end.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold">
                Get alerted when it fails
              </h3>
              <p className="text-muted-foreground mt-2 text-sm">
                Slack, Discord, email, or webhooks. You choose.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need to monitor cron jobs
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-center">
            Built by a developer, for developers. No fluff.
          </p>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Zap,
                title: 'Instant alerts',
                desc: 'Slack, Discord, email, and webhooks. Know within 60 seconds.',
              },
              {
                icon: LayoutDashboard,
                title: 'Beautiful dashboard',
                desc: 'Ping history, uptime charts, and incident timelines at a glance.',
              },
              {
                icon: Activity,
                title: 'Generous free tier',
                desc: '30 monitors, 60-second checks. No credit card required.',
              },
              {
                icon: Clock,
                title: '60-second checks',
                desc: 'We check your monitors every minute. Faster on paid plans.',
              },
              {
                icon: Globe,
                title: 'Global edge network',
                desc: 'Ping endpoint runs on the edge. Fast from anywhere.',
              },
              {
                icon: Code2,
                title: 'API-first',
                desc: 'Full REST API. Manage everything programmatically.',
              },
              {
                icon: Shield,
                title: 'Incident timeline',
                desc: 'Full history of every downtime event and resolution.',
              },
            ].map((feature) => (
              <Card key={feature.title} className="border-0 shadow-none">
                <CardHeader className="pb-2">
                  <feature.icon className="text-primary mb-2 h-8 w-8" />
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-muted/30 border-t py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
            Why PulseMon?
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-center">
            Honest comparison. Pick what works for you.
          </p>

          <div className="mt-12 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                    Feature
                  </th>
                  <th className="text-primary px-4 py-3 text-center font-semibold">
                    PulseMon
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-center font-medium">
                    Cronitor
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-center font-medium">
                    Healthchecks.io
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-center font-medium">
                    BetterStack
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  {
                    feature: 'Free monitors',
                    pulsemon: '30',
                    cronitor: '5',
                    healthchecks: '20',
                    betterstack: '10',
                  },
                  {
                    feature: 'Starting price',
                    pulsemon: '$9/mo',
                    cronitor: '~$7/mo+',
                    healthchecks: '$20/mo',
                    betterstack: '$29/mo',
                  },
                  {
                    feature: 'Ping history (free)',
                    pulsemon: '7 days',
                    cronitor: 'Limited',
                    healthchecks: '100 entries',
                    betterstack: 'Limited',
                  },
                  {
                    feature: 'Status pages',
                    pulsemon: 'Included',
                    cronitor: '$25/mo extra',
                    healthchecks: 'No',
                    betterstack: '1 included',
                  },
                  {
                    feature: 'Setup time',
                    pulsemon: '< 2 min',
                    cronitor: '~5 min',
                    healthchecks: '~3 min',
                    betterstack: '~5 min',
                  },
                ].map((row) => (
                  <tr key={row.feature}>
                    <td className="px-4 py-3 font-medium">{row.feature}</td>
                    <td className="text-primary px-4 py-3 text-center font-semibold">
                      {row.pulsemon}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-center">
                      {row.cronitor}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-center">
                      {row.healthchecks}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-center">
                      {row.betterstack}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-center">
            Start free. Upgrade when you need faster checks, more monitors, or
            longer history.
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {/* Free */}
            <Card>
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>
                  For side projects and personal use
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  '30 monitors',
                  '60-second checks',
                  '7 days ping history',
                  'Email + 1 integration',
                  'API access',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    {item}
                  </div>
                ))}
                <Link href="/login" className="mt-4 block">
                  <Button variant="outline" className="w-full">
                    Get started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Starter */}
            <Card className="border-primary shadow-lg">
              <CardHeader>
                <div className="bg-primary/10 text-primary mb-2 w-fit rounded-full px-3 py-1 text-xs font-medium">
                  Most popular
                </div>
                <CardTitle>Starter</CardTitle>
                <CardDescription>
                  For indie devs and small teams
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$9</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  '100 monitors',
                  '30-second checks',
                  '30 days ping history',
                  'All integrations',
                  'Email support',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    {item}
                  </div>
                ))}
                <Link href="/login" className="mt-4 block">
                  <Button className="w-full">Start free trial</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card>
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <CardDescription>
                  For growing SaaS and larger teams
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$19</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  'Unlimited monitors',
                  '10-second checks',
                  '90 days ping history',
                  'All integrations + webhooks',
                  'Priority email support',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    {item}
                  </div>
                ))}
                <Link href="/login" className="mt-4 block">
                  <Button variant="outline" className="w-full">
                    Start free trial
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 border-t py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
            Frequently asked questions
          </h2>

          <Accordion type="single" collapsible className="mt-12">
            <AccordionItem value="service-down">
              <AccordionTrigger>
                What happens if YOUR service goes down?
              </AccordionTrigger>
              <AccordionContent>
                PulseMon runs on Vercel&apos;s global edge network with Upstash
                Redis for the ping endpoint. These are highly available
                infrastructure providers with 99.99% uptime SLAs. We also
                monitor our own service with independent external monitors. If
                our checking service goes down, it fails safe: you won&apos;t
                get false alerts, and we&apos;ll process any queued checks as
                soon as we&apos;re back.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="alert-speed">
              <AccordionTrigger>How fast are alerts?</AccordionTrigger>
              <AccordionContent>
                We check your monitors every 60 seconds (30s on Starter, 10s on
                Pro). Once a missed ping is detected, alerts are dispatched
                within seconds. From miss to inbox: under 2 minutes on the free
                plan.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="firewall">
              <AccordionTrigger>
                Can I monitor jobs behind a firewall?
              </AccordionTrigger>
              <AccordionContent>
                Yes. PulseMon uses a &quot;dead man&apos;s switch&quot; model:
                your job pings us, not the other way around. As long as your
                server can make outbound HTTPS requests, it works. No firewall
                rules to configure, no agents to install.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="heartbeat">
              <AccordionTrigger>
                What is a heartbeat / dead man&apos;s switch monitor?
              </AccordionTrigger>
              <AccordionContent>
                A heartbeat monitor expects regular &quot;I&apos;m alive&quot;
                signals (pings) from your service. If a ping doesn&apos;t arrive
                within the expected interval plus a grace period, the monitor
                fires an alert. It&apos;s the simplest way to know that a
                scheduled job is still running on time.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Stop finding out about failed cron jobs from your users
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Set up your first monitor in under 2 minutes. Free for up to 30
            monitors.
          </p>
          <Link href="/login" className="mt-8 inline-block">
            <Button size="lg">
              Start Monitoring - Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
