import { z } from 'zod';

const emailConfigSchema = z.object({ email: z.string().email() });
const slackConfigSchema = z.object({
  webhookUrl: z.string().url(),
  channel: z.string().optional(),
});
const discordConfigSchema = z.object({ webhookUrl: z.string().url() });
const webhookConfigSchema = z.object({
  url: z.string().url(),
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
