'use client';

import { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, MessageSquare, Plus, Trash2, Webhook } from 'lucide-react';
import { toast } from 'sonner';
import type { AlertChannel } from '@/lib/db/schema';
import { PlanLimitDialog } from '@/components/dashboard/plan-limit-dialog';

const CHANNEL_ICONS = {
  email: Mail,
  slack: MessageSquare,
  discord: MessageSquare,
  webhook: Webhook,
};

const CHANNEL_LABELS = {
  email: 'Email',
  slack: 'Slack',
  discord: 'Discord',
  webhook: 'Webhook',
};

function getConfigSummary(channel: AlertChannel): string {
  const config = channel.config as Record<string, string>;
  switch (channel.type) {
    case 'email':
      return config.email || '';
    case 'slack':
      return config.channel
        ? `#${config.channel}`
        : truncateUrl(config.webhookUrl);
    case 'discord':
      return truncateUrl(config.webhookUrl);
    case 'webhook':
      return truncateUrl(config.url);
    default:
      return '';
  }
}

function truncateUrl(url: string | undefined): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.hostname + parsed.pathname.slice(0, 20) + '...';
  } catch {
    return url.slice(0, 30) + '...';
  }
}

type ChannelType = 'email' | 'slack' | 'discord' | 'webhook';

export function AlertChannelManager({
  initialChannels,
}: {
  initialChannels: AlertChannel[];
}) {
  const [channels, setChannels] = useState(initialChannels);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [planLimitMessage, setPlanLimitMessage] = useState<string | null>(null);

  // Form state
  const [channelType, setChannelType] = useState<ChannelType>('email');
  const [email, setEmail] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [slackChannel, setSlackChannel] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const resetForm = useCallback(() => {
    setChannelType('email');
    setEmail('');
    setWebhookUrl('');
    setSlackChannel('');
    setWebhookSecret('');
    setIsDefault(false);
  }, []);

  function getConfig(): Record<string, string> {
    switch (channelType) {
      case 'email':
        return { email };
      case 'slack':
        return slackChannel
          ? { webhookUrl, channel: slackChannel }
          : { webhookUrl };
      case 'discord':
        return { webhookUrl };
      case 'webhook':
        return webhookSecret
          ? { url: webhookUrl, secret: webhookSecret }
          : { url: webhookUrl };
    }
  }

  function isFormValid(): boolean {
    switch (channelType) {
      case 'email':
        return email.includes('@');
      case 'slack':
      case 'discord':
        return webhookUrl.startsWith('http');
      case 'webhook':
        return webhookUrl.startsWith('http');
    }
  }

  async function handleCreate() {
    if (!isFormValid()) return;
    setIsCreating(true);

    try {
      const res = await fetch('/api/alert-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: channelType,
          config: getConfig(),
          isDefault,
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

      setChannels((prev) => [...prev, json.data]);
      resetForm();
      setDialogOpen(false);
      toast.success('Alert channel created');
    } catch {
      toast.error('Failed to create alert channel');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/alert-channels/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message);
        return;
      }
      setChannels((prev) => prev.filter((c) => c.id !== id));
      toast.success('Alert channel deleted');
    } catch {
      toast.error('Failed to delete alert channel');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Alert Channels</CardTitle>
            <CardDescription>
              Configure where you receive alerts when monitors go down
            </CardDescription>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Channel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Alert Channel</DialogTitle>
                <DialogDescription>
                  Choose a channel type and configure it.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Channel Type</Label>
                  <Select
                    value={channelType}
                    onValueChange={(v) => {
                      setChannelType(v as ChannelType);
                      setWebhookUrl('');
                      setEmail('');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="slack">Slack</SelectItem>
                      <SelectItem value="discord">Discord</SelectItem>
                      <SelectItem value="webhook">Custom Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {channelType === 'email' && (
                  <div className="space-y-2">
                    <Label htmlFor="channel-email">Email Address</Label>
                    <Input
                      id="channel-email"
                      type="email"
                      placeholder="alerts@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                )}

                {channelType === 'slack' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="channel-slack-url">
                        Slack Webhook URL
                      </Label>
                      <Input
                        id="channel-slack-url"
                        placeholder="https://hooks.slack.com/services/..."
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="channel-slack-channel">
                        Channel (optional)
                      </Label>
                      <Input
                        id="channel-slack-channel"
                        placeholder="#monitoring"
                        value={slackChannel}
                        onChange={(e) => setSlackChannel(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {channelType === 'discord' && (
                  <div className="space-y-2">
                    <Label htmlFor="channel-discord-url">
                      Discord Webhook URL
                    </Label>
                    <Input
                      id="channel-discord-url"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                  </div>
                )}

                {channelType === 'webhook' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="channel-webhook-url">Webhook URL</Label>
                      <Input
                        id="channel-webhook-url"
                        placeholder="https://api.example.com/alerts"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="channel-webhook-secret">
                        Secret (optional)
                      </Label>
                      <Input
                        id="channel-webhook-secret"
                        placeholder="Used for HMAC signature verification"
                        value={webhookSecret}
                        onChange={(e) => setWebhookSecret(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2">
                  <Switch
                    id="channel-default"
                    checked={isDefault}
                    onCheckedChange={setIsDefault}
                  />
                  <Label htmlFor="channel-default">
                    Default channel (auto-attach to new monitors)
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !isFormValid()}
                >
                  {isCreating ? 'Creating...' : 'Add Channel'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell className="text-muted-foreground mb-3 h-8 w-8" />
            <p className="text-muted-foreground text-sm">
              No alert channels yet. Add one to receive notifications when
              monitors go down.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {channels.map((channel) => {
              const Icon = CHANNEL_ICONS[channel.type];
              return (
                <div
                  key={channel.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-md">
                      <Icon className="text-primary h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {CHANNEL_LABELS[channel.type]}
                        </span>
                        {channel.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {getConfigSummary(channel)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground h-8 w-8 hover:text-red-600"
                    onClick={() => handleDelete(channel.id)}
                    disabled={deletingId === channel.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <PlanLimitDialog
        open={planLimitMessage !== null}
        onOpenChange={(open) => {
          if (!open) setPlanLimitMessage(null);
        }}
        message={planLimitMessage ?? ''}
      />
    </Card>
  );
}
