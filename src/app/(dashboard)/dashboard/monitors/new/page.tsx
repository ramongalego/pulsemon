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
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  INTERVAL_PRESETS,
  defaultGracePeriod,
} from '@/lib/monitoring/constants';
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
  const [gracePeriod, setGracePeriod] = useState('');
  const [graceManuallySet, setGraceManuallySet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [planLimitMessage, setPlanLimitMessage] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxDuration, setMaxDuration] = useState('');

  const slug = slugify(name);
  const isCustom = interval === 'custom';
  const effectiveInterval = isCustom
    ? Number(customInterval)
    : Number(interval);

  function handleIntervalChange(value: string) {
    setInterval(value);
    if (!graceManuallySet && value !== 'custom') {
      setGracePeriod(String(defaultGracePeriod(Number(value))));
    }
  }

  function handleCustomIntervalChange(value: string) {
    setCustomInterval(value);
    if (!graceManuallySet && Number(value) >= 10) {
      setGracePeriod(String(defaultGracePeriod(Number(value))));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        name,
        slug,
        expectedInterval: effectiveInterval,
        gracePeriod: Number(gracePeriod),
      };

      if (maxDuration && Number(maxDuration) > 0) {
        payload.maxDuration = Number(maxDuration) * 1000; // seconds to ms
      }

      const res = await fetch('/api/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
              <Select value={interval} onValueChange={handleIntervalChange}>
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
                  onChange={(e) => handleCustomIntervalChange(e.target.value)}
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
                placeholder="Select an interval first"
                onChange={(e) => {
                  setGracePeriod(e.target.value);
                  setGraceManuallySet(true);
                }}
              />
              <p className="text-muted-foreground text-xs">
                Buffer before alerting on a missed ping. Auto-filled based on
                your interval.
              </p>
            </div>

            <div>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm font-medium transition-colors"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Advanced settings
              </button>
              {showAdvanced && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="maxDuration">Max duration (seconds)</Label>
                  <Input
                    id="maxDuration"
                    type="number"
                    min="1"
                    value={maxDuration}
                    placeholder="e.g. 300 for 5 minutes"
                    onChange={(e) => setMaxDuration(e.target.value)}
                  />
                  <p className="text-muted-foreground text-xs">
                    Alert if a run takes longer than this. Leave empty to
                    disable.
                  </p>
                </div>
              )}
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
