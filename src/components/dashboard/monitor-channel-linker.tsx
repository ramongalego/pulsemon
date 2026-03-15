'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Mail, Webhook } from 'lucide-react';
import { SlackIcon } from '@/components/icons/slack';
import { DiscordIcon } from '@/components/icons/discord';
import { toast } from 'sonner';
import type { AlertChannel } from '@/lib/db/schema';

const CHANNEL_ICONS = {
  email: Mail,
  slack: SlackIcon,
  discord: DiscordIcon,
  webhook: Webhook,
};

const CHANNEL_LABELS = {
  email: 'Email',
  slack: 'Slack',
  discord: 'Discord',
  webhook: 'Webhook',
};

export function MonitorChannelLinker({
  monitorId,
  allChannels,
  linkedChannelIds,
}: {
  monitorId: string;
  allChannels: AlertChannel[];
  linkedChannelIds: string[];
}) {
  const router = useRouter();
  const [linked, setLinked] = useState(new Set(linkedChannelIds));
  const [saving, setSaving] = useState(false);

  const handleToggle = useCallback(
    async (channelId: string) => {
      const newLinked = new Set(linked);
      if (newLinked.has(channelId)) {
        newLinked.delete(channelId);
      } else {
        newLinked.add(channelId);
      }
      setLinked(newLinked);
      setSaving(true);

      try {
        const res = await fetch(`/api/monitors/${monitorId}/channels`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelIds: Array.from(newLinked) }),
        });
        const json = await res.json();
        if (json.error) {
          toast.error(json.error.message);
          setLinked(linked);
          return;
        }
        router.refresh();
      } catch {
        toast.error('Failed to update alert channels');
        setLinked(linked);
      } finally {
        setSaving(false);
      }
    },
    [monitorId, linked, router],
  );

  if (allChannels.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No alert channels configured.{' '}
        <a href="/dashboard/alerts" className="text-primary underline">
          Add one
        </a>{' '}
        to receive notifications.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs">
        Select which channels receive alerts for this monitor. If none are
        selected, your default channels will be used.
        {saving && (
          <span className="text-primary ml-2 animate-pulse">Saving...</span>
        )}
      </p>
      {allChannels.map((channel) => {
        const Icon = CHANNEL_ICONS[channel.type];
        const isLinked = linked.has(channel.id);
        const config = channel.config as Record<string, string>;
        const summary =
          channel.type === 'email'
            ? config.email
            : channel.type === 'webhook'
              ? config.url
              : config.webhookUrl;

        return (
          <label
            key={channel.id}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
              isLinked ? 'border-primary/50 bg-primary/5' : 'hover:bg-muted/50'
            }`}
          >
            <input
              type="checkbox"
              checked={isLinked}
              onChange={() => handleToggle(channel.id)}
              className="accent-primary h-4 w-4"
            />
            <Icon className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-medium">
              {CHANNEL_LABELS[channel.type]}
            </span>
            {channel.isDefault && (
              <Badge variant="secondary" className="text-xs">
                Default
              </Badge>
            )}
            <span className="text-muted-foreground flex-1 truncate text-xs">
              {summary}
            </span>
          </label>
        );
      })}
    </div>
  );
}
