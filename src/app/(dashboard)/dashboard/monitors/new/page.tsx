'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { INTERVAL_PRESETS } from '@/lib/monitoring/constants';
import { PlanLimitDialog } from '@/components/dashboard/plan-limit-dialog';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function NewMonitorPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [interval, setInterval] = useState('');
  const [customInterval, setCustomInterval] = useState('');
  const [gracePeriod, setGracePeriod] = useState('300');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [planLimitMessage, setPlanLimitMessage] = useState<string | null>(null);

  const slug = slugify(name);
  const isCustom = interval === 'custom';
  const effectiveInterval = isCustom
    ? Number(customInterval)
    : Number(interval);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          expectedInterval: effectiveInterval,
          gracePeriod: Number(gracePeriod),
        }),
      });

      const json = await res.json();
      if (json.error) {
        if (json.error.code === 'PLAN_LIMIT') {
          setPlanLimitMessage(json.error.message);
        } else {
          toast.error(json.error.message);
        }
        return;
      }

      toast.success('Monitor created');
      router.push(`/dashboard/monitors/${json.data.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Create a Monitor
          </h1>
          <p className="text-muted-foreground">
            Set up monitoring for a cron job or background task
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monitor Details</CardTitle>
          <CardDescription>
            Give your monitor a name and tell us how often it should ping
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g. Daily DB Backup"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {slug && (
                <p className="text-muted-foreground text-xs">
                  Ping URL:{' '}
                  <code className="bg-muted rounded px-1 py-0.5">
                    /api/ping/{slug}
                  </code>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="interval">Expected Interval</Label>
              <Select value={interval} onValueChange={setInterval}>
                <SelectTrigger>
                  <SelectValue placeholder="How often should this job run?" />
                </SelectTrigger>
                <SelectContent>
                  {INTERVAL_PRESETS.map((preset) => (
                    <SelectItem
                      key={preset.seconds}
                      value={String(preset.seconds)}
                    >
                      {preset.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom interval</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isCustom && (
              <div className="space-y-2">
                <Label htmlFor="customInterval">
                  Custom Interval (seconds)
                </Label>
                <Input
                  id="customInterval"
                  type="number"
                  min="10"
                  placeholder="e.g. 120"
                  value={customInterval}
                  onChange={(e) => setCustomInterval(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="gracePeriod">Grace Period (seconds)</Label>
              <Input
                id="gracePeriod"
                type="number"
                min="0"
                value={gracePeriod}
                onChange={(e) => setGracePeriod(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Extra time to wait before alerting. Default is 5 minutes (300s).
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                isSubmitting ||
                !name ||
                !effectiveInterval ||
                effectiveInterval < 10
              }
            >
              {isSubmitting ? 'Creating...' : 'Create Monitor'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <PlanLimitDialog
        open={planLimitMessage !== null}
        onOpenChange={(open) => {
          if (!open) setPlanLimitMessage(null);
        }}
        message={planLimitMessage ?? ''}
      />
    </div>
  );
}
