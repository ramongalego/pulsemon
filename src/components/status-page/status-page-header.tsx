import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  operational: {
    label: 'All Systems Operational',
    icon: CheckCircle2,
    className: 'border-green-500/20 bg-green-500/5 text-green-600',
    iconClassName: 'text-green-500',
  },
  partial: {
    label: 'Partial Outage',
    icon: AlertTriangle,
    className: 'border-amber-500/20 bg-amber-500/5 text-amber-600',
    iconClassName: 'text-amber-500',
  },
  major: {
    label: 'Major Outage',
    icon: XCircle,
    className: 'border-red-500/20 bg-red-500/5 text-red-600',
    iconClassName: 'text-red-500',
  },
};

function formatWindow(ms: number): string {
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours < 1) return 'the last hour';
  if (hours < 24) return `the last ${hours} hour${hours === 1 ? '' : 's'}`;
  const days = Math.floor(hours / 24);
  if (days >= 30) return 'the last 30 days';
  return `the last ${days} day${days === 1 ? '' : 's'}`;
}

export function StatusPageHeader({
  title,
  description,
  overallStatus,
  overallUptime,
  uptimeWindowMs,
}: {
  title: string;
  description: string | null;
  overallStatus: 'operational' | 'partial' | 'major';
  overallUptime: number | null;
  uptimeWindowMs: number | null;
}) {
  const config = STATUS_CONFIG[overallStatus];
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      <div
        className={`flex items-center gap-2 rounded-lg border px-4 py-3 ${config.className}`}
      >
        <Icon className={`h-5 w-5 ${config.iconClassName}`} />
        <span className="font-medium">{config.label}</span>
      </div>

      {overallUptime !== null && uptimeWindowMs !== null && (
        <p className="text-muted-foreground text-sm">
          <span className="font-medium">{overallUptime.toFixed(2)}%</span>{' '}
          uptime over {formatWindow(uptimeWindowMs)}
        </p>
      )}
    </div>
  );
}
