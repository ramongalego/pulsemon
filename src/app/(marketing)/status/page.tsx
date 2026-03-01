import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';

export const metadata: Metadata = {
  title: 'Status - PulseMon',
  description: 'Current operational status of PulseMon services.',
};

// Re-check every 60 seconds
export const revalidate = 60;

type ServiceStatus = 'operational' | 'degraded' | 'down';

async function checkDatabase(): Promise<ServiceStatus> {
  try {
    await db.execute('SELECT 1');
    return 'operational';
  } catch {
    return 'down';
  }
}

async function checkRedis(): Promise<ServiceStatus> {
  try {
    await redis.ping();
    return 'operational';
  } catch {
    return 'down';
  }
}

const statusConfig: Record<
  ServiceStatus,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  operational: {
    label: 'Operational',
    color: 'text-green-600',
    icon: CheckCircle2,
  },
  degraded: {
    label: 'Degraded',
    color: 'text-amber-600',
    icon: AlertTriangle,
  },
  down: {
    label: 'Down',
    color: 'text-red-600',
    icon: XCircle,
  },
};

export default async function StatusPage() {
  const [dbStatus, redisStatus] = await Promise.all([
    checkDatabase(),
    checkRedis(),
  ]);

  const services = [
    { name: 'Database (Neon PostgreSQL)', status: dbStatus },
    { name: 'Cache (Upstash Redis)', status: redisStatus },
    {
      name: 'Ping Endpoint',
      status:
        dbStatus === 'operational' && redisStatus === 'operational'
          ? ('operational' as const)
          : ('degraded' as const),
    },
    {
      name: 'Alert Delivery',
      status:
        dbStatus === 'operational'
          ? ('operational' as const)
          : ('degraded' as const),
    },
  ];

  const allOperational = services.every((s) => s.status === 'operational');
  const anyDown = services.some((s) => s.status === 'down');

  const overallStatus: ServiceStatus = anyDown
    ? 'down'
    : allOperational
      ? 'operational'
      : 'degraded';

  const OverallIcon = statusConfig[overallStatus].icon;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      {/* Overall Status */}
      <div className="mb-12 text-center">
        <OverallIcon
          className={`mx-auto mb-4 h-16 w-16 ${statusConfig[overallStatus].color}`}
        />
        <h1 className="text-3xl font-bold tracking-tight">
          {allOperational
            ? 'All Systems Operational'
            : anyDown
              ? 'Service Disruption'
              : 'Partial Degradation'}
        </h1>
        <p className="text-muted-foreground mt-2">
          Last checked:{' '}
          {new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC
        </p>
      </div>

      {/* Individual Services */}
      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {services.map((service) => {
            const config = statusConfig[service.status];
            const Icon = config.icon;
            return (
              <div
                key={service.name}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <span className="text-sm font-medium">{service.name}</span>
                <Badge variant="outline" className={`gap-1.5 ${config.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                  {config.label}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
