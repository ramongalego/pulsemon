import { RelativeTime } from '@/components/shared/relative-time';
import type { Incident } from '@/lib/db/schema';

export function FullIncidentsTable({ incidents }: { incidents: Incident[] }) {
  if (incidents.length === 0) {
    return (
      <div className="text-muted-foreground flex h-20 items-center justify-center">
        No incidents found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {incidents.map((incident) => (
        <div
          key={incident.id}
          className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
        >
          <div>
            <span className="font-medium">
              {incident.cause === 'missed_ping'
                ? 'Missed Ping'
                : incident.cause === 'duration_exceeded'
                  ? 'Duration Exceeded'
                  : incident.cause === 'overlap'
                    ? 'Overlap'
                    : incident.cause === 'explicit_failure'
                      ? 'Reported Failure'
                      : incident.cause}
            </span>
            <span className="text-muted-foreground ml-2">
              <RelativeTime date={incident.startedAt} />
            </span>
          </div>
          <div>
            {incident.resolvedAt ? (
              <span className="text-xs text-green-600">
                Resolved <RelativeTime date={incident.resolvedAt} />
              </span>
            ) : (
              <span className="text-xs font-medium text-red-600">Ongoing</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
