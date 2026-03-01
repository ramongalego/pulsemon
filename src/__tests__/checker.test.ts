import { describe, it, expect } from 'vitest';
import { isMonitorLate, shouldSendReminder } from '@/lib/monitoring/utils';

describe('isMonitorLate', () => {
  const INTERVAL = 300; // 5 min in seconds
  const GRACE = 60; // 1 min in seconds

  it('returns true when lastPing is null (never pinged)', () => {
    expect(isMonitorLate(null, INTERVAL, GRACE, Date.now())).toBe(true);
  });

  it('returns false when ping is within interval', () => {
    const now = Date.now();
    const lastPing = now - 100 * 1000; // 100s ago, within 300s interval
    expect(isMonitorLate(lastPing, INTERVAL, GRACE, now)).toBe(false);
  });

  it('returns false when ping is past interval but within grace period', () => {
    const now = Date.now();
    // 320s ago: past the 300s interval but within the 60s grace
    const lastPing = now - 320 * 1000;
    expect(isMonitorLate(lastPing, INTERVAL, GRACE, now)).toBe(false);
  });

  it('returns true when ping is past interval + grace period', () => {
    const now = Date.now();
    // 361s ago: past 300s + 60s
    const lastPing = now - 361 * 1000;
    expect(isMonitorLate(lastPing, INTERVAL, GRACE, now)).toBe(true);
  });

  it('returns false when exactly at the deadline', () => {
    const now = Date.now();
    // Exactly at 360s: interval(300) + grace(60) = 360
    const lastPing = now - 360 * 1000;
    expect(isMonitorLate(lastPing, INTERVAL, GRACE, now)).toBe(false);
  });

  it('handles zero grace period', () => {
    const now = Date.now();
    const lastPing = now - 301 * 1000; // 301s ago, past 300s + 0 grace
    expect(isMonitorLate(lastPing, INTERVAL, 0, now)).toBe(true);
  });

  it('handles very large intervals (weekly jobs)', () => {
    const now = Date.now();
    const weekInSeconds = 604800;
    const graceHour = 3600;
    // 6 days ago - still within the week
    const lastPing = now - 6 * 86400 * 1000;
    expect(isMonitorLate(lastPing, weekInSeconds, graceHour, now)).toBe(false);
  });

  it('handles very large intervals (weekly jobs) when late', () => {
    const now = Date.now();
    const weekInSeconds = 604800;
    const graceHour = 3600;
    // 8 days ago - past week + 1h grace
    const lastPing = now - 8 * 86400 * 1000;
    expect(isMonitorLate(lastPing, weekInSeconds, graceHour, now)).toBe(true);
  });

  it('handles minute-level intervals', () => {
    const now = Date.now();
    // 60s interval, 30s grace, pinged 80s ago = within deadline
    expect(isMonitorLate(now - 80 * 1000, 60, 30, now)).toBe(false);
    // 60s interval, 30s grace, pinged 91s ago = late
    expect(isMonitorLate(now - 91 * 1000, 60, 30, now)).toBe(true);
  });
});

describe('shouldSendReminder', () => {
  // ALERT_ESCALATION_INTERVALS = [0, 3600, 21600, 86400]

  it('sends immediately for the first alert (alertsSent=0)', () => {
    const start = new Date('2025-01-01T00:00:00Z');
    const now = start.getTime() + 1000; // 1s after incident
    expect(shouldSendReminder(start, 0, now)).toBe(true);
  });

  it('does not send 1h reminder too early', () => {
    const start = new Date('2025-01-01T00:00:00Z');
    const now = start.getTime() + 30 * 60 * 1000; // 30 min later
    expect(shouldSendReminder(start, 1, now)).toBe(false);
  });

  it('sends 1h reminder after 1 hour', () => {
    const start = new Date('2025-01-01T00:00:00Z');
    const now = start.getTime() + 3600 * 1000; // exactly 1h
    expect(shouldSendReminder(start, 1, now)).toBe(true);
  });

  it('sends 6h reminder after 6 hours', () => {
    const start = new Date('2025-01-01T00:00:00Z');
    const now = start.getTime() + 21600 * 1000; // 6h
    expect(shouldSendReminder(start, 2, now)).toBe(true);
  });

  it('does not send 6h reminder at 5h', () => {
    const start = new Date('2025-01-01T00:00:00Z');
    const now = start.getTime() + 5 * 3600 * 1000;
    expect(shouldSendReminder(start, 2, now)).toBe(false);
  });

  it('sends 24h reminder after 24 hours', () => {
    const start = new Date('2025-01-01T00:00:00Z');
    const now = start.getTime() + 86400 * 1000;
    expect(shouldSendReminder(start, 3, now)).toBe(true);
  });

  it('sends additional reminders every 24h after exhausting escalation', () => {
    const start = new Date('2025-01-01T00:00:00Z');
    // After all 4 intervals used, next reminder at 86400 + 86400 = 172800s
    const now = start.getTime() + 172800 * 1000;
    expect(shouldSendReminder(start, 4, now)).toBe(true);
  });

  it('does not send too-early reminder after escalation exhausted', () => {
    const start = new Date('2025-01-01T00:00:00Z');
    // 4 alerts sent, only 30h passed (need 48h for next)
    const now = start.getTime() + 30 * 3600 * 1000;
    expect(shouldSendReminder(start, 4, now)).toBe(false);
  });
});
