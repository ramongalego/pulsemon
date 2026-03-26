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
  AlertCircle,
  ArrowRight,
  FileText,
  GitMerge,
  Globe,
  LayoutDashboard,
  Lock,
  Timer,
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
            url: 'https://pulsemon.dev',
            description:
              'Cron job and heartbeat monitoring for developers. Get instant alerts when your scheduled tasks stop running.',
            offers: [
              {
                '@type': 'Offer',
                name: 'Free',
                price: '0',
                priceCurrency: 'USD',
              },
              {
                '@type': 'Offer',
                name: 'Starter',
                price: '9',
                priceCurrency: 'USD',
                billingIncrement: 'P1M',
              },
              {
                '@type': 'Offer',
                name: 'Pro',
                price: '19',
                priceCurrency: 'USD',
                billingIncrement: 'P1M',
              },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'PulseMon',
            url: 'https://pulsemon.dev',
            logo: 'https://pulsemon.dev/icon.svg',
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'What happens if YOUR service goes down?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: "PulseMon runs on Vercel's edge network and Upstash Redis, both with 99.99% uptime SLAs. We monitor ourselves with independent external checks. If our checker goes down, it fails safe. No false alerts.",
                },
              },
              {
                '@type': 'Question',
                name: 'How fast are alerts?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'We check your monitors every 2 minutes on Free (60s on Starter, 10s on Pro). Once a missed ping is detected, alerts are dispatched within seconds.',
                },
              },
              {
                '@type': 'Question',
                name: 'Is there a free tier?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. 30 monitors with 2-minute checks, forever. No credit card required.',
                },
              },
              {
                '@type': 'Question',
                name: 'Can I monitor jobs behind a firewall?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: "Yes. PulseMon uses a dead man's switch model: your job pings us, not the other way around. As long as your server can make outbound HTTPS requests, it works. No firewall rules to configure, no agents to install.",
                },
              },
              {
                '@type': 'Question',
                name: 'What languages/frameworks do you support?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Any. If it can make an HTTP request, it works. Bash, Python, Node.js, Go, Ruby, PHP, Docker. We have examples for all of them in the docs.',
                },
              },
              {
                '@type': 'Question',
                name: "What is a heartbeat / dead man's switch monitor?",
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: "A heartbeat monitor expects regular 'I'm alive' signals (pings) from your service. If a ping doesn't arrive within the expected interval plus a grace period, the monitor fires an alert. It's the simplest way to know that a scheduled job is still running on time.",
                },
              },
            ],
          }),
        }}
      />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-20 md:pt-24 md:pb-32">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Your cron jobs fail silently.
              <br />
              <span className="text-primary">Not anymore.</span>
            </h1>
            <p className="text-muted-foreground mt-6 text-lg md:text-xl">
              Heartbeat monitoring for cron jobs, background tasks, and
              scheduled scripts. If your job doesn&apos;t check in on time, you
              know in under 2 minutes.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started Free
                  <ArrowRight className="ml-[-2] h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  See how it works
                </Button>
              </a>
            </div>
          </div>

          {/* Terminal mockup */}
          <div className="min-w-0">
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
                  curl -fsS https://pulsemon.dev/api/ping/your-slug
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
            Built by a developer, for developers.
          </p>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                {
                  icon: Zap,
                  title: 'Instant alerts',
                  desc: 'Slack, Discord, email, and webhooks. Know within minutes. Escalating reminders at 1h, 6h, and 24h until resolved.',
                },
                {
                  icon: LayoutDashboard,
                  title: 'Ping history and uptime',
                  desc: 'See every ping, response time, and incident. Track uptime over 7, 30, or 90 days.',
                },
                {
                  icon: GitMerge,
                  title: 'Overlap detection',
                  desc: (
                    <>
                      Send{' '}
                      <code className="bg-muted rounded px-1 py-0.5 text-xs">
                        ?status=start
                      </code>{' '}
                      before your job runs. Get alerted if a new run begins
                      before the previous one finishes.
                    </>
                  ),
                },
                {
                  icon: Globe,
                  title: 'Public status pages',
                  desc: 'Share a branded status page with your users. Shows uptime, incidents, and current status.',
                },
                {
                  icon: FileText,
                  title: 'Alerts include job output',
                  desc: (
                    <>
                      Send your job&apos;s{' '}
                      <code className="bg-muted rounded px-1 py-0.5 text-xs">
                        stdout
                      </code>{' '}
                      or{' '}
                      <code className="bg-muted rounded px-1 py-0.5 text-xs">
                        stderr
                      </code>{' '}
                      with the ping. When it fails, the alert shows you why.
                    </>
                  ),
                },
                {
                  icon: AlertCircle,
                  title: 'Explicit failure alerts',
                  desc: (
                    <>
                      Send{' '}
                      <code className="bg-muted rounded px-1 py-0.5 text-xs">
                        ?status=fail
                      </code>{' '}
                      and get an immediate alert. No waiting for a missed
                      deadline.
                    </>
                  ),
                },
                {
                  icon: Timer,
                  title: 'Duration thresholds',
                  desc: 'Set a max run time. Get alerted when a job finishes but took way too long.',
                },
                {
                  icon: Lock,
                  title: 'Webhook signatures',
                  desc: (
                    <>
                      Every outbound webhook is{' '}
                      <code className="bg-muted rounded px-1 py-0.5 text-xs">
                        HMAC-SHA256
                      </code>{' '}
                      signed. Verify it came from PulseMon.
                    </>
                  ),
                },
              ] as const
            ).map((feature) => (
              <Card key={feature.title} className="shadow-none">
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
            See how PulseMon compares.
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
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  {
                    feature: 'Free monitors',
                    pulsemon: '30',
                    cronitor: '5',
                    healthchecks: '20',
                  },
                  {
                    feature: 'Starting price',
                    pulsemon: '$9/mo (100 monitors)',
                    cronitor: '$2/mo (per monitor)',
                    healthchecks: '$20/mo (100 monitors)',
                  },
                  {
                    feature: 'Status pages',
                    pulsemon: 'Included',
                    cronitor: '$25/mo extra',
                    healthchecks: 'No',
                  },
                  {
                    feature: 'Setup time',
                    pulsemon: '< 2 min',
                    cronitor: '~5 min',
                    healthchecks: '~3 min',
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
            Pricing
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
                  '2-minute checks',
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
                  '60-second checks',
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
                  <Button className="w-full">Get started</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card>
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <CardDescription>
                  For production workloads and growing SaaS
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
                    Get started
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
                PulseMon runs on Vercel&apos;s edge network and Upstash Redis,
                both with 99.99% uptime SLAs. We monitor ourselves with
                independent external checks. If our checker goes down, it fails
                safe. No false alerts.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="alert-speed">
              <AccordionTrigger>How fast are alerts?</AccordionTrigger>
              <AccordionContent>
                We check your monitors every 2 minutes on Free (60s on Starter,
                10s on Pro). Once a missed ping is detected, alerts are
                dispatched within seconds. If your job explicitly reports a
                failure via ?status=fail, the alert fires immediately without
                waiting for a missed deadline.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="free-tier">
              <AccordionTrigger>Is there a free tier?</AccordionTrigger>
              <AccordionContent>
                Yes. 30 monitors with 2-minute checks, forever. No credit card
                required.
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
            <AccordionItem value="languages">
              <AccordionTrigger>
                What languages/frameworks do you support?
              </AccordionTrigger>
              <AccordionContent>
                Any. If it can make an HTTP request, it works. Bash, Python,
                Node.js, Go, Ruby, PHP, Docker — we have examples for all of
                them in the docs.
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
            <AccordionItem value="signal-types">
              <AccordionTrigger>
                What is the difference between a start, success, and fail ping?
              </AccordionTrigger>
              <AccordionContent>
                A success ping (the default) tells PulseMon your job finished
                successfully and resets the deadline. A start ping tells
                PulseMon your job has begun, useful for overlap detection, which
                alerts you if a new run starts before the previous one finishes.
                A fail ping tells PulseMon your job failed and fires an
                immediate alert without waiting for a missed deadline.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="duration-threshold">
              <AccordionTrigger>
                Can I get alerted if my job takes too long?
              </AccordionTrigger>
              <AccordionContent>
                Yes. Set a max duration on any monitor and PulseMon will alert
                you if a job checks in successfully but took longer than
                expected. Useful for catching zombie jobs that are technically
                running but stuck in a loop or processing far more data than
                normal.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="overlap">
              <AccordionTrigger>
                What happens if my job runs twice at the same time?
              </AccordionTrigger>
              <AccordionContent>
                If you use start pings, PulseMon detects overlapping runs and
                alerts you immediately. This catches race conditions where a
                slow job is still running when the next scheduled run fires, a
                common cause of duplicate records and data corruption.
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
            Takes less than 2 minutes. No credit card required.
          </p>
          <Link href="/login" className="mt-8 inline-block">
            <Button size="lg">
              Get Started Free
              <ArrowRight className="ml-[-2] h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
