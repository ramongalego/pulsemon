'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UpgradeModal } from '@/components/dashboard/upgrade-modal';
import type { Plan } from '@/types';

export function PlanLimitButton({
  href,
  atLimit,
  currentPlan,
  limitMessage,
  children,
}: {
  href: string;
  atLimit: boolean;
  currentPlan: Plan;
  limitMessage: string;
  children: React.ReactNode;
}) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (!atLimit) {
    return (
      <Link href={href}>
        <Button>{children}</Button>
      </Link>
    );
  }

  return (
    <>
      <Button onClick={() => setUpgradeOpen(true)}>{children}</Button>
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        currentPlan={currentPlan}
        message={limitMessage}
      />
    </>
  );
}
