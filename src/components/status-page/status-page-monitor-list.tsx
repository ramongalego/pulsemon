import type { MonitorData, IncidentData } from './status-page-view';
import { MiniUptimeBar } from './mini-uptime-bar';

const STATUS_DOT: Record<string, string> = {
  up: 'bg-green-500',
  down: 'bg-red-500',
  paused: 'bg-gray-400',
  new: 'bg-gray-400',
};

export function StatusPageMonitorList({
  monitors,
  incidents,
}: {
  monitors: MonitorData[];
  incidents: IncidentData[];
}) {
  if (monitors.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center text-sm">
        No monitors configured for this status page.
      </div>
    );
  }

  return (
    <div className="divide-y rounded-lg border">
      {monitors.map((monitor, i) => {
        const monitorIncidents = incidents.filter(
          (inc) => inc.monitorName === monitor.name,
        );

        return (
          <div key={`${monitor.name}-${i}`} className="space-y-2 px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[monitor.status] ?? 'bg-gray-400'}`}
              />
              <span className="flex-1 text-sm font-medium">{monitor.name}</span>
              {monitor.uptime !== null && (
                <span
                  className={`text-xs font-medium ${
                    monitor.uptime >= 99.9
                      ? 'text-green-600'
                      : monitor.uptime >= 99
                        ? 'text-amber-600'
                        : 'text-red-600'
                  }`}
                >
                  {monitor.uptime.toFixed(2)}%
                </span>
              )}
            </div>
            <MiniUptimeBar
              incidents={monitorIncidents}
              monitorCreatedAt={monitor.createdAt}
            />
          </div>
        );
      })}
    </div>
  );
}
