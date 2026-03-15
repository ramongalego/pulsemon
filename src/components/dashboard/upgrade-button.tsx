'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UpgradeModal } from '@/components/dashboard/upgrade-modal';

import type { Plan } from '@/types';

export function UpgradeButton({
  currentPlan,
  variant = 'outline',
  size = 'sm',
  className,
  children,
}: {
  currentPlan: Plan;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'xs';
  className?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        {children ?? 'Upgrade'}
      </Button>
      <UpgradeModal
        open={open}
        onOpenChange={setOpen}
        currentPlan={currentPlan}
      />
    </>
  );
}
