import type { IntervalPreset, PlanLimits } from '@/types';

export const INTERVAL_PRESETS: IntervalPreset[] = [
  { label: 'Every minute', seconds: 60 },
  { label: 'Every 5 minutes', seconds: 300 },
  { label: 'Every 15 minutes', seconds: 900 },
  { label: 'Every 30 minutes', seconds: 1800 },
  { label: 'Every hour', seconds: 3600 },
  { label: 'Every 6 hours', seconds: 21600 },
  { label: 'Every 12 hours', seconds: 43200 },
  { label: 'Every day', seconds: 86400 },
  { label: 'Every week', seconds: 604800 },
];

export const DEFAULT_GRACE_PERIOD = 300; // 5 minutes

/** Smart grace period default scaled to the expected interval */
export function defaultGracePeriod(intervalSeconds: number): number {
  if (intervalSeconds <= 60) return 30; // fast jobs: 30s grace
  if (intervalSeconds <= 300) return 60; // 5min or less: 1min grace
  if (intervalSeconds <= 3600) return 300; // hourly or less: 5min grace
  if (intervalSeconds <= 86400) return 900; // daily or less: 15min grace
  return 1800; // weekly+: 30min grace
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    monitors: 30,
    checkInterval: 60,
    teamMembers: 1,
    alertChannels: 2,
    pingHistoryDays: 7,
    allowedChannelTypes: ['email', 'slack', 'discord'],
    maxNonEmailTypes: 1,
    statusPages: 1,
    monitorsPerStatusPage: 10,
  },
  starter: {
    monitors: 100,
    checkInterval: 30,
    teamMembers: 3,
    alertChannels: 5,
    pingHistoryDays: 30,
    allowedChannelTypes: ['email', 'slack', 'discord'],
    maxNonEmailTypes: Infinity,
    statusPages: 2,
    monitorsPerStatusPage: 25,
  },
  pro: {
    monitors: Infinity,
    checkInterval: 10,
    teamMembers: 10,
    alertChannels: Infinity,
    pingHistoryDays: 90,
    allowedChannelTypes: ['email', 'slack', 'discord', 'webhook'],
    maxNonEmailTypes: Infinity,
    statusPages: 5,
    monitorsPerStatusPage: Infinity,
  },
};

// Alert escalation intervals (in seconds)
export const ALERT_ESCALATION_INTERVALS = [
  0, // Immediate
  3600, // 1 hour
  21600, // 6 hours
  86400, // 24 hours
];

// Redis TTL buffer (extra seconds beyond expected interval + grace period)
export const REDIS_TTL_BUFFER = 60;
