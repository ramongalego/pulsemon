import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { getUserPlan } from '@/lib/plan-limits';
import { Sidebar } from '@/components/dashboard/sidebar';
import { MobileHeader } from '@/components/dashboard/mobile-header';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const plan = session?.user?.id ? await getUserPlan(session.user.id) : 'free';
  const showUpgrade = plan !== 'pro' && plan !== 'lifetime';

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:block">
        <Sidebar showUpgrade={showUpgrade} currentPlan={plan} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
