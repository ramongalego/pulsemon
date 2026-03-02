'use client';

import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { UpgradeButton } from '@/components/dashboard/upgrade-button';
import type { Plan, PlanLimits } from '@/types';
import type { ResourceUsage } from '@/lib/plan-enforcement';

interface OverLimitBannerProps {
  plan: Plan;
  usage: ResourceUsage;
  limits: PlanLimits;
}

export function OverLimitBanner({ plan, usage, limits }: OverLimitBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const overages: string[] = [];

  if (usage.monitors > limits.monitors) {
    overages.push(`${usage.monitors} monitors (limit: ${limits.monitors})`);
  }
  if (usage.alertChannels > limits.alertChannels) {
    overages.push(
      `${usage.alertChannels} alert channels (limit: ${limits.alertChannels})`,
    );
  }
  if (usage.statusPages > limits.statusPages) {
    overages.push(
      `${usage.statusPages} status pages (limit: ${limits.statusPages})`,
    );
  }

  if (overages.length === 0) return null;

  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <div className="relative rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-500/20 dark:bg-blue-950/30">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-8">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <div className="space-y-2">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            You currently have {overages.join(' and ')} on your {planLabel}{' '}
            plan. Your existing resources are still running. Upgrade to create
            new ones.
          </p>
          <UpgradeButton currentPlan={plan} variant="outline" size="sm">
            Upgrade Plan
          </UpgradeButton>
        </div>
      </div>
    </div>
  );
}
