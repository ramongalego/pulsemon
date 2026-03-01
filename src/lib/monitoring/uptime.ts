export function computeUptime(
  incidentList: { startedAt: Date; resolvedAt: Date | null }[],
  monitorCreatedAt: Date,
  hasReceivedPing: boolean,
): number | null {
  // No data to measure yet — don't show a misleading percentage
  if (!hasReceivedPing) return null;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  // Use the later of 30 days ago or monitor creation, so young monitors
  // aren't measured against time they didn't exist
  const windowStart = Math.max(
    thirtyDaysAgo.getTime(),
    monitorCreatedAt.getTime(),
  );
  let downtimeMs = 0;
  for (const incident of incidentList) {
    const start = Math.max(incident.startedAt.getTime(), windowStart);
    const end = incident.resolvedAt
      ? incident.resolvedAt.getTime()
      : now.getTime();
    if (end > start) {
      downtimeMs += end - start;
    }
  }
  const totalMs = now.getTime() - windowStart;
  return totalMs > 0 ? ((totalMs - downtimeMs) / totalMs) * 100 : 100;
}
