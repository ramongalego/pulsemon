import { ALERT_ESCALATION_INTERVALS } from './constants';

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
