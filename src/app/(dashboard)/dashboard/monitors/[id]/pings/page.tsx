import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { monitors, pings } from '@/lib/db/schema';
import { eq, and, desc, gte, count } from 'drizzle-orm';
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
import { getUserPlan, getPlanLimits } from '@/lib/plan-limits';
import { FullPingsTable } from '@/components/dashboard/full-pings-table';

const PAGE_SIZE = 25;

export default async function PingHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const userId = session.user.id;

  const [monitor] = await db
    .select({ id: monitors.id, name: monitors.name })
    .from(monitors)
    .where(and(eq(monitors.id, id), eq(monitors.userId, userId)))
    .limit(1);

  if (!monitor) notFound();

  const plan = await getUserPlan(userId);
  const limits = getPlanLimits(plan);
  const retentionCutoff = new Date(
    new Date().getTime() - limits.pingHistoryDays * 24 * 60 * 60 * 1000,
  );

  const page = Math.max(1, parseInt(pageParam || '1', 10));
  const offset = (page - 1) * PAGE_SIZE;

  const [totalResult] = await db
    .select({ count: count() })
    .from(pings)
    .where(
      and(eq(pings.monitorId, id), gte(pings.receivedAt, retentionCutoff)),
    );

  const totalCount = totalResult?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const rows = await db
    .select()
    .from(pings)
    .where(and(eq(pings.monitorId, id), gte(pings.receivedAt, retentionCutoff)))
    .orderBy(desc(pings.receivedAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/monitors/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ping History</h1>
          <p className="text-muted-foreground text-sm">{monitor.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Pings</CardTitle>
          <CardDescription>
            {totalCount} ping{totalCount === 1 ? '' : 's'} in the last{' '}
            {limits.pingHistoryDays} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FullPingsTable pings={rows} />
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-muted-foreground text-sm">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/dashboard/monitors/${id}/pings?page=${page - 1}`}
                    >
                      Previous
                    </Link>
                  </Button>
                )}
                {page < totalPages && (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/dashboard/monitors/${id}/pings?page=${page + 1}`}
                    >
                      Next
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
