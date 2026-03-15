'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Activity,
  Bell,
  BookOpen,
  Globe,
  LayoutDashboard,
  MessageCircle,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FeedbackDialog } from '@/components/dashboard/feedback-dialog';
import { UpgradeButton } from '@/components/dashboard/upgrade-button';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { useState } from 'react';
import type { Plan } from '@/types';

const navItems: {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Alerts',
    href: '/dashboard/alerts',
    icon: Bell,
  },
  {
    label: 'Status Pages',
    href: '/dashboard/status-pages',
    icon: Globe,
  },
  {
    label: 'Docs',
    href: '/dashboard/docs',
    icon: BookOpen,
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function Sidebar({
  showUpgrade,
  currentPlan,
}: {
  showUpgrade: boolean;
  currentPlan: Plan;
}) {
  const pathname = usePathname();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <aside className="bg-card flex h-full w-64 flex-col border-r">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Activity className="text-primary h-6 w-6" />
          <span className="text-lg font-semibold">PulseMon</span>
        </Link>
        <ThemeToggle />
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => setFeedbackOpen(true)}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          <MessageCircle className="h-4 w-4" />
          Feedback
        </button>
        {showUpgrade && (
          <UpgradeButton
            currentPlan={currentPlan}
            variant="ghost"
            size="default"
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full justify-start gap-3 rounded-lg px-3 py-2 text-sm font-medium"
          >
            <Sparkles className="h-4 w-4" />
            Upgrade
          </UpgradeButton>
        )}
      </nav>
      <Separator />
      <div className="p-3">
        <Button
          variant="ghost"
          className="text-muted-foreground w-full justify-start gap-3"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </aside>
  );
}
