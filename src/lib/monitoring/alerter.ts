import { db } from '@/lib/db';
import {
  alertChannels,
  monitorAlertChannels,
  monitors as monitorsTable,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { resend } from '@/lib/resend';
import type { Monitor, Incident, AlertChannel } from '@/lib/db/schema';
import type { AlertEvent } from '@/types';

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function buildAlertPayload(
  monitor: Monitor,
  event: 'monitor.down' | 'monitor.up',
  incident: Incident,
): AlertEvent {
  const now = new Date();
  return {
    event,
    monitor: {
      id: monitor.id,
      name: monitor.name,
      slug: monitor.slug,
      status: event === 'monitor.down' ? 'down' : 'up',
      lastPingAt: monitor.lastPingAt?.toISOString() ?? null,
      expectedInterval: monitor.expectedInterval,
      downSince:
        event === 'monitor.down' ? incident.startedAt.toISOString() : undefined,
    },
    incident: {
      id: incident.id,
      startedAt: incident.startedAt.toISOString(),
      duration:
        event === 'monitor.up' && incident.resolvedAt
          ? formatDuration(
              incident.resolvedAt.getTime() - incident.startedAt.getTime(),
            )
          : formatDuration(now.getTime() - incident.startedAt.getTime()),
    },
    timestamp: now.toISOString(),
  };
}

export async function dispatchAlerts(
  monitor: Monitor,
  event: 'monitor.down' | 'monitor.up',
  incident: Incident,
) {
  // Get alert channels linked to this monitor
  const linkedChannels = await db
    .select({ channel: alertChannels })
    .from(monitorAlertChannels)
    .innerJoin(
      alertChannels,
      eq(monitorAlertChannels.alertChannelId, alertChannels.id),
    )
    .where(eq(monitorAlertChannels.monitorId, monitor.id));

  // If no linked channels, try default channels for the user
  let channels: AlertChannel[] = linkedChannels.map((r) => r.channel);
  if (channels.length === 0) {
    channels = await db
      .select()
      .from(alertChannels)
      .where(eq(alertChannels.userId, monitor.userId));

    // Filter to defaults only
    channels = channels.filter((c) => c.isDefault);
  }

  const payload = buildAlertPayload(monitor, event, incident);

  // Update lastAlertAt
  await db
    .update(monitorsTable)
    .set({ lastAlertAt: new Date() })
    .where(eq(monitorsTable.id, monitor.id));

  // Dispatch to each channel
  const dispatches = channels.map((channel) =>
    sendToChannel(channel, payload).catch((err) =>
      console.error(`Alert dispatch failed for channel ${channel.id}:`, err),
    ),
  );

  await Promise.allSettled(dispatches);
}

async function sendToChannel(channel: AlertChannel, payload: AlertEvent) {
  const config = channel.config as Record<string, string>;

  switch (channel.type) {
    case 'email':
      return sendEmail(config.email, payload);
    case 'slack':
      return sendSlackWebhook(config.webhookUrl, payload);
    case 'discord':
      return sendDiscordWebhook(config.webhookUrl, payload);
    case 'webhook':
      return sendCustomWebhook(config.url, payload, config.secret);
  }
}

async function sendEmail(to: string, payload: AlertEvent) {
  const isDown = payload.event === 'monitor.down';
  const subject = isDown
    ? `[DOWN] ${payload.monitor.name} is not responding`
    : `[RECOVERED] ${payload.monitor.name} is back up`;

  const text = isDown
    ? `Monitor "${payload.monitor.name}" has not sent a ping within its expected interval.\n\nLast ping: ${payload.monitor.lastPingAt ?? 'never'}\nDown since: ${payload.incident.startedAt}\n\nCheck your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/monitors/${payload.monitor.id}`
    : `Monitor "${payload.monitor.name}" has recovered after ${payload.incident.duration} of downtime.\n\nCheck your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/monitors/${payload.monitor.id}`;

  await resend.emails.send({
    from: 'PulseMon Alerts <alerts@pulsemon.dev>',
    to,
    subject,
    text,
  });
}

async function sendSlackWebhook(webhookUrl: string, payload: AlertEvent) {
  const isDown = payload.event === 'monitor.down';
  const color = isDown ? '#ef4444' : '#22c55e';
  const title = isDown
    ? `[DOWN] ${payload.monitor.name}`
    : `[RECOVERED] ${payload.monitor.name}`;

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [
        {
          color,
          title,
          text: isDown
            ? `Monitor has not pinged within expected interval. Down since ${payload.incident.startedAt}.`
            : `Monitor recovered after ${payload.incident.duration} of downtime.`,
          footer: 'PulseMon',
          ts: Math.floor(new Date(payload.timestamp).getTime() / 1000),
        },
      ],
    }),
    signal: AbortSignal.timeout(10000),
  });
}

async function sendDiscordWebhook(webhookUrl: string, payload: AlertEvent) {
  const isDown = payload.event === 'monitor.down';

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [
        {
          title: isDown
            ? `[DOWN] ${payload.monitor.name}`
            : `[RECOVERED] ${payload.monitor.name}`,
          description: isDown
            ? `Monitor has not pinged within expected interval.`
            : `Monitor recovered after ${payload.incident.duration}.`,
          color: isDown ? 0xef4444 : 0x22c55e,
          timestamp: payload.timestamp,
          footer: { text: 'PulseMon' },
        },
      ],
    }),
    signal: AbortSignal.timeout(10000),
  });
}

async function sendCustomWebhook(
  url: string,
  payload: AlertEvent,
  secret?: string,
) {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (secret) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(body),
    );
    const hex = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    headers['X-PulseMon-Signature'] = `sha256=${hex}`;
  }

  await fetch(url, {
    method: 'POST',
    headers,
    body,
    signal: AbortSignal.timeout(10000),
  });
}
