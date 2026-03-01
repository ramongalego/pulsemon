import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { alertChannels } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { AlertChannelManager } from '@/components/dashboard/alert-channel-manager';

export default async function AlertsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const channels = await db
    .select()
    .from(alertChannels)
    .where(eq(alertChannels.userId, session.user.id))
    .orderBy(alertChannels.createdAt);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Alert Channels</h1>
        <p className="text-muted-foreground">
          Configure where you receive alerts when monitors go down
        </p>
      </div>

      <AlertChannelManager initialChannels={channels} />
    </div>
  );
}
