import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ApiKeyManager } from '@/components/dashboard/api-key-manager';
import { UpgradeButton } from '@/components/dashboard/upgrade-button';
import { ManageSubscriptionButton } from '@/components/dashboard/manage-subscription-button';
import { getUserPlan, getPlanLimits } from '@/lib/plan-limits';
import { getUserUsage } from '@/lib/plan-enforcement';
import { users } from '@/lib/db/schema';
import { stripe } from '@/lib/stripe';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const plan = await getUserPlan(userId);
  const limits = getPlanLimits(plan);
  const usage = await getUserUsage(userId);
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

  const [userRecord] = await db
    .select({ stripeSubscriptionId: users.stripeSubscriptionId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const hasSubscription = !!userRecord?.stripeSubscriptionId;

  let cancelAtDate: string | null = null;
  if (userRecord?.stripeSubscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(
        userRecord.stripeSubscriptionId,
      );
      if (sub.cancel_at_period_end) {
        // cancel_at holds the period end date when cancel_at_period_end is true
        const endTimestamp =
          sub.cancel_at ??
          (sub as unknown as { current_period_end: number }).current_period_end;
        if (endTimestamp) {
          cancelAtDate = new Date(endTimestamp * 1000).toLocaleDateString(
            'en-US',
            {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            },
          );
        }
      }
    } catch {
      // Subscription may no longer exist in Stripe — ignore
    }
  }

  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(apiKeys.createdAt);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and billing</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={session.user.email ?? ''} disabled />
          </div>
        </CardContent>
      </Card>

      {/* Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle>Plan</CardTitle>
              <CardDescription>Your current subscription</CardDescription>
            </div>
            <Badge
              variant="secondary"
              className={`text-sm ${plan === 'lifetime' ? 'border-amber-500/30 bg-amber-500/10 text-amber-600' : ''}`}
            >
              {planLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-2 text-sm">
            <UsageRow
              label="Monitors"
              current={usage.monitors}
              limit={limits.monitors}
            />
            <UsageRow
              label="Alert channels"
              current={usage.alertChannels}
              limit={limits.alertChannels}
            />
            <UsageRow
              label="Status pages"
              current={usage.statusPages}
              limit={limits.statusPages}
            />
            <div className="text-muted-foreground flex justify-between">
              <span>Ping history</span>
              <span>{limits.pingHistoryDays} days</span>
            </div>
            <div className="text-muted-foreground flex justify-between">
              <span>Check interval</span>
              <span>{limits.checkInterval}s minimum</span>
            </div>
          </div>
          <div className="flex gap-2">
            {plan !== 'pro' && plan !== 'lifetime' && (
              <UpgradeButton
                currentPlan={plan}
                variant="outline"
                size="default"
              >
                Upgrade Plan
              </UpgradeButton>
            )}
            {hasSubscription && <ManageSubscriptionButton />}
          </div>
          {cancelAtDate && (
            <p className="text-muted-foreground mt-2 text-sm">
              Your subscription has been canceled. You&apos;ll continue to have
              access to your current plan until {cancelAtDate}.
            </p>
          )}
        </CardContent>
      </Card>

      {/* API Keys */}
      <ApiKeyManager initialKeys={keys} />

      {/* Danger Zone */}
      <Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function UsageRow({
  label,
  current,
  limit,
}: {
  label: string;
  current: number;
  limit: number;
}) {
  const isOver = current > limit;
  const displayLimit = limit === Infinity ? '∞' : String(limit);

  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          isOver ? 'font-medium text-amber-600' : 'text-muted-foreground'
        }
      >
        {current} / {displayLimit}
        {isOver && ' (over limit)'}
      </span>
    </div>
  );
}
