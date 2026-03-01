import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { statusPages, statusPageMonitors } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getUserPlan, getPlanLimits } from '@/lib/plan-limits';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlanLimitButton } from '@/components/dashboard/plan-limit-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Plus, ExternalLink } from 'lucide-react';
import { CopyButton } from '@/components/dashboard/copy-button';

export default async function StatusPagesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const pages = await db
    .select({
      id: statusPages.id,
      title: statusPages.title,
      slug: statusPages.slug,
      description: statusPages.description,
      isPublic: statusPages.isPublic,
      createdAt: statusPages.createdAt,
      monitorCount: sql<number>`cast(count(${statusPageMonitors.monitorId}) as int)`,
    })
    .from(statusPages)
    .leftJoin(
      statusPageMonitors,
      eq(statusPages.id, statusPageMonitors.statusPageId),
    )
    .where(eq(statusPages.userId, session.user.id))
    .groupBy(statusPages.id)
    .orderBy(statusPages.createdAt);

  const plan = await getUserPlan(session.user.id);
  const limits = getPlanLimits(plan);
  const atLimit = pages.length >= limits.statusPages;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Status Pages</h1>
          <p className="text-muted-foreground">
            Create and manage public status pages
          </p>
        </div>
        <PlanLimitButton
          href="/dashboard/status-pages/new"
          atLimit={atLimit}
          currentPlan={plan}
          limitMessage="You've reached your status page limit. Upgrade your plan to create more."
        >
          <Plus className="mr-[-4] h-4 w-4" />
          New Status Page
        </PlanLimitButton>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle>Your Status Pages</CardTitle>
              <CardDescription>
                Share your uptime with your users
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-medium ${atLimit ? 'text-red-500' : 'text-muted-foreground'}`}
              >
                {pages.length}/
                {limits.statusPages === Infinity ? '∞' : limits.statusPages}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Globe className="text-muted-foreground mb-3 h-8 w-8" />
              <p className="text-muted-foreground text-sm">
                No status pages yet. Create one to share your uptime with your
                users.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pages.map((page) => {
                const publicUrl = `${appUrl}/status/${page.slug}`;
                return (
                  <div
                    key={page.id}
                    className="border-border flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-medium">
                        {page.title}
                        {page.isPublic ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-500/10 text-green-600"
                          >
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Private</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted truncate rounded px-2 py-1 text-xs">
                          {publicUrl}
                        </code>
                        <CopyButton text={publicUrl} />
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      </div>
                    </div>
                    <Link href={`/dashboard/status-pages/${page.id}`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
