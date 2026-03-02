import { z } from 'zod';

const safeWebhookUrl = z
  .string()
  .url()
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') return false;
        const h = parsed.hostname;
        if (
          h === 'localhost' ||
          h === '[::1]' ||
          h === '0.0.0.0' ||
          h === '169.254.169.254' ||
          h.startsWith('127.') ||
          h.startsWith('10.') ||
          h.startsWith('192.168.') ||
          /^172\.(1[6-9]|2\d|3[01])\./.test(h)
        )
          return false;
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
