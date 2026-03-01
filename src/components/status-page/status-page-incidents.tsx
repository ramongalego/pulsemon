import { CheckCircle2 } from 'lucide-react';
import type { IncidentData } from './status-page-view';

function formatDuration(startedAt: string, resolvedAt: string | null): string {
  if (!resolvedAt) {
    const start = new Date(startedAt);
    return `Ongoing since ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  const durationMs =
    new Date(resolvedAt).getTime() - new Date(startedAt).getTime();
  const seconds = Math.floor(durationMs / 1000);
  if (seconds < 60) return `Down for ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Down for ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `Down for ${hours}h ${remainingMinutes}m`
    : `Down for ${hours}h`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function groupByDate(incidents: IncidentData[]): Map<string, IncidentData[]> {
  const groups = new Map<string, IncidentData[]>();

  // Sort by date descending
  const sorted = [...incidents].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );

  for (const incident of sorted) {
    const dateKey = new Date(incident.startedAt).toDateString();
    const group = groups.get(dateKey);
    if (group) {
      group.push(incident);
    } else {
      groups.set(dateKey, [incident]);
    }
  }

  return groups;
}

export function StatusPageIncidents({
  incidents,
}: {
  incidents: IncidentData[];
}) {
  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border py-8">
        <CheckCircle2 className="h-8 w-8 text-green-500" />
        <p className="text-muted-foreground text-sm">
          No incidents in the last 14 days
        </p>
      </div>
    );
  }

  const grouped = groupByDate(incidents);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Recent Incidents</h2>
      {Array.from(grouped.entries()).map(([dateKey, dateIncidents]) => (
        <div key={dateKey} className="space-y-2">
          <h3 className="text-muted-foreground text-sm font-medium">
            {formatDate(dateIncidents[0].startedAt)}
          </h3>
          <div className="space-y-2">
            {dateIncidents.map((incident, i) => (
              <div
                key={`${incident.monitorName}-${i}`}
                className="rounded-lg border px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {incident.monitorName}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatDuration(incident.startedAt, incident.resolvedAt)}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {new Date(incident.startedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {incident.resolvedAt &&
                    ` - ${new Date(incident.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
