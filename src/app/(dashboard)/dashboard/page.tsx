import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { monitors } from '@/lib/db/schema';
import { AutoRefresh } from '@/components/dashboard/auto-refresh';
import { MonitorFilters } from '@/components/dashboard/monitor-filters';
import { PauseResumeButton } from '@/components/dashboard/pause-resume-button';
import { eq, and, ilike, or, asc, desc } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { RelativeTime } from '@/components/shared/relative-time';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  Plus,
} from 'lucide-react';
import { getUserPlan, getPlanLimits } from '@/lib/plan-limits';
import { PlanLimitButton } from '@/components/dashboard/plan-limit-button';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;
  const params = await searchParams;

  // Build dynamic where conditions
  const conditions: SQL[] = [eq(monitors.userId, userId)];

  if (params.q) {
    const search = `%${params.q}%`;
    conditions.push(
      or(ilike(monitors.name, search), ilike(monitors.slug, search))!,
    );
  }

  if (params.status === 'up') {
    conditions.push(eq(monitors.status, 'up'));
  } else if (params.status === 'down') {
    conditions.push(eq(monitors.status, 'down'));
  } else if (params.status === 'paused') {
    conditions.push(eq(monitors.isPaused, true));
  }

  // Build order by
  let orderBy;
  switch (params.sort) {
    case 'name':
      orderBy = asc(monitors.name);
      break;
    case 'status':
      orderBy = asc(monitors.status);
      break;
    case 'lastPing':
      orderBy = desc(monitors.lastPingAt);
      break;
    default:
      orderBy = desc(monitors.createdAt);
  }

  const userMonitors = await db
    .select()
    .from(monitors)
    .where(and(...conditions))
    .orderBy(orderBy);

  // Stats always computed from all monitors (unfiltered)
  const allMonitors =
    params.q || params.status
      ? await db.select().from(monitors).where(eq(monitors.userId, userId))
      : userMonitors;

  const stats = {
    total: allMonitors.length,
    up: allMonitors.filter((m) => m.status === 'up').length,
    down: allMonitors.filter((m) => m.status === 'down').length,
    paused: allMonitors.filter((m) => m.isPaused).length,
  };

  const plan = await getUserPlan(userId);
  const limits = getPlanLimits(plan);
  const atMonitorLimit =
    limits.monitors !== Infinity && stats.total >= limits.monitors;

  const hasMonitors = stats.total > 0;

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitors</h1>
          <p className="text-muted-foreground">
            Track your cron jobs and background tasks
          </p>
        </div>
        <PlanLimitButton
          href="/dashboard/monitors/new"
          atLimit={atMonitorLimit}
          currentPlan={plan}
          limitMessage="You've reached your monitor limit. Upgrade your plan to add more."
        >
          <Plus className="mr-[-4] h-4 w-4" />
          New Monitor
        </PlanLimitButton>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Monitors
            </CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Up</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.up}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Down</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.down}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paused</CardTitle>
            <PauseCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-2xl font-bold">
              {stats.paused}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty state or monitor list */}
      {!hasMonitors ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="bg-primary/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Activity className="text-primary h-8 w-8" />
            </div>
            <CardTitle className="mb-2 text-xl">
              Create your first monitor
            </CardTitle>
            <CardDescription className="mb-6 max-w-sm text-center">
              Add a monitor for your cron job or background task. We&apos;ll
              alert you the second it stops running.
            </CardDescription>
            <PlanLimitButton
              href="/dashboard/monitors/new"
              atLimit={atMonitorLimit}
              currentPlan={plan}
              limitMessage="You've reached your monitor limit. Upgrade your plan to add more."
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Monitor
            </PlanLimitButton>
          </CardContent>
        </Card>
      ) : (
        <>
          <MonitorFilters />
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <CardTitle>Your Monitors</CardTitle>
                  <CardDescription>
                    {userMonitors.length === stats.total
                      ? 'Select a monitor to view details and ping history'
                      : `Showing ${userMonitors.length} of ${stats.total} monitors`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-medium ${atMonitorLimit ? 'text-red-500' : 'text-muted-foreground'}`}
                  >
                    {stats.total}/
                    {limits.monitors === Infinity ? '∞' : limits.monitors}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {userMonitors.length === 0 ? (
                <div className="text-muted-foreground flex h-20 items-center justify-center text-sm">
                  No monitors match your filters
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Header row */}
                  <div className="text-muted-foreground grid grid-cols-5 gap-4 px-3 text-xs font-medium">
                    <span>Name</span>
                    <span>Status</span>
                    <span>Last Ping</span>
                    <span>Interval</span>
                    <span className="text-right">Actions</span>
                  </div>
                  {/* Monitor rows */}
                  {userMonitors.map((monitor) => (
                    <Link
                      key={monitor.id}
                      href={`/dashboard/monitors/${monitor.id}`}
                      className="block"
                    >
                      <div className="hover:bg-muted/50 grid grid-cols-5 items-center gap-4 rounded-lg border px-3 py-3 text-sm transition-colors">
                        <div>
                          <span className="font-medium">{monitor.name}</span>
                          <p className="text-muted-foreground text-xs">
                            /{monitor.slug}
                          </p>
                        </div>
                        <div>
                          <StatusBadge status={monitor.status} />
                        </div>
                        <div className="text-muted-foreground">
                          {monitor.lastPingAt ? (
                            <RelativeTime date={monitor.lastPingAt} />
                          ) : (
                            <span className="text-xs">Never</span>
                          )}
                        </div>
                        <div className="text-muted-foreground">
                          {monitor.expectedInterval}s
                        </div>
                        <div className="flex justify-end">
                          <PauseResumeButton
                            monitorId={monitor.id}
                            isPaused={monitor.isPaused}
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
