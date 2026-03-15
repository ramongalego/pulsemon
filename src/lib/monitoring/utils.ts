import { ALERT_ESCALATION_INTERVALS } from './constants';

/**
 * Determines if a ping duration exceeds the max duration threshold.
 * Returns false if either value is null (no threshold or no duration reported).
 */
export function isDurationExceeded(
  pingDuration: number | null,
  maxDuration: number | null,
): boolean {
  if (maxDuration === null || pingDuration === null) return false;
  return pingDuration > maxDuration;
}

/**
 * Truncates a string to a max length, appending a note if truncated.
 */
export function truncateBody(body: string, maxLength: number): string {
  if (body.length <= maxLength) return body;
  return body.slice(0, maxLength) + '\n... (truncated)';
}

/**
 * Determines if a start ping creates an overlap.
 * Returns true if the monitor is already running when a new start arrives.
 */
export function isOverlap(
  isRunning: boolean,
  pingStatus: 'success' | 'fail' | 'start',
): boolean {
  return pingStatus === 'start' && isRunning;
}

/**
 * Determines if a ping should reset the monitor's deadline.
 * Only success pings reset the deadline.
 */
export function shouldResetDeadline(
  pingStatus: 'success' | 'fail' | 'start',
): boolean {
  return pingStatus === 'success';
}

/**
 * Determines if a fail ping should create an incident.
 * Only creates one if no incident is already open.
 */
export function shouldCreateFailIncident(
  pingStatus: 'success' | 'fail' | 'start',
  hasOpenIncident: boolean,
): boolean {
  return pingStatus === 'fail' && !hasOpenIncident;
}

/**
 * Determines the new isRunning state after a ping.
 * Start pings set it to true, success/fail pings set it to false.
 */
export function nextRunningState(
  pingStatus: 'success' | 'fail' | 'start',
): boolean {
  return pingStatus === 'start';
}

/**
 * Determines if a monitor is late based on last ping time,
 * expected interval, and grace period.
 */
export function isMonitorLate(
  lastPingTimestamp: number | null,
  expectedIntervalSeconds: number,
  gracePeriodSeconds: number,
  nowTimestamp: number,
): boolean {
  if (lastPingTimestamp === null) return true;
  const deadline =
    lastPingTimestamp + (expectedIntervalSeconds + gracePeriodSeconds) * 1000;
  return nowTimestamp > deadline;
}

/**
 * Determines if a reminder alert should be sent based on escalation intervals.
 */
export function shouldSendReminder(
  incidentStartedAt: Date,
  alertsSent: number,
  nowTimestamp: number,
): boolean {
  if (alertsSent >= ALERT_ESCALATION_INTERVALS.length) {
    // After all escalation intervals, remind every 24h
    const lastInterval =
      ALERT_ESCALATION_INTERVALS[ALERT_ESCALATION_INTERVALS.length - 1];
    const extraIntervals = alertsSent - ALERT_ESCALATION_INTERVALS.length + 1;
    const nextAlertAfter = (lastInterval + extraIntervals * 86400) * 1000;
    const elapsed = nowTimestamp - incidentStartedAt.getTime();
    return elapsed >= nextAlertAfter;
  }

  const nextInterval = ALERT_ESCALATION_INTERVALS[alertsSent] * 1000;
  const elapsed = nowTimestamp - incidentStartedAt.getTime();
  return elapsed >= nextInterval;
}
