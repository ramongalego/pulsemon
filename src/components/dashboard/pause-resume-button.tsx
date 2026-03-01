'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';

export function PauseResumeButton({
  monitorId,
  isPaused,
}: {
  monitorId: string;
  isPaused: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [optimisticPaused, setOptimisticPaused] = useState(isPaused);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    try {
      const res = await fetch(`/api/monitors/${monitorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaused: !isPaused }),
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message);
        setLoading(false);
        return;
      }
      setOptimisticPaused(!isPaused);
      toast.success(isPaused ? 'Monitor resumed' : 'Monitor paused');
      router.refresh();
    } catch {
      toast.error('Failed to update monitor');
    }
    setLoading(false);
  }

  const showPaused = loading ? isPaused : optimisticPaused;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground h-8 w-8"
      onClick={handleToggle}
      disabled={loading}
      title={showPaused ? 'Resume monitor' : 'Pause monitor'}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : showPaused ? (
        <Play className="h-4 w-4" />
      ) : (
        <Pause className="h-4 w-4" />
      )}
    </Button>
  );
}
