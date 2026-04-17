import { z } from 'zod';

// Rejects HTTP, raw IP literals in private/reserved ranges, and hostnames that
// commonly resolve to local infrastructure. Note: this is a string-time check —
// DNS-rebinding attacks aren't fully covered (would require resolving at fetch
// time on every dispatch). Acceptable trade-off for our threat model.
const safeWebhookUrl = z
  .string()
  .url()
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') return false;
        const h = parsed.hostname.toLowerCase();

        // Reserved hostnames
        if (
          h === 'localhost' ||
          h.endsWith('.localhost') ||
          h.endsWith('.local') ||
          h.endsWith('.internal') ||
          h === 'broadcasthost'
        ) {
          return false;
        }

        // Strip IPv6 brackets if present
        const host = h.startsWith('[') && h.endsWith(']') ? h.slice(1, -1) : h;

        // IPv6 reserved ranges
        if (
          host === '::' ||
          host === '::1' ||
          host.startsWith('fe80:') || // link-local
          host.startsWith('fc') || // unique local fc00::/7
          host.startsWith('fd') ||
          host.startsWith('::ffff:') // IPv4-mapped (could embed 127.0.0.1)
        ) {
          return false;
        }

        // IPv4 reserved ranges
        if (
          host === '0.0.0.0' ||
          host === '169.254.169.254' || // cloud metadata
          host.startsWith('127.') || // loopback
          host.startsWith('10.') || // private
          host.startsWith('192.168.') || // private
          host.startsWith('169.254.') || // link-local
          host.startsWith('0.') || // current network
          /^172\.(1[6-9]|2\d|3[01])\./.test(host) || // private 172.16/12
          /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(host) || // CGNAT 100.64/10
          /^198\.(1[89])\./.test(host) || // benchmark 198.18/15
          /^(22[4-9]|23\d)\./.test(host) || // multicast 224/4
          /^(24\d|25[0-5])\./.test(host) // reserved 240/4
        ) {
          return false;
        }

        return true;
      } catch {
        return false;
      }
    },
    { message: 'Webhook URL must be HTTPS and not target private networks' },
  );

const emailConfigSchema = z.object({ email: z.string().email() });
const slackConfigSchema = z.object({
  webhookUrl: safeWebhookUrl,
  channel: z.string().optional(),
});
const discordConfigSchema = z.object({ webhookUrl: safeWebhookUrl });
const webhookConfigSchema = z.object({
  url: safeWebhookUrl,
  secret: z.string().optional(),
});

export const createAlertChannelSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('email'),
    config: emailConfigSchema,
    isDefault: z.boolean().default(false),
  }),
  z.object({
    type: z.literal('slack'),
    config: slackConfigSchema,
    isDefault: z.boolean().default(false),
  }),
  z.object({
    type: z.literal('discord'),
    config: discordConfigSchema,
    isDefault: z.boolean().default(false),
  }),
  z.object({
    type: z.literal('webhook'),
    config: webhookConfigSchema,
    isDefault: z.boolean().default(false),
  }),
]);

export const updateAlertChannelSchema = z.object({
  config: z
    .union([
      emailConfigSchema,
      slackConfigSchema,
      discordConfigSchema,
      webhookConfigSchema,
    ])
    .optional(),
  isDefault: z.boolean().optional(),
});
