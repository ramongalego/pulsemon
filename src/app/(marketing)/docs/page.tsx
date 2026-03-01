import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata: Metadata = {
  title: 'Documentation - PulseMon',
  description:
    'Quick-start guide and API reference for PulseMon cron job monitoring.',
};

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pulsemon.dev';

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Documentation</h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Everything you need to start monitoring your cron jobs in under 2
          minutes.
        </p>
      </div>

      {/* Quick Start */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold" id="quick-start">
          Quick Start
        </h2>
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
      </section>

      {/* Ping API */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold" id="ping-api">
          Ping API
        </h2>

        <Card className="mb-6">
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
              Send a heartbeat ping for the given monitor. This endpoint is
              designed to be fast and resilient — it always returns{' '}
              <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
                200 OK
              </code>{' '}
              even if there&apos;s an internal error, so your cron job
              won&apos;t fail because of monitoring.
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
                  <span className="text-muted-foreground text-xs">string</span>
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
                  <span className="text-muted-foreground text-xs">number</span>
                  <span className="text-xs">Optional. Job duration in ms</span>
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
            <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
              <code>{`curl -X POST ${BASE_URL}/api/ping/your-slug \\
  -H "Content-Type: application/json" \\
  -d '{"status": "success", "duration": 1234, "body": "Processed 500 records"}'`}</code>
            </pre>
          </CardContent>
        </Card>
      </section>

      {/* Integration Examples */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold" id="integrations">
          Integration Examples
        </h2>
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
              <code>{`# Dockerfile healthcheck
HEALTHCHECK --interval=60s --timeout=10s --retries=3 \\
  CMD curl -fsS ${BASE_URL}/api/ping/docker-service || exit 1`}</code>
            </pre>
          </TabsContent>
        </Tabs>
      </section>

      {/* Alert Channels */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold" id="alert-channels">
          Alert Channels
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Email</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Alerts sent to your account email by default. Configure
                additional email addresses in the Integrations page.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Slack</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Add a Slack incoming webhook URL to receive alerts in any Slack
                channel.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Discord</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Add a Discord webhook URL to receive alerts in any Discord
                channel.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Custom Webhook</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Send alerts as JSON POST requests to any URL. Includes HMAC
                signature for verification.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Webhook Payload */}
      <section>
        <h2 className="mb-6 text-2xl font-bold" id="webhook-payload">
          Webhook Payload
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          When an alert fires, PulseMon sends a JSON POST request with this
          payload:
        </p>
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
      </section>
    </div>
  );
}
