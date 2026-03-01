'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Invisible component that refreshes the server component data on an interval.
 * Drop it into any page that should stay up to date.
 */
export function AutoRefresh({ intervalMs = 30000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, intervalMs);
    return () => clearInterval(interval);
  }, [router, intervalMs]);

  return null;
}
