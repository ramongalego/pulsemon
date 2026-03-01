import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MonitorStatus } from '@/types';

const statusConfig: Record<
  MonitorStatus,
  { label: string; className: string; pulse: boolean }
> = {
  up: {
    label: 'Up',
    className:
      'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    pulse: true,
  },
  down: {
    label: 'Down',
    className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    pulse: false,
  },
  paused: {
    label: 'Paused',
    className:
      'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    pulse: false,
  },
  new: {
    label: 'Waiting',
    className:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    pulse: false,
  },
};

export function StatusBadge({ status }: { status: MonitorStatus }) {
  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={cn('gap-1.5', config.className)}>
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          status === 'up' && 'bg-green-500',
          status === 'down' && 'bg-red-500',
          status === 'paused' && 'bg-slate-500',
          status === 'new' && 'bg-amber-500',
          config.pulse && 'animate-pulse',
        )}
      />
      {config.label}
    </Badge>
  );
}
