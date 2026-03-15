'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import type { Monitor } from '@/lib/db/schema';
import { PlanLimitDialog } from '@/components/dashboard/plan-limit-dialog';
import { defaultGracePeriod } from '@/lib/monitoring/constants';

const INTERVAL_PRESETS = [
  { label: 'Every minute', seconds: 60 },
  { label: 'Every 5 minutes', seconds: 300 },
  { label: 'Every 15 minutes', seconds: 900 },
  { label: 'Every hour', seconds: 3600 },
  { label: 'Every day', seconds: 86400 },
];

export function MonitorConfigEditor({ monitor }: { monitor: Monitor }) {
  const router = useRouter();
  const [name, setName] = useState(monitor.name);
  const [interval, setInterval] = useState(String(monitor.expectedInterval));
  const [gracePeriod, setGracePeriod] = useState(String(monitor.gracePeriod));
  const [tags, setTags] = useState(monitor.tags.join(', '));
  const [maxDuration, setMaxDuration] = useState(
    monitor.maxDuration ? String(monitor.maxDuration / 1000) : '',
  );
  const [showAdvanced, setShowAdvanced] = useState(
    monitor.maxDuration !== null,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [planLimitMessage, setPlanLimitMessage] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isPreset = INTERVAL_PRESETS.some((p) => p.seconds === Number(interval));

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    try {
      const body: Record<string, unknown> = {};
      if (name !== monitor.name) body.name = name;
      if (Number(interval) !== monitor.expectedInterval)
        body.expectedInterval = Number(interval);
      if (Number(gracePeriod) !== monitor.gracePeriod)
        body.gracePeriod = Number(gracePeriod);

      const newTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (JSON.stringify(newTags) !== JSON.stringify(monitor.tags))
        body.tags = newTags;

      const newMaxDuration = maxDuration ? Number(maxDuration) * 1000 : null;
      if (newMaxDuration !== (monitor.maxDuration ?? null))
        body.maxDuration = newMaxDuration;

      if (Object.keys(body).length === 0) {
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/monitors/${monitor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

      setSaved(true);
      toast.success('Changes saved');
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/monitors/${monitor.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message);
        return;
      }
      toast.success('Monitor deleted');
      router.push('/dashboard');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="config-name">Name</Label>
          <Input
            id="config-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="config-interval">Expected Interval</Label>
          {isPreset ? (
            <Select value={interval} onValueChange={(v) => setInterval(v)}>
              <SelectTrigger id="config-interval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVAL_PRESETS.map((p) => (
                  <SelectItem key={p.seconds} value={String(p.seconds)}>
                    {p.label} ({p.seconds}s)
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom...</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="flex gap-2">
              <Input
                id="config-interval"
                type="number"
                min={10}
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
              />
              <span className="text-muted-foreground flex items-center text-sm">
                seconds
              </span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="config-grace">Grace Period</Label>
          <div className="flex gap-2">
            <Input
              id="config-grace"
              type="number"
              min={0}
              value={gracePeriod}
              onChange={(e) => setGracePeriod(e.target.value)}
            />
            <span className="text-muted-foreground flex items-center text-sm">
              seconds
            </span>
          </div>
          {Number(gracePeriod) < defaultGracePeriod(Number(interval)) && (
            <p className="text-muted-foreground text-xs">
              Your grace period ({gracePeriod}s) is low for this interval.
              Suggested: {defaultGracePeriod(Number(interval))}s{' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() =>
                  setGracePeriod(String(defaultGracePeriod(Number(interval))))
                }
              >
                Apply suggestion
              </button>
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="config-tags">Tags (comma-separated)</Label>
          <Input
            id="config-tags"
            placeholder="production, backup, critical"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
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
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="config-max-duration">
                Max duration (seconds)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="config-max-duration"
                  type="number"
                  min={1}
                  value={maxDuration}
                  placeholder="e.g. 300 for 5 minutes"
                  onChange={(e) => setMaxDuration(e.target.value)}
                />
                <span className="text-muted-foreground flex items-center text-sm">
                  seconds
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                Alert if a run takes longer than this. Leave empty to disable.
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
        {saved && <span className="text-sm text-green-600">Changes saved</span>}
      </div>
      <div className="border-destructive/20 mt-6 border-t pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Delete monitor</p>
            <p className="text-muted-foreground text-sm">
              Permanently remove this monitor and all its data.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-[-4]h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {monitor.name}?</DialogTitle>
            <DialogDescription>
              Are you sure? This will delete all ping history and incidents for
              this monitor. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete monitor'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
