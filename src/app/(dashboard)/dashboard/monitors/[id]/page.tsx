import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import {
  monitors,
  pings,
  incidents,
  alertChannels,
  monitorAlertChannels,
} from '@/lib/db/schema';
import { eq, and, desc, gte, lt, count } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { RelativeTime } from '@/components/shared/relative-time';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { UpgradeButton } from '@/components/dashboard/upgrade-button';
import Link from 'next/link';
import { getUserPlan, getPlanLimits } from '@/lib/plan-limits';
import { CopyButton } from '@/components/dashboard/copy-button';
import { PingWatcher } from '@/components/dashboard/ping-watcher';
import { PingsTable } from '@/components/dashboard/pings-table';
import { IncidentsTable } from '@/components/dashboard/incidents-table';
import { PauseResumeButton } from '@/components/dashboard/pause-resume-button';
import { ResponseTimeChart } from '@/components/dashboard/response-time-chart';
import { MonitorConfigEditor } from '@/components/dashboard/monitor-config-editor';
import { MonitorChannelLinker } from '@/components/dashboard/monitor-channel-linker';
import { PingTimeline } from '@/components/dashboard/ping-timeline';
import { computeUptime } from '@/lib/monitoring/uptime';

export default async function MonitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const { id } = await params;
  const userId = session.user.id;

  // Fetch real monitor data from DB
  const [monitor] = await db
    .select()
    .from(monitors)
    .where(and(eq(monitors.id, id), eq(monitors.userId, userId)))
    .limit(1);

  if (!monitor) notFound();

  // Compute 30-day cutoff (shared by timeline, pings, and uptime)
  const thirtyDaysAgo = new Date(
    new Date().getTime() - 30 * 24 * 60 * 60 * 1000,
  );

  // Fetch pings for timeline (last 30 days) and table (first page)
  const timelinePings = await db
    .select()
    .from(pings)
    .where(
      and(
        eq(pings.monitorId, monitor.id),
        gte(pings.receivedAt, thirtyDaysAgo),
      ),
    )
    .orderBy(desc(pings.receivedAt));

  const initialTablePings = timelinePings.slice(0, 10);

  // Fetch incidents (first page)
  const monitorIncidents = await db
    .select()
    .from(incidents)
    .where(eq(incidents.monitorId, monitor.id))
    .orderBy(desc(incidents.startedAt))
    .limit(10);
  const recentIncidents = await db
    .select()
    .from(incidents)
    .where(
      and(
        eq(incidents.monitorId, monitor.id),
        gte(incidents.startedAt, thirtyDaysAgo),
      ),
    );

  const uptimePercent = computeUptime(
    recentIncidents,
    monitor.createdAt,
    monitor.status !== 'new',
  );

  // Fetch alert channels for this monitor
  const userChannels = await db
    .select()
    .from(alertChannels)
    .where(eq(alertChannels.userId, userId));

  const linkedRows = await db
    .select({ alertChannelId: monitorAlertChannels.alertChannelId })
    .from(monitorAlertChannels)
    .where(eq(monitorAlertChannels.monitorId, monitor.id));

  const linkedChannelIds = linkedRows.map((r) => r.alertChannelId);

  // Plan-based retention info
  const plan = await getUserPlan(userId);
  const limits = getPlanLimits(plan);
  const retentionCutoff = new Date(
    new Date().getTime() - limits.pingHistoryDays * 24 * 60 * 60 * 1000,
  );
  const [{ value: hiddenPingCount }] = await db
    .select({ value: count() })
    .from(pings)
    .where(
      and(
        eq(pings.monitorId, monitor.id),
        lt(pings.receivedAt, retentionCutoff),
      ),
    );
  const hasHiddenPings = hiddenPingCount > 0;

  const pingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ping/${monitor.slug}`;

  const codeSnippets = {
    curl: `curl -fsS --retry 3 ${pingUrl}`,
    python: `import requests\nrequests.get("${pingUrl}")`,
    node: `fetch("${pingUrl}");`,
    go: `http.Get("${pingUrl}")`,
    ruby: `require "net/http"\nNet::HTTP.get(URI("${pingUrl}"))`,
  };

  return (
    <div className="space-y-6">
      {/* Auto-refresh: polls for first ping when "new", refreshes every 10s otherwise */}
      <PingWatcher monitorId={monitor.id} status={monitor.status} />

      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        <Link href="/dashboard" className="mt-1 sm:mt-0">
          <Button variant="ghost" size="icon" aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {monitor.name}
            </h1>
            {monitor.isPaused ? (
              <span className="text-muted-foreground bg-muted rounded-full px-2 py-0.5 text-xs font-medium">
                Paused
              </span>
            ) : (
              <StatusBadge status={monitor.status} />
            )}
            {monitor.isRunning && (
              <Badge
                variant="outline"
                className="gap-1.5 border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400"
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                Running
              </Badge>
            )}
            {uptimePercent !== null ? (
              <Badge
                variant="outline"
                className={
                  uptimePercent >= 99.9
                    ? 'border-green-500/50 text-green-600'
                    : uptimePercent >= 99
                      ? 'border-amber-500/50 text-amber-600'
                      : 'border-red-500/50 text-red-600'
                }
              >
                {uptimePercent.toFixed(2)}% uptime
              </Badge>
            ) : (
              <Badge variant="outline">Waiting for data</Badge>
            )}
            <PauseResumeButton
              monitorId={monitor.id}
              isPaused={monitor.isPaused}
            />
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Pings every {monitor.expectedInterval}s with {monitor.gracePeriod}s
            grace period
            {monitor.lastPingAt && (
              <>
                {' '}
                &middot; Last ping <RelativeTime date={monitor.lastPingAt} />
              </>
            )}
          </p>
        </div>
      </div>

      {/* Paused banner */}
      {monitor.isPaused && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="text-muted-foreground">
            This monitor is paused. Pings are accepted but not checked for
            missed deadlines.
          </span>
        </div>
      )}

      {/* Waiting for first ping */}
      {monitor.status === 'new' && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-lg">Waiting for first ping...</CardTitle>
            <CardDescription>
              Add one of these snippets to your cron job or script. This page
              will automatically update when the first ping arrives.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(codeSnippets).map(([lang, code]) => (
              <div key={lang} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-medium uppercase">
                    {lang}
                  </span>
                  <CopyButton text={code} />
                </div>
                <pre className="bg-muted overflow-x-auto rounded-lg p-3 text-sm">
                  <code>{code}</code>
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Ping URL (shown when monitor is active) */}
      {monitor.status !== 'new' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Ping URL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <pre className="bg-muted flex-1 overflow-x-auto rounded-lg p-3 text-sm">
                <code>{pingUrl}</code>
              </pre>
              <CopyButton text={pingUrl} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ping timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Ping Timeline</CardTitle>
          <CardDescription>Visual history of pings over time</CardDescription>
        </CardHeader>
        <CardContent>
          {timelinePings.length === 0 && monitor.status === 'new' ? (
            <div className="text-muted-foreground flex h-32 items-center justify-center">
              No pings received yet
            </div>
          ) : (
            <PingTimeline
              pings={timelinePings}
              incidents={recentIncidents}
              monitorAgeMs={new Date().getTime() - monitor.createdAt.getTime()}
            />
          )}
        </CardContent>
      </Card>

      {/* Response time chart */}
      <Card>
        <CardHeader>
          <CardTitle>Response Time</CardTitle>
          <CardDescription>
            Duration reported by your pings (if provided)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponseTimeChart pings={timelinePings.slice(0, 50)} />
        </CardContent>
      </Card>

      {/* Recent pings table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle>Recent Pings</CardTitle>
              <CardDescription>
                Last {limits.pingHistoryDays} days of ping history
              </CardDescription>
            </div>
            {hasHiddenPings && (
              <UpgradeButton currentPlan={plan}>
                Upgrade for more history
              </UpgradeButton>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <PingsTable initialPings={initialTablePings} monitorId={monitor.id} />
        </CardContent>
      </Card>

      {/* Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Incidents</CardTitle>
          <CardDescription>History of downtime incidents</CardDescription>
        </CardHeader>
        <CardContent>
          <IncidentsTable
            initialIncidents={monitorIncidents}
            monitorId={monitor.id}
          />
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Edit monitor settings and alert preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MonitorConfigEditor monitor={monitor} />
        </CardContent>
      </Card>

      {/* Alert channels */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Channels</CardTitle>
          <CardDescription>
            Choose which channels receive alerts for this monitor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MonitorChannelLinker
            monitorId={monitor.id}
            allChannels={userChannels}
            linkedChannelIds={linkedChannelIds}
          />
        </CardContent>
      </Card>
    </div>
  );
}
