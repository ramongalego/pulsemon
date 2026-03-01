import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { alertChannels } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { AlertChannelManager } from '@/components/dashboard/alert-channel-manager';
import { getUserPlan, getPlanLimits } from '@/lib/plan-limits';

export default async function AlertsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const channels = await db
    .select()
    .from(alertChannels)
    .where(eq(alertChannels.userId, session.user.id))
    .orderBy(alertChannels.createdAt);

  const plan = await getUserPlan(session.user.id);
  const limits = getPlanLimits(plan);

  return (
    <div className="space-y-6">
      <AlertChannelManager
        initialChannels={channels}
        channelLimit={limits.alertChannels}
      />
    </div>
  );
}
