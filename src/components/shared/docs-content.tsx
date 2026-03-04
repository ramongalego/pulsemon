import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MessageSquare, Webhook } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pulsemon.dev';

function Section({
  title,
  description,
  id,
  dashboard,
  children,
}: {
  title: string;
  description?: string;
  id: string;
  dashboard: boolean;
  children: React.ReactNode;
}) {
  if (dashboard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle id={id}>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    );
  }
  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold" id={id}>
        {title}
      </h2>
      {description && (
        <p className="text-muted-foreground mb-4 text-sm">{description}</p>
      )}
      {children}
    </section>
  );
}

export function DocsContent({
  variant = 'marketing',
}: {
  variant?: 'marketing' | 'dashboard';
}) {
  const isDashboard = variant === 'dashboard';

  return (
    <div className={isDashboard ? 'space-y-6' : 'mx-auto max-w-4xl space-y-16'}>
      {/* Header */}
      <div>
        <h1
          className={
            isDashboard
              ? 'text-2xl font-bold tracking-tight'
              : 'text-4xl font-bold tracking-tight'
          }
        >
          Documentation
        </h1>
        <p
          className={
            isDashboard
              ? 'text-muted-foreground'
              : 'text-muted-foreground mt-3 text-lg'
          }
        >
          Start monitoring your cron jobs in under 2 minutes.
        </p>
      </div>

      {/* Quick Start */}
      <Section dashboard={isDashboard} title="Quick Start" id="quick-start">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
              1
            </div>
            <div>
              <h3 className="font-semibold">Create a monitor</h3>
              <p className="text-muted-foreground text-sm">
                Go to your dashboard and click &quot;New Monitor&quot;. Give it
                a name, pick how often it should be pinged, and set a grace
                period.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
              2
            </div>
            <div>
              <h3 className="font-semibold">Add a ping to your job</h3>
              <p className="text-muted-foreground text-sm">
                At the end of your cron job or script, add an HTTP request to
                your monitor&apos;s unique ping URL.
              </p>
              <pre className="bg-muted mt-2 overflow-x-auto rounded-lg p-4 text-sm">
                <code>{`# Add this at the end of your cron job
curl -fsS --retry 3 ${BASE_URL}/api/ping/your-slug`}</code>
              </pre>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
              3
            </div>
            <div>
              <h3 className="font-semibold">Get alerted</h3>
              <p className="text-muted-foreground text-sm">
                If your job misses a ping, PulseMon detects it within 60 seconds
                and sends you an alert via email, Slack, Discord, or webhook.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* How Monitoring Works */}
      <Section
        dashboard={isDashboard}
        title="How Monitoring Works"
        id="how-it-works"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            PulseMon uses a dead-man&apos;s-switch model. Your job pings us on
            success; if we don&apos;t hear from it in time, we alert you.
          </p>
          <div className="rounded-lg border">
            <div className="text-muted-foreground grid grid-cols-[120px_1fr] gap-4 border-b px-4 py-3 text-xs font-medium">
              <span>Concept</span>
              <span>Description</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-4 border-b px-4 py-3 text-sm">
              <span className="text-xs font-medium">Interval</span>
              <span className="text-xs">
                How often your job runs (e.g. every 300 s for a 5-minute cron).
                PulseMon expects a ping at least once per interval.
              </span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-4 border-b px-4 py-3 text-sm">
              <span className="text-xs font-medium">Grace period</span>
              <span className="text-xs">
                Extra time added on top of the interval for network latency and
                clock skew. Defaults scale with your interval: 30 s for fast
                jobs, up to 30 min for weekly ones.
              </span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-4 border-b px-4 py-3 text-sm">
              <span className="text-xs font-medium">Deadline</span>
              <span className="text-xs">
                <code className="bg-muted rounded px-1 py-0.5">
                  last ping + interval + grace period
                </code>
                . If no ping arrives before the deadline, the monitor is marked{' '}
                <strong>down</strong>.
              </span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-4 px-4 py-3 text-sm">
              <span className="text-xs font-medium">Check cycle</span>
              <span className="text-xs">
                PulseMon checks every monitor once every 60 seconds. Worst case,
                a missed deadline is detected ~60s after it passes.
              </span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            <strong>Alert escalation:</strong> When a monitor goes down you
            receive an immediate alert, then follow-up reminders at 1 h, 6 h,
            and 24 h. After that, reminders repeat daily until the monitor
            recovers.
          </p>
        </div>
      </Section>

      {/* Ping API */}
      <Section dashboard={isDashboard} title="Ping API" id="ping-api">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-base">
                <span className="mr-2 rounded bg-green-500/10 px-2 py-1 text-green-600">
                  GET
                </span>
                /api/ping/&#123;slug&#125;
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Send a heartbeat ping for the given monitor. Always returns{' '}
                <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
                  200 OK
                </code>
                , even on internal errors, so your cron job won&apos;t fail
                because of monitoring.
              </p>

              <div>
                <h4 className="mb-2 text-sm font-semibold">Parameters</h4>
                <div className="rounded-lg border">
                  <div className="text-muted-foreground grid grid-cols-3 gap-4 border-b px-4 py-2 text-xs font-medium">
                    <span>Parameter</span>
                    <span>Type</span>
                    <span>Description</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-b px-4 py-2 text-sm">
                    <code className="text-xs">slug</code>
                    <span className="text-muted-foreground text-xs">
                      string
                    </span>
                    <span className="text-xs">Monitor slug (path param)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-b px-4 py-2 text-sm">
                    <code className="text-xs">status</code>
                    <span className="text-muted-foreground text-xs">
                      &quot;success&quot; | &quot;fail&quot;
                    </span>
                    <span className="text-xs">
                      Optional. Report a failure explicitly
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 px-4 py-2 text-sm">
                    <code className="text-xs">duration</code>
                    <span className="text-muted-foreground text-xs">
                      number
                    </span>
                    <span className="text-xs">
                      Optional. Job duration in ms
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold">Response</h4>
                <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
                  <code>{`{ "ok": true }`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-base">
                <span className="mr-2 rounded bg-blue-500/10 px-2 py-1 text-blue-600">
                  POST
                </span>
                /api/ping/&#123;slug&#125;
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Same as GET, but accepts a JSON body for additional metadata.
              </p>

              <div>
                <h4 className="mb-2 text-sm font-semibold">Body Parameters</h4>
                <div className="rounded-lg border">
                  <div className="text-muted-foreground grid grid-cols-3 gap-4 border-b px-4 py-2 text-xs font-medium">
                    <span>Parameter</span>
                    <span>Type</span>
                    <span>Description</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-b px-4 py-2 text-sm">
                    <code className="text-xs">status</code>
                    <span className="text-muted-foreground text-xs">
                      &quot;success&quot; | &quot;fail&quot;
                    </span>
                    <span className="text-xs">
                      Optional. Defaults to &quot;success&quot;
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-b px-4 py-2 text-sm">
                    <code className="text-xs">duration</code>
                    <span className="text-muted-foreground text-xs">
                      number
                    </span>
                    <span className="text-xs">
                      Optional. Job duration in ms
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 px-4 py-2 text-sm">
                    <code className="text-xs">body</code>
                    <span className="text-muted-foreground text-xs">
                      string
                    </span>
                    <span className="text-xs">
                      Optional. Job output or error message (max 10 KB)
                    </span>
                  </div>
                </div>
              </div>

              <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
                <code>{`curl -X POST ${BASE_URL}/api/ping/your-slug \\
  -H "Content-Type: application/json" \\
  -d '{"status": "success", "duration": 1234, "body": "Processed 500 records"}'`}</code>
              </pre>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Reporting Failures */}
      <Section
        dashboard={isDashboard}
        title="Reporting Failures"
        id="reporting-failures"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            By default, every ping is treated as a success and resets the
            monitor&apos;s deadline. If your job detects an error, you can
            report it explicitly with{' '}
            <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
              ?status=fail
            </code>
            .
          </p>
          <p className="text-muted-foreground text-sm">
            A fail ping is recorded in your ping history but does{' '}
            <strong>not</strong> mark the monitor as &quot;up&quot;. It
            won&apos;t reset the deadline or resolve an open incident. Use this
            to tell apart &quot;the job ran but errored&quot; from &quot;the job
            ran successfully.&quot;
          </p>
          <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
            <code>{`#!/bin/bash
set -e

if /usr/local/bin/backup.sh; then
  curl -fsS --retry 3 "${BASE_URL}/api/ping/nightly-backup"
else
  curl -fsS --retry 3 "${BASE_URL}/api/ping/nightly-backup?status=fail"
fi`}</code>
          </pre>
        </div>
      </Section>

      {/* Rate Limiting */}
      <Section dashboard={isDashboard} title="Rate Limiting" id="rate-limiting">
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            The ping endpoint enforces a rate limit of{' '}
            <strong>1 request per second per slug</strong>. If you exceed this
            limit, the endpoint returns a{' '}
            <code className="bg-muted rounded px-1.5 py-0.5 text-xs">429</code>{' '}
            status code.
          </p>
          <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
            <code>{`// 429 response
{ "ok": false, "error": "Rate limited" }`}</code>
          </pre>
          <p className="text-muted-foreground text-sm">
            This prevents accidental flood loops. Any real cron job or heartbeat
            stays well under 1 req/sec. If you use{' '}
            <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
              curl --retry 3
            </code>
            , retries will back off naturally and won&apos;t hit this limit.
          </p>
        </div>
      </Section>

      {/* Integration Examples */}
      <Section
        dashboard={isDashboard}
        title="Integration Examples"
        id="integrations"
      >
        <Tabs defaultValue="cron">
          <TabsList>
            <TabsTrigger value="cron">Crontab</TabsTrigger>
            <TabsTrigger value="bash">Bash</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
            <TabsTrigger value="node">Node.js</TabsTrigger>
            <TabsTrigger value="go">Go</TabsTrigger>
            <TabsTrigger value="ruby">Ruby</TabsTrigger>
            <TabsTrigger value="docker">Docker</TabsTrigger>
          </TabsList>

          <TabsContent value="cron">
            <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
              <code>{`# Run backup every day at 2am, ping PulseMon on success
0 2 * * * /usr/local/bin/backup.sh && curl -fsS --retry 3 ${BASE_URL}/api/ping/nightly-backup`}</code>
            </pre>
          </TabsContent>

          <TabsContent value="bash">
            <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
              <code>{`#!/bin/bash
set -e

# Your job logic here
echo "Running data sync..."
./sync-data.sh

# Ping PulseMon on completion
curl -fsS --retry 3 ${BASE_URL}/api/ping/data-sync`}</code>
            </pre>
          </TabsContent>

          <TabsContent value="python">
            <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
              <code>{`import requests
import time

start = time.time()

# Your job logic here
process_records()

duration = int((time.time() - start) * 1000)
requests.get(
    "${BASE_URL}/api/ping/record-processor",
    params={"duration": duration},
    timeout=10,
)`}</code>
            </pre>
          </TabsContent>

          <TabsContent value="node">
            <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
              <code>{`const start = Date.now();

// Your job logic here
await processQueue();

const duration = Date.now() - start;
await fetch(\`${BASE_URL}/api/ping/queue-worker?duration=\${duration}\`);`}</code>
            </pre>
          </TabsContent>

          <TabsContent value="go">
            <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
              <code>{`package main

import (
    "net/http"
    "log"
)

func main() {
    // Your job logic here
    runBackup()

    resp, err := http.Get("${BASE_URL}/api/ping/go-backup")
    if err != nil {
        log.Printf("ping failed: %v", err)
        return
    }
    defer resp.Body.Close()
}`}</code>
            </pre>
          </TabsContent>

          <TabsContent value="ruby">
            <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
              <code>{`require "net/http"
require "benchmark"

# Your job logic here
elapsed = Benchmark.realtime { run_cleanup }
duration = (elapsed * 1000).to_i

uri = URI("${BASE_URL}/api/ping/ruby-cleanup?duration=#{duration}")
Net::HTTP.get(uri)`}</code>
            </pre>
          </TabsContent>

          <TabsContent value="docker">
            <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
              <code>{`# Containerised cron job with PulseMon ping
FROM alpine:3.20
RUN apk add --no-cache curl

# Install your cron schedule
COPY crontab /etc/crontabs/root

# Example crontab entry:
# 0 * * * * /scripts/sync.sh && curl -fsS --retry 3 ${BASE_URL}/api/ping/docker-sync

CMD ["crond", "-f", "-l", "2"]`}</code>
            </pre>
          </TabsContent>
        </Tabs>
      </Section>

      {/* Alert Channels */}
      <Section
        dashboard={isDashboard}
        title="Alert Channels"
        id="alert-channels"
      >
        <div className="divide-y rounded-lg border">
          {[
            {
              name: 'Email',
              icon: Mail,
              desc: 'Sends alerts to your account email by default. Add more addresses on the Alerts page.',
            },
            {
              name: 'Slack',
              icon: MessageSquare,
              desc: 'Add a Slack incoming webhook URL to receive alerts in any Slack channel.',
            },
            {
              name: 'Discord',
              icon: MessageSquare,
              desc: 'Add a Discord webhook URL to receive alerts in any Discord channel.',
            },
            {
              name: 'Custom Webhook',
              icon: Webhook,
              desc: 'Sends JSON POST requests to any URL, signed with HMAC-SHA256.',
            },
          ].map((ch) => (
            <div key={ch.name} className="flex items-start gap-3 px-4 py-3">
              <ch.icon className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
              <span className="text-sm font-medium whitespace-nowrap">
                {ch.name}
              </span>
              <span className="text-muted-foreground text-sm">{ch.desc}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Webhook Payload */}
      <Section
        dashboard={isDashboard}
        title="Webhook Payload"
        description="When an alert fires, PulseMon sends a JSON POST request with this payload:"
        id="webhook-payload"
      >
        <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
          <code>{`{
  "event": "monitor.down",
  "monitor": {
    "id": "uuid",
    "name": "Nightly Backup",
    "slug": "nightly-backup",
    "status": "down",
    "lastPingAt": "2025-01-15T02:00:00Z",
    "expectedInterval": 86400
  },
  "incident": {
    "id": "uuid",
    "startedAt": "2025-01-16T02:05:00Z"
  },
  "timestamp": "2025-01-16T02:05:00Z"
}`}</code>
        </pre>
        <p className="text-muted-foreground text-sm">
          Recovery events have the same shape with{' '}
          <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
            &quot;event&quot;: &quot;monitor.up&quot;
          </code>{' '}
          and the incident includes{' '}
          <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
            resolvedAt
          </code>{' '}
          and{' '}
          <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
            duration
          </code>{' '}
          (seconds the monitor was down).
        </p>
      </Section>

      {/* Webhook Signature Verification */}
      <Section
        dashboard={isDashboard}
        title="Webhook Signature Verification"
        id="webhook-verification"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            If you configure a secret on your webhook alert channel, PulseMon
            signs every request with an HMAC-SHA256 signature in the{' '}
            <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
              X-PulseMon-Signature
            </code>{' '}
            header. The format is{' '}
            <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
              sha256=&lt;hex&gt;
            </code>
            . Verify this before processing the payload.
          </p>

          <Tabs defaultValue="node">
            <TabsList>
              <TabsTrigger value="node">Node.js</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
            </TabsList>

            <TabsContent value="node">
              <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
                <code>{`import crypto from "crypto";

function verifySignature(body, secret, signatureHeader) {
  const expected = "sha256=" +
    crypto.createHmac("sha256", secret).update(body).digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signatureHeader),
  );
}

// In your webhook handler:
app.post("/webhooks/pulsemon", (req, res) => {
  const signature = req.headers["x-pulsemon-signature"];
  const body = JSON.stringify(req.body);

  if (!signature || !verifySignature(body, process.env.WEBHOOK_SECRET, signature)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const event = req.body;
  console.log(\`Monitor \${event.monitor.name} is \${event.event}\`);
  res.json({ ok: true });
});`}</code>
              </pre>
            </TabsContent>

            <TabsContent value="python">
              <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
                <code>{`import hmac
import hashlib
import os

def verify_signature(body: bytes, secret: str, signature_header: str) -> bool:
    expected = "sha256=" + hmac.new(
        secret.encode(), body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)

# Flask example:
@app.route("/webhooks/pulsemon", methods=["POST"])
def handle_webhook():
    signature = request.headers.get("X-PulseMon-Signature", "")
    body = request.get_data()

    if not verify_signature(body, os.environ["WEBHOOK_SECRET"], signature):
        return {"error": "Invalid signature"}, 401

    event = request.get_json()
    print(f"Monitor {event['monitor']['name']} is {event['event']}")
    return {"ok": True}`}</code>
              </pre>
            </TabsContent>
          </Tabs>
        </div>
      </Section>

      {/* API Keys */}
      <Section dashboard={isDashboard} title="API Keys" id="api-keys">
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Create API keys in <strong>Settings → API Keys</strong> to manage
            monitors programmatically. Keys use Bearer token auth with the
            prefix{' '}
            <code className="bg-muted rounded px-1.5 py-0.5 text-xs">pm_</code>.
            You only see the raw key once at creation, so store it somewhere
            safe.
          </p>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Authentication</h4>
            <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
              <code>{`curl ${BASE_URL}/api/v1/monitors \\
  -H "Authorization: Bearer pm_your-api-key"`}</code>
            </pre>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Endpoints</h4>
            <div className="rounded-lg border">
              <div className="text-muted-foreground grid grid-cols-[80px_1fr_1fr] gap-4 border-b px-4 py-2 text-xs font-medium">
                <span>Method</span>
                <span>Path</span>
                <span>Description</span>
              </div>
              <div className="grid grid-cols-[80px_1fr_1fr] gap-4 border-b px-4 py-2 text-sm">
                <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-center text-xs text-green-600">
                  GET
                </span>
                <code className="text-xs">/api/v1/monitors</code>
                <span className="text-xs">List all monitors</span>
              </div>
              <div className="grid grid-cols-[80px_1fr_1fr] gap-4 border-b px-4 py-2 text-sm">
                <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-center text-xs text-blue-600">
                  POST
                </span>
                <code className="text-xs">/api/v1/monitors</code>
                <span className="text-xs">Create a monitor</span>
              </div>
              <div className="grid grid-cols-[80px_1fr_1fr] gap-4 border-b px-4 py-2 text-sm">
                <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-center text-xs text-green-600">
                  GET
                </span>
                <code className="text-xs">/api/v1/monitors/&#123;id&#125;</code>
                <span className="text-xs">Get monitor details</span>
              </div>
              <div className="grid grid-cols-[80px_1fr_1fr] gap-4 border-b px-4 py-2 text-sm">
                <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-center text-xs text-yellow-600">
                  PATCH
                </span>
                <code className="text-xs">/api/v1/monitors/&#123;id&#125;</code>
                <span className="text-xs">Update a monitor</span>
              </div>
              <div className="grid grid-cols-[80px_1fr_1fr] gap-4 border-b px-4 py-2 text-sm">
                <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-center text-xs text-red-600">
                  DELETE
                </span>
                <code className="text-xs">/api/v1/monitors/&#123;id&#125;</code>
                <span className="text-xs">Delete a monitor</span>
              </div>
              <div className="grid grid-cols-[80px_1fr_1fr] gap-4 border-b px-4 py-2 text-sm">
                <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-center text-xs text-blue-600">
                  POST
                </span>
                <code className="text-xs">
                  /api/v1/monitors/&#123;id&#125;/pause
                </code>
                <span className="text-xs">Pause a monitor</span>
              </div>
              <div className="grid grid-cols-[80px_1fr_1fr] gap-4 border-b px-4 py-2 text-sm">
                <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-center text-xs text-blue-600">
                  POST
                </span>
                <code className="text-xs">
                  /api/v1/monitors/&#123;id&#125;/resume
                </code>
                <span className="text-xs">Resume a monitor</span>
              </div>
              <div className="grid grid-cols-[80px_1fr_1fr] gap-4 border-b px-4 py-2 text-sm">
                <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-center text-xs text-green-600">
                  GET
                </span>
                <code className="text-xs">
                  /api/v1/monitors/&#123;id&#125;/pings
                </code>
                <span className="text-xs">Ping history (paginated)</span>
              </div>
              <div className="grid grid-cols-[80px_1fr_1fr] gap-4 px-4 py-2 text-sm">
                <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-center text-xs text-green-600">
                  GET
                </span>
                <code className="text-xs">
                  /api/v1/monitors/&#123;id&#125;/incidents
                </code>
                <span className="text-xs">Incident history (paginated)</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">
              Example: Create a Monitor
            </h4>
            <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
              <code>{`curl -X POST ${BASE_URL}/api/v1/monitors \\
  -H "Authorization: Bearer pm_your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Nightly Backup",
    "slug": "nightly-backup",
    "expectedInterval": 86400,
    "gracePeriod": 900
  }'`}</code>
            </pre>
          </div>

          <p className="text-muted-foreground text-sm">
            All endpoints return{' '}
            <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
              {`{ "data": T, "error": null }`}
            </code>{' '}
            on success and{' '}
            <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
              {`{ "data": null, "error": { "code": "...", "message": "..." } }`}
            </code>{' '}
            on failure. Missing or invalid keys return{' '}
            <code className="bg-muted rounded px-1.5 py-0.5 text-xs">401</code>.
          </p>
        </div>
      </Section>

      {/* OpenClaw Skill */}
      <Section dashboard={isDashboard} title="OpenClaw Skill" id="openclaw">
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Use PulseMon from WhatsApp, Telegram, or Slack via{' '}
            <a
              href="https://openclaw.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4"
            >
              OpenClaw
            </a>
            . Install the skill and manage your monitors with natural language.
          </p>
          <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
            <code>clawhub install pulsemon</code>
          </pre>
          <p className="text-muted-foreground text-sm">
            Set your API key as an environment variable:
          </p>
          <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
            <code>PULSEMON_API_KEY=pm_your-key-here</code>
          </pre>
          <p className="text-muted-foreground text-sm">
            Then ask your agent things like &quot;check my monitors&quot;,
            &quot;create a monitor called nightly-backup that runs daily&quot;,
            or &quot;pause the data-sync monitor&quot;.
          </p>
        </div>
      </Section>
    </div>
  );
}
