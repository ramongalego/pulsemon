import { Activity } from 'lucide-react';
import { RelativeTime } from '@/components/shared/relative-time';

export function StatusPageFooter({
  lastUpdated,
}: {
  lastUpdated: Date | null;
}) {
  return (
    <div className="text-muted-foreground flex items-center justify-between border-t pt-4 text-xs">
      <a
        href="https://pulsemon.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-foreground flex items-center gap-1.5 transition-colors"
      >
        <Activity className="h-3.5 w-3.5" />
        Powered by PulseMon
      </a>
      {lastUpdated && (
        <span>
          Last updated <RelativeTime date={lastUpdated} />
        </span>
      )}
    </div>
  );
}
