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

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    monitors: 30,
    checkInterval: 60,
    teamMembers: 1,
    alertChannels: 2,
    pingHistoryDays: 7,
    allowedChannelTypes: ['email', 'slack', 'discord'],
    maxNonEmailTypes: 1,
  },
  starter: {
    monitors: 100,
    checkInterval: 30,
    teamMembers: 3,
    alertChannels: 5,
    pingHistoryDays: 30,
    allowedChannelTypes: ['email', 'slack', 'discord'],
    maxNonEmailTypes: Infinity,
  },
  pro: {
    monitors: Infinity,
    checkInterval: 10,
    teamMembers: 10,
    alertChannels: Infinity,
    pingHistoryDays: 90,
    allowedChannelTypes: ['email', 'slack', 'discord', 'webhook'],
    maxNonEmailTypes: Infinity,
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
