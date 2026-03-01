'use client';

import { UpgradeModal } from '@/components/dashboard/upgrade-modal';
import type { Plan } from '@/types';

export function PlanLimitDialog({
  open,
  onOpenChange,
  message,
  currentPlan = 'free',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  currentPlan?: Plan;
}) {
  return (
    <UpgradeModal
      open={open}
      onOpenChange={onOpenChange}
      currentPlan={currentPlan}
      message={message}
    />
  );
}
