import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { statusPages, statusPageMonitors, monitors } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserPlan, getPlanLimits } from '@/lib/plan-limits';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { StatusPageSettings } from '@/components/dashboard/status-page-settings';
import { StatusPageMonitorLinker } from '@/components/dashboard/status-page-monitor-linker';

export default async function EditStatusPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const { id } = await params;
  const userId = session.user.id;

  const [page] = await db
    .select()
    .from(statusPages)
    .where(and(eq(statusPages.id, id), eq(statusPages.userId, userId)))
    .limit(1);

  if (!page) notFound();

  // Fetch user's monitors
  const userMonitors = await db
    .select()
    .from(monitors)
    .where(eq(monitors.userId, userId))
    .orderBy(monitors.name);

  // Fetch linked monitors
  const linkedMonitors = await db
    .select({
      monitorId: statusPageMonitors.monitorId,
      displayName: statusPageMonitors.displayName,
      sortOrder: statusPageMonitors.sortOrder,
    })
    .from(statusPageMonitors)
    .where(eq(statusPageMonitors.statusPageId, id))
    .orderBy(statusPageMonitors.sortOrder);

  const plan = await getUserPlan(userId);
  const limits = getPlanLimits(plan);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/status-pages">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{page.title}</h1>
          <p className="text-muted-foreground">Edit status page settings</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Configure your status page appearance and visibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatusPageSettings statusPage={page} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monitors</CardTitle>
          <CardDescription>
            Choose which monitors appear on this status page (
            {linkedMonitors.length} /{' '}
            {limits.monitorsPerStatusPage === Infinity
              ? '∞'
              : limits.monitorsPerStatusPage}
            )
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatusPageMonitorLinker
            statusPageId={page.id}
            allMonitors={userMonitors}
            linkedMonitors={linkedMonitors}
            monitorLimit={limits.monitorsPerStatusPage}
            currentPlan={plan}
          />
        </CardContent>
      </Card>
    </div>
  );
}
