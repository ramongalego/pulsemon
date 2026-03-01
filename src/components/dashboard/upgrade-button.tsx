'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UpgradeModal } from '@/components/dashboard/upgrade-modal';
import { Sparkles } from 'lucide-react';
import type { Plan } from '@/types';

export function UpgradeButton({
  currentPlan,
  variant = 'outline',
  size = 'sm',
  children,
}: {
  currentPlan: Plan;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'xs';
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className="gap-1"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-3.5 w-3.5" />
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
