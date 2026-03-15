// API response types
export type ApiResponse<T> =
  | {
      data: T;
      error: null;
    }
  | {
      data: null;
      error: { code: string; message: string };
    };

// Monitor status type
export type MonitorStatus = 'up' | 'down' | 'paused' | 'new';

// Ping status type
export type PingStatus = 'success' | 'fail' | 'start';

// Plan type
export type Plan = 'free' | 'starter' | 'pro' | 'lifetime';

// Alert channel type
export type AlertChannelType = 'email' | 'slack' | 'discord' | 'webhook';

// Alert channel config types
export type EmailConfig = {
  email: string;
};

export type SlackConfig = {
  webhookUrl: string;
  channel?: string;
};

export type DiscordConfig = {
  webhookUrl: string;
};

export type WebhookConfig = {
  url: string;
  secret?: string;
};

export type AlertChannelConfig =
  | EmailConfig
  | SlackConfig
  | DiscordConfig
  | WebhookConfig;

// Alert event payload (for webhooks)
export type AlertEvent = {
  event: 'monitor.down' | 'monitor.up' | 'monitor.slow' | 'monitor.overlap';
  monitor: {
    id: string;
    name: string;
    slug: string;
    status: MonitorStatus;
    lastPingAt: string | null;
    expectedInterval: number;
    downSince?: string;
    lastPingBody?: string | null;
    maxDuration?: number;
    lastPingDuration?: number;
    lastStartAt?: string;
  };
  incident: {
    id: string;
    startedAt: string;
    duration?: string;
  };
  timestamp: string;
};

// Plan limits
export type PlanLimits = {
  monitors: number;
  checkInterval: number;
  teamMembers: number;
  alertChannels: number;
  pingHistoryDays: number;
  allowedChannelTypes: AlertChannelType[];
  maxNonEmailTypes: number;
  statusPages: number;
  monitorsPerStatusPage: number;
};

// Interval presets for monitor creation
export type IntervalPreset = {
  label: string;
  seconds: number;
};
