import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { statusPages, statusPageMonitors } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getUserPlan, getPlanLimits } from '@/lib/plan-limits';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Plus, ExternalLink } from 'lucide-react';
import { UpgradeButton } from '@/components/dashboard/upgrade-button';
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
            {pages.length} /{' '}
            {limits.statusPages === Infinity ? '∞' : limits.statusPages} pages
            used
          </p>
        </div>
        <div className="flex items-center gap-2">
          {atLimit && (
            <UpgradeButton currentPlan={plan}>Upgrade for more</UpgradeButton>
          )}
          <Link href="/dashboard/status-pages/new">
            <Button disabled={atLimit}>
              <Plus className="mr-2 h-4 w-4" />
              New Status Page
            </Button>
          </Link>
        </div>
      </div>

      {pages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="text-muted-foreground mb-4 h-12 w-12" />
            <CardTitle className="mb-2 text-lg">No status pages yet</CardTitle>
            <CardDescription className="mb-6 text-center">
              Create a public status page to share your uptime with your users.
            </CardDescription>
            <Link href="/dashboard/status-pages/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Status Page
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pages.map((page) => {
            const publicUrl = `${appUrl}/status/${page.slug}`;
            return (
              <Card key={page.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
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
                    </CardTitle>
                    <CardDescription>
                      {page.monitorCount} monitor
                      {page.monitorCount !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <Link href={`/dashboard/status-pages/${page.id}`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted flex-1 truncate rounded px-2 py-1 text-xs">
                      {publicUrl}
                    </code>
                    <CopyButton text={publicUrl} />
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
