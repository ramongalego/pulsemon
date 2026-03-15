import { auth } from '@/lib/auth';
import { MobileNav } from './mobile-nav';
import { UpgradeButton } from '@/components/dashboard/upgrade-button';
import { getUserPlan } from '@/lib/plan-limits';

export async function DashboardHeader() {
  const session = await auth();
  const user = session?.user;

  const plan = user?.id ? await getUserPlan(user.id) : 'free';

  return (
    <header className="bg-card flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-2">
        <MobileNav />
      </div>
      <div className="flex items-center gap-3">
        {plan !== 'pro' && plan !== 'lifetime' && (
          <UpgradeButton currentPlan={plan} variant="default" size="sm">
            Upgrade
          </UpgradeButton>
        )}
      </div>
    </header>
  );
}
