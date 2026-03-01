import type { IncidentData } from './status-page-view';

const SLOT_COLORS = {
  ok: 'bg-green-500',
  incident: 'bg-red-500',
};

/**
 * 30-slot bar starting from monitor creation (or 30 days ago, whichever is later).
 * Only covers the time the monitor actually existed — no grey filler slots.
 */
export function MiniUptimeBar({
  incidents,
  monitorCreatedAt,
}: {
  incidents: IncidentData[];
  monitorCreatedAt: string;
}) {
  const now = new Date();
  const created = new Date(monitorCreatedAt);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  // Window starts at monitor creation or 30 days ago, whichever is later
  const windowStart = created > thirtyDaysAgo ? created : thirtyDaysAgo;
  const windowMs = now.getTime() - windowStart.getTime();

  // Always render 30 slots, but they represent equal slices of the actual window
  const slotCount = 30;
  const slotMs = windowMs / slotCount;

  const slots: ('ok' | 'incident')[] = [];

  for (let i = 0; i < slotCount; i++) {
    const slotStart = new Date(windowStart.getTime() + i * slotMs);
    const slotEnd = new Date(windowStart.getTime() + (i + 1) * slotMs);

    const hadIncident = incidents.some((inc) => {
      const start = new Date(inc.startedAt);
      const end = inc.resolvedAt ? new Date(inc.resolvedAt) : now;
      return start < slotEnd && end > slotStart;
    });

    slots.push(hadIncident ? 'incident' : 'ok');
  }

  // Label: show actual window, not always "30 days"
  const windowDays = Math.ceil(windowMs / (24 * 60 * 60 * 1000));
  const title =
    windowDays >= 30
      ? 'Last 30 days'
      : windowDays === 1
        ? 'Last 24 hours'
        : `Last ${windowDays} days`;

  return (
    <div className="flex gap-px" title={title}>
      {slots.map((state, i) => (
        <div
          key={i}
          className={`h-6 flex-1 rounded-[2px] ${SLOT_COLORS[state]}`}
        />
      ))}
    </div>
  );
}
