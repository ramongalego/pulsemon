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
      <section className="relative overflow-hidden">
        {/* Dot grid background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(16,185,129,0.35)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_65%_50%_at_50%_0%,black_20%,transparent_100%)] bg-[length:28px_28px] [-webkit-mask-image:radial-gradient(ellipse_65%_50%_at_50%_0%,black_20%,transparent_100%)]"
        />
        {/* Breathing radial glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 h-[620px] w-[900px] -translate-x-1/2 animate-[heroGlow_7s_ease-in-out_infinite] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.22)_0%,rgba(16,185,129,0.08)_40%,transparent_70%)]"
        />
        {/* Corner annotation marks */}
        <div
          aria-hidden="true"
          className="text-muted-foreground/30 pointer-events-none absolute inset-x-0 top-16 hidden justify-between px-6 sm:flex md:top-20"
        >
          <div className="h-7 w-7 border-t border-l border-current" />
          <div className="h-7 w-7 border-t border-r border-current" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 md:pt-24 md:pb-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl lg:text-6xl">
                Your cron jobs fail{' '}
                <span className="relative inline-block">
                  <span className="relative z-10">silently</span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 200 12"
                    preserveAspectRatio="none"
                    className="absolute -bottom-2 left-0 z-0 h-3 w-full overflow-visible text-emerald-500"
                  >
                    <path
                      d="M3 8 Q 50 2, 100 6 T 197 5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                .
                <br />
                <span className="text-primary">Not anymore.</span>
              </h1>
              <p className="text-muted-foreground mt-6 text-lg md:text-xl">
                Heartbeat monitoring for cron jobs, background tasks, and
                scheduled scripts. If your job doesn&apos;t check in on time,
                you know in under 2 minutes.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="group w-full shadow-sm transition-all hover:shadow-[0_0_0_4px_rgba(16,185,129,0.18)] sm:w-auto"
                  >
                    Get Started Free
                    <ArrowRight className="ml-[-2] h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
              <div className="overflow-hidden rounded-xl border bg-slate-950 shadow-2xl shadow-emerald-500/10">
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

          <div className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
            {/* Dashed connector line behind the circles, desktop only */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-7 right-[16%] left-[16%] hidden h-px border-t border-dashed border-emerald-500/30 md:block"
            />

            {[
              {
                n: 1,
                pingDelay: '[animation-delay:0s]',
                title: 'Create a monitor',
                desc: (
                  <>Name it, pick how often it should run. Takes 10 seconds.</>
                ),
              },
              {
                n: 2,
                pingDelay: '[animation-delay:1s]',
                title: 'Add one line to your script',
                desc: (
                  <>
                    Append{' '}
                    <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
                      curl -fsS https://pulsemon.dev/api/ping/your-slug
                    </code>{' '}
                    at the end.
                  </>
                ),
              },
              {
                n: 3,
                pingDelay: '[animation-delay:2s]',
                title: 'Get alerted when it fails',
                desc: <>Slack, Discord, email, or webhooks. You choose.</>,
              },
            ].map((step) => (
              <div
                key={step.n}
                className="group relative text-center transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="bg-background ring-primary/15 text-primary relative z-10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold shadow-sm ring-1 transition-colors group-hover:ring-emerald-500/40">
                  <span
                    aria-hidden="true"
                    className={`absolute inset-0 animate-[stepPing_3s_ease-out_infinite] rounded-full bg-emerald-500/25 ${step.pingDelay}`}
                  />
                  <span className="relative">{step.n}</span>
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-muted-foreground mx-auto mt-2 max-w-xs text-sm">
                  {step.desc}
                </p>
              </div>
            ))}
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

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                {
                  icon: Zap,
                  title: 'Instant alerts',
                  accent: 'amber',
                  desc: 'Slack, Discord, email, and webhooks. Know within minutes. Escalating reminders at 1h, 6h, and 24h until resolved.',
                },
                {
                  icon: LayoutDashboard,
                  title: 'Ping history and uptime',
                  accent: 'indigo',
                  desc: 'See every ping, response time, and incident. Track uptime over 7, 30, or 90 days.',
                },
                {
                  icon: GitMerge,
                  title: 'Overlap detection',
                  accent: 'rose',
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
                  accent: 'emerald',
                  desc: 'Share a branded status page with your users. Shows uptime, incidents, and current status.',
                },
                {
                  icon: FileText,
                  title: 'Alerts include job output',
                  accent: 'indigo',
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
                  accent: 'rose',
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
                  accent: 'amber',
                  desc: 'Set a max run time. Get alerted when a job finishes but took way too long.',
                },
                {
                  icon: Lock,
                  title: 'Webhook signatures',
                  accent: 'emerald',
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
            ).map((feature) => {
              const accentClasses = {
                amber: {
                  iconWrap:
                    'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                  border: 'hover:border-amber-500/40',
                  shadow:
                    'hover:shadow-[0_10px_30px_-12px_rgba(245,158,11,0.18)]',
                },
                indigo: {
                  iconWrap:
                    'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
                  border: 'hover:border-indigo-500/40',
                  shadow:
                    'hover:shadow-[0_10px_30px_-12px_rgba(99,102,241,0.18)]',
                },
                rose: {
                  iconWrap: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
                  border: 'hover:border-rose-500/40',
                  shadow:
                    'hover:shadow-[0_10px_30px_-12px_rgba(244,63,94,0.18)]',
                },
                emerald: {
                  iconWrap:
                    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                  border: 'hover:border-emerald-500/40',
                  shadow:
                    'hover:shadow-[0_10px_30px_-12px_rgba(16,185,129,0.18)]',
                },
              } as const;
              const a = accentClasses[feature.accent];
              return (
                <Card
                  key={feature.title}
                  className={`group shadow-none transition-all duration-300 hover:-translate-y-1 ${a.border} ${a.shadow}`}
                >
                  <CardHeader className="pb-2">
                    <div
                      className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-6 ${a.iconWrap}`}
                    >
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
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

          <div className="bg-background/50 mt-12 overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-muted-foreground px-4 py-4 text-left font-medium">
                    Feature
                  </th>
                  <th className="text-primary relative px-4 py-4 text-center font-semibold">
                    <span className="relative inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      PulseMon
                    </span>
                  </th>
                  <th className="text-muted-foreground px-4 py-4 text-center font-medium">
                    Cronitor
                  </th>
                  <th className="text-muted-foreground px-4 py-4 text-center font-medium">
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
                  <tr
                    key={row.feature}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-medium">{row.feature}</td>
                    <td className="text-primary bg-emerald-500/5 px-4 py-3.5 text-center font-semibold">
                      {row.pulsemon}
                    </td>
                    <td className="text-muted-foreground px-4 py-3.5 text-center">
                      {row.cronitor}
                    </td>
                    <td className="text-muted-foreground px-4 py-3.5 text-center">
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

          <div className="mt-12 grid gap-6 md:grid-cols-3 md:gap-8">
            {/* Free */}
            <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>
                  For side projects and personal use
                </CardDescription>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-5xl font-bold tracking-tight">$0</span>
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
            <Card className="relative border-emerald-500/50 shadow-lg ring-1 ring-emerald-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(16,185,129,0.35)]">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-1 text-xs font-semibold text-white shadow-sm">
                Most popular
              </span>
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>
                  For indie devs and small teams
                </CardDescription>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-5xl font-bold tracking-tight">$9</span>
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
                  <Button className="w-full bg-emerald-500 text-white hover:bg-emerald-600">
                    Get started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <CardDescription>
                  For production workloads and growing SaaS
                </CardDescription>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-5xl font-bold tracking-tight">$19</span>
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

          <Accordion type="single" collapsible className="mt-12 space-y-3">
            {(
              [
                {
                  value: 'service-down',
                  n: '01',
                  q: 'What happens if YOUR service goes down?',
                  a: (
                    <>
                      PulseMon runs on Vercel&apos;s edge network and Upstash
                      Redis, both with 99.99% uptime SLAs. We monitor ourselves
                      with independent external checks. If our checker goes
                      down, it fails safe. No false alerts.
                    </>
                  ),
                },
                {
                  value: 'alert-speed',
                  n: '02',
                  q: 'How fast are alerts?',
                  a: (
                    <>
                      We check your monitors every 2 minutes on Free (60s on
                      Starter, 10s on Pro). Once a missed ping is detected,
                      alerts are dispatched within seconds. If your job
                      explicitly reports a failure via ?status=fail, the alert
                      fires immediately without waiting for a missed deadline.
                    </>
                  ),
                },
                {
                  value: 'free-tier',
                  n: '03',
                  q: 'Is there a free tier?',
                  a: (
                    <>
                      Yes. 30 monitors with 2-minute checks, forever. No credit
                      card required.
                    </>
                  ),
                },
                {
                  value: 'firewall',
                  n: '04',
                  q: 'Can I monitor jobs behind a firewall?',
                  a: (
                    <>
                      Yes. PulseMon uses a &quot;dead man&apos;s switch&quot;
                      model: your job pings us, not the other way around. As
                      long as your server can make outbound HTTPS requests, it
                      works. No firewall rules to configure, no agents to
                      install.
                    </>
                  ),
                },
                {
                  value: 'languages',
                  n: '05',
                  q: 'What languages/frameworks do you support?',
                  a: (
                    <>
                      Any. If it can make an HTTP request, it works. Bash,
                      Python, Node.js, Go, Ruby, PHP, Docker — we have examples
                      for all of them in the docs.
                    </>
                  ),
                },
                {
                  value: 'heartbeat',
                  n: '06',
                  q: "What is a heartbeat / dead man's switch monitor?",
                  a: (
                    <>
                      A heartbeat monitor expects regular &quot;I&apos;m
                      alive&quot; signals (pings) from your service. If a ping
                      doesn&apos;t arrive within the expected interval plus a
                      grace period, the monitor fires an alert. It&apos;s the
                      simplest way to know that a scheduled job is still running
                      on time.
                    </>
                  ),
                },
                {
                  value: 'signal-types',
                  n: '07',
                  q: 'What is the difference between a start, success, and fail ping?',
                  a: (
                    <>
                      A success ping (the default) tells PulseMon your job
                      finished successfully and resets the deadline. A start
                      ping tells PulseMon your job has begun, useful for overlap
                      detection, which alerts you if a new run starts before the
                      previous one finishes. A fail ping tells PulseMon your job
                      failed and fires an immediate alert without waiting for a
                      missed deadline.
                    </>
                  ),
                },
                {
                  value: 'duration-threshold',
                  n: '08',
                  q: 'Can I get alerted if my job takes too long?',
                  a: (
                    <>
                      Yes. Set a max duration on any monitor and PulseMon will
                      alert you if a job checks in successfully but took longer
                      than expected. Useful for catching zombie jobs that are
                      technically running but stuck in a loop or processing far
                      more data than normal.
                    </>
                  ),
                },
                {
                  value: 'overlap',
                  n: '09',
                  q: 'What happens if my job runs twice at the same time?',
                  a: (
                    <>
                      If you use start pings, PulseMon detects overlapping runs
                      and alerts you immediately. This catches race conditions
                      where a slow job is still running when the next scheduled
                      run fires, a common cause of duplicate records and data
                      corruption.
                    </>
                  ),
                },
              ] as const
            ).map((faq) => (
              <AccordionItem
                key={faq.value}
                value={faq.value}
                className="bg-card hover:border-foreground/20 data-[state=open]:border-foreground/20 rounded-xl border px-6 transition-colors last:border-b"
              >
                <AccordionTrigger className="hover:no-underline">
                  <span className="flex items-start gap-4">
                    <span className="text-muted-foreground/50 pt-0.5 font-mono text-xs">
                      {faq.n}
                    </span>
                    <span className="text-base font-semibold">{faq.q}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pl-[2.5rem] leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA — mirrors hero's visual language */}
      <section className="relative overflow-hidden py-20 md:py-28">
        {/* Dot grid background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(16,185,129,0.3)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_55%_70%_at_50%_50%,black_20%,transparent_100%)] bg-[length:28px_28px] [-webkit-mask-image:radial-gradient(ellipse_55%_70%_at_50%_50%,black_20%,transparent_100%)]"
        />
        {/* Breathing radial glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 h-[480px] w-[720px] -translate-x-1/2 -translate-y-1/2 animate-[heroGlow_7s_ease-in-out_infinite] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.22)_0%,rgba(16,185,129,0.08)_40%,transparent_70%)]"
        />
        {/* Bottom corner brackets — bookend to hero */}
        <div
          aria-hidden="true"
          className="text-muted-foreground/30 pointer-events-none absolute inset-x-0 bottom-16 hidden justify-between px-6 sm:flex"
        >
          <div className="h-7 w-7 border-b border-l border-current" />
          <div className="h-7 w-7 border-r border-b border-current" />
        </div>

        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Stop{' '}
            <span className="relative inline-block">
              <span className="relative z-10">finding out</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
                className="absolute -bottom-1.5 left-0 z-0 h-2.5 w-full overflow-visible text-emerald-500"
              >
                <path
                  d="M3 8 Q 50 2, 100 6 T 197 5"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>{' '}
            about failed cron jobs from your users
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Takes less than 2 minutes. No credit card required.
          </p>
          <Link href="/login" className="mt-8 inline-block">
            <Button
              size="lg"
              className="group shadow-sm transition-all hover:shadow-[0_0_0_4px_rgba(16,185,129,0.18)]"
            >
              Get Started Free
              <ArrowRight className="ml-[-2] h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
