import { db } from '@/lib/db';
import {
  alertChannels,
  monitorAlertChannels,
  pings,
  monitors as monitorsTable,
} from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { resend } from '@/lib/resend';
import type { Monitor, Incident, AlertChannel } from '@/lib/db/schema';
import type { AlertEvent } from '@/types';
import { truncateBody } from './utils';

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

function formatDurationMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return formatDuration(ms);
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
}

function buildAlertPayload(
  monitor: Monitor,
  event: 'monitor.down' | 'monitor.up' | 'monitor.slow',
  incident: Incident,
  lastPingBody: string | null,
): AlertEvent {
  const now = new Date();
  return {
    event,
    monitor: {
      id: monitor.id,
      name: monitor.name,
      slug: monitor.slug,
      status:
        event === 'monitor.down' || event === 'monitor.slow' ? 'down' : 'up',
      lastPingAt: monitor.lastPingAt?.toISOString() ?? null,
      expectedInterval: monitor.expectedInterval,
      downSince:
        event === 'monitor.down' ? incident.startedAt.toISOString() : undefined,
      lastPingBody: lastPingBody ?? undefined,
      maxDuration: monitor.maxDuration ?? undefined,
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
  event: 'monitor.down' | 'monitor.up' | 'monitor.slow',
  incident: Incident,
  options?: { lastPingDuration?: number },
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

  // Fetch the most recent ping body
  const [lastPing] = await db
    .select({ body: pings.body })
    .from(pings)
    .where(eq(pings.monitorId, monitor.id))
    .orderBy(desc(pings.receivedAt))
    .limit(1);

  const lastPingBody = lastPing?.body || null;

  const payload = buildAlertPayload(monitor, event, incident, lastPingBody);

  // Add duration info for slow alerts
  if (event === 'monitor.slow' && options?.lastPingDuration !== undefined) {
    payload.monitor.lastPingDuration = options.lastPingDuration;
  }

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
  const isSlow = payload.event === 'monitor.slow';
  const isDown = payload.event === 'monitor.down';

  const subject = isSlow
    ? `[SLOW] ${payload.monitor.name}`
    : isDown
      ? `[DOWN] ${payload.monitor.name} is not responding`
      : `[RECOVERED] ${payload.monitor.name} is back up`;

  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/monitors/${payload.monitor.id}`;

  const slowInfo =
    isSlow &&
    payload.monitor.lastPingDuration !== undefined &&
    payload.monitor.maxDuration !== undefined
      ? `Last run took ${formatDurationMs(payload.monitor.lastPingDuration)}, max allowed is ${formatDurationMs(payload.monitor.maxDuration)}.`
      : '';

  const text = isSlow
    ? `Monitor "${payload.monitor.name}" exceeded its max duration.\n\n${slowInfo}\n\nCheck your dashboard: ${dashboardUrl}`
    : isDown
      ? `Monitor "${payload.monitor.name}" has not sent a ping within its expected interval.\n\nLast ping: ${payload.monitor.lastPingAt ? formatTimestamp(payload.monitor.lastPingAt) : 'never'}\nDown since: ${formatTimestamp(payload.incident.startedAt)}\n\nCheck your dashboard: ${dashboardUrl}`
      : `Monitor "${payload.monitor.name}" has recovered after ${payload.incident.duration} of downtime.\n\nCheck your dashboard: ${dashboardUrl}`;

  const html = alertEmail(payload, dashboardUrl);

  await resend.emails.send({
    from: 'PulseMon Alerts <alerts@pulsemon.dev>',
    to,
    subject,
    text,
    html,
  });
}

function alertEmail(payload: AlertEvent, dashboardUrl: string): string {
  const isSlow = payload.event === 'monitor.slow';
  const isDown = payload.event === 'monitor.down';

  const statusColor = isDown || isSlow ? '#ef4444' : '#22c55e';
  const statusLabel = isSlow ? 'SLOW' : isDown ? 'DOWN' : 'RECOVERED';
  const statusBg = isDown || isSlow ? '#fef2f2' : '#f0fdf4';

  let details: string;
  if (isSlow) {
    const actualDuration =
      payload.monitor.lastPingDuration !== undefined
        ? formatDurationMs(payload.monitor.lastPingDuration)
        : 'unknown';
    const maxDuration =
      payload.monitor.maxDuration !== undefined
        ? formatDurationMs(payload.monitor.maxDuration)
        : 'unknown';
    details = `
          <tr><td style="padding:8px 0;font-size:14px;color:#52525b;border-bottom:1px solid #f4f4f5;">
            <strong style="color:#18181b;">Last run duration</strong><br>${actualDuration}
          </td></tr>
          <tr><td style="padding:8px 0;font-size:14px;color:#52525b;">
            <strong style="color:#18181b;">Max allowed</strong><br>${maxDuration}
          </td></tr>`;
  } else if (isDown) {
    details = `
          <tr><td style="padding:8px 0;font-size:14px;color:#52525b;border-bottom:1px solid #f4f4f5;">
            <strong style="color:#18181b;">Last ping</strong><br>${payload.monitor.lastPingAt ? formatTimestamp(payload.monitor.lastPingAt) : 'Never'}
          </td></tr>
          <tr><td style="padding:8px 0;font-size:14px;color:#52525b;">
            <strong style="color:#18181b;">Down since</strong><br>${formatTimestamp(payload.incident.startedAt)}
          </td></tr>`;
  } else {
    details = `
          <tr><td style="padding:8px 0;font-size:14px;color:#52525b;border-bottom:1px solid #f4f4f5;">
            <strong style="color:#18181b;">Downtime duration</strong><br>${payload.incident.duration}
          </td></tr>
          <tr><td style="padding:8px 0;font-size:14px;color:#52525b;">
            <strong style="color:#18181b;">Resolved at</strong><br>${formatTimestamp(payload.timestamp)}
          </td></tr>`;
  }

  // Add last output section if body is present
  let bodySection = '';
  if (payload.monitor.lastPingBody) {
    const truncated = truncateBody(payload.monitor.lastPingBody, 2000);
    const escaped = truncated
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    bodySection = `
          <tr><td style="padding:16px 0 0;">
            <strong style="color:#18181b;font-size:14px;">Last output</strong>
          </td></tr>
          <tr><td style="padding:8px 0;font-size:13px;">
            <pre style="margin:0;padding:12px;background-color:#f4f4f5;border-radius:6px;font-family:'SF Mono',Monaco,Consolas,monospace;font-size:12px;color:#18181b;white-space:pre-wrap;word-break:break-all;overflow-x:auto;">${escaped}</pre>
          </td></tr>`;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background-color:#18181b;padding:32px 40px;text-align:center;">
          <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">PulseMon</span>
        </td></tr>
        <!-- Status badge -->
        <tr><td style="padding:32px 40px 0;">
          <div style="display:inline-block;background-color:${statusBg};border:1px solid ${statusColor};border-radius:20px;padding:4px 14px;">
            <span style="font-size:13px;font-weight:600;color:${statusColor};">${statusLabel}</span>
          </div>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:16px 40px 40px;">
          <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#18181b;">${payload.monitor.name}</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#71717a;">/${payload.monitor.slug}</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${details}
            ${bodySection}
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
            <tr><td align="center">
              <a href="${dashboardUrl}" target="_blank" style="display:inline-block;background-color:#18181b;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
                View monitor
              </a>
            </td></tr>
          </table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 40px;border-top:1px solid #f4f4f5;">
          <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center;">
            You&rsquo;re receiving this because you have alerts enabled for this monitor on PulseMon.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

async function sendSlackWebhook(webhookUrl: string, payload: AlertEvent) {
  const isSlow = payload.event === 'monitor.slow';
  const isDown = payload.event === 'monitor.down';
  const isAlert = isDown || isSlow;
  const color = isAlert ? '#ef4444' : '#22c55e';

  const title = isSlow
    ? `[SLOW] ${payload.monitor.name}`
    : isDown
      ? `[DOWN] ${payload.monitor.name}`
      : `[RECOVERED] ${payload.monitor.name}`;

  let text: string;
  if (
    isSlow &&
    payload.monitor.lastPingDuration !== undefined &&
    payload.monitor.maxDuration !== undefined
  ) {
    text = `Last run took ${formatDurationMs(payload.monitor.lastPingDuration)}, max allowed is ${formatDurationMs(payload.monitor.maxDuration)}.`;
  } else if (isDown) {
    text = `Monitor has not pinged within expected interval. Down since ${formatTimestamp(payload.incident.startedAt)}.`;
  } else {
    text = `Monitor recovered after ${payload.incident.duration} of downtime.`;
  }

  // Add body as a field if present
  const fields: Array<{ title: string; value: string; short: boolean }> = [];
  if (payload.monitor.lastPingBody) {
    fields.push({
      title: 'Last output',
      value: truncateBody(payload.monitor.lastPingBody, 500),
      short: false,
    });
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [
        {
          color,
          title,
          text,
          fields: fields.length > 0 ? fields : undefined,
          footer: 'PulseMon',
          ts: Math.floor(new Date(payload.timestamp).getTime() / 1000),
        },
      ],
    }),
    signal: AbortSignal.timeout(10000),
  });
}

async function sendDiscordWebhook(webhookUrl: string, payload: AlertEvent) {
  const isSlow = payload.event === 'monitor.slow';
  const isDown = payload.event === 'monitor.down';
  const isAlert = isDown || isSlow;

  let description: string;
  if (
    isSlow &&
    payload.monitor.lastPingDuration !== undefined &&
    payload.monitor.maxDuration !== undefined
  ) {
    description = `Last run took ${formatDurationMs(payload.monitor.lastPingDuration)}, max allowed is ${formatDurationMs(payload.monitor.maxDuration)}.`;
  } else if (isDown) {
    description = `Monitor has not pinged within expected interval.`;
  } else {
    description = `Monitor recovered after ${payload.incident.duration}.`;
  }

  // Add body in a code block if present
  if (payload.monitor.lastPingBody) {
    const truncated = truncateBody(payload.monitor.lastPingBody, 500);
    description += `\n\n**Last output**\n\`\`\`\n${truncated}\n\`\`\``;
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [
        {
          title: isSlow
            ? `[SLOW] ${payload.monitor.name}`
            : isDown
              ? `[DOWN] ${payload.monitor.name}`
              : `[RECOVERED] ${payload.monitor.name}`,
          description,
          color: isAlert ? 0xef4444 : 0x22c55e,
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
