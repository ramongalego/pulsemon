import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';

// Enums
export const planEnum = pgEnum('plan', ['free', 'starter', 'pro', 'lifetime']);
export const monitorStatusEnum = pgEnum('monitor_status', [
  'up',
  'down',
  'paused',
  'new',
]);
export const pingStatusEnum = pgEnum('ping_status', ['success', 'fail']);
export const alertChannelTypeEnum = pgEnum('alert_channel_type', [
  'email',
  'slack',
  'discord',
  'webhook',
]);

// Users
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name'),
  image: text('image'),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  plan: planEnum('plan').default('free').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Auth.js required tables
export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
  ],
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

// Monitors
export const monitors = pgTable(
  'monitors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').unique().notNull(),
    expectedInterval: integer('expected_interval').notNull(),
    gracePeriod: integer('grace_period').notNull().default(300),
    status: monitorStatusEnum('status').default('new').notNull(),
    lastPingAt: timestamp('last_ping_at', { withTimezone: true }),
    lastAlertAt: timestamp('last_alert_at', { withTimezone: true }),
    isPaused: boolean('is_paused').default(false).notNull(),
    tags: text('tags').array().default([]).notNull(),
    maxDuration: integer('max_duration_ms'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('monitors_user_id_idx').on(table.userId)],
);

// Pings
export const pings = pgTable(
  'pings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    monitorId: uuid('monitor_id')
      .notNull()
      .references(() => monitors.id, { onDelete: 'cascade' }),
    receivedAt: timestamp('received_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    sourceIp: text('source_ip'),
    duration: integer('duration'),
    status: pingStatusEnum('status').default('success').notNull(),
    body: text('body'),
  },
  (table) => [
    index('pings_monitor_received_idx').on(table.monitorId, table.receivedAt),
  ],
);

// Alert Channels
export const alertChannels = pgTable('alert_channels', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: alertChannelTypeEnum('type').notNull(),
  config: jsonb('config').notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Monitor <-> Alert Channel join table
export const monitorAlertChannels = pgTable(
  'monitor_alert_channels',
  {
    monitorId: uuid('monitor_id')
      .notNull()
      .references(() => monitors.id, { onDelete: 'cascade' }),
    alertChannelId: uuid('alert_channel_id')
      .notNull()
      .references(() => alertChannels.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.monitorId, table.alertChannelId] })],
);

// Incidents
export const incidents = pgTable(
  'incidents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    monitorId: uuid('monitor_id')
      .notNull()
      .references(() => monitors.id, { onDelete: 'cascade' }),
    startedAt: timestamp('started_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    cause: text('cause').default('missed_ping').notNull(),
    alertsSent: integer('alerts_sent').default(0).notNull(),
  },
  (table) => [index('incidents_monitor_id_idx').on(table.monitorId)],
);

// API Keys
export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    keyHash: text('key_hash').notNull(),
    keyPrefix: text('key_prefix').notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('api_keys_user_id_idx').on(table.userId)],
);

// Status Pages
export const statusPages = pgTable(
  'status_pages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    slug: text('slug').unique().notNull(),
    description: text('description'),
    customDomain: text('custom_domain').unique(),
    isPublic: boolean('is_public').default(true).notNull(),
    showOverallUptime: boolean('show_overall_uptime').default(true).notNull(),
    showIncidentHistory: boolean('show_incident_history')
      .default(true)
      .notNull(),
    logoUrl: text('logo_url'),
    brandColor: text('brand_color'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('status_pages_user_id_idx').on(table.userId)],
);

// Status Page <-> Monitor join table
export const statusPageMonitors = pgTable(
  'status_page_monitors',
  {
    statusPageId: uuid('status_page_id')
      .notNull()
      .references(() => statusPages.id, { onDelete: 'cascade' }),
    monitorId: uuid('monitor_id')
      .notNull()
      .references(() => monitors.id, { onDelete: 'cascade' }),
    displayName: text('display_name'),
    sortOrder: integer('sort_order').default(0).notNull(),
  },
  (table) => [primaryKey({ columns: [table.statusPageId, table.monitorId] })],
);

// Feedback
export const feedbackTypeEnum = pgEnum('feedback_type', [
  'feedback',
  'bug',
  'support',
]);

export const feedback = pgTable('feedback', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: feedbackTypeEnum('type').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Monitor = typeof monitors.$inferSelect;
export type NewMonitor = typeof monitors.$inferInsert;
export type Ping = typeof pings.$inferSelect;
export type NewPing = typeof pings.$inferInsert;
export type AlertChannel = typeof alertChannels.$inferSelect;
export type NewAlertChannel = typeof alertChannels.$inferInsert;
export type Incident = typeof incidents.$inferSelect;
export type NewIncident = typeof incidents.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type StatusPage = typeof statusPages.$inferSelect;
export type NewStatusPage = typeof statusPages.$inferInsert;
export type StatusPageMonitor = typeof statusPageMonitors.$inferSelect;
export type NewStatusPageMonitor = typeof statusPageMonitors.$inferInsert;
