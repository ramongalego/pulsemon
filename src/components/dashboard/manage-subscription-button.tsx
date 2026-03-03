'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch('/api/customer-portal', {
        method: 'POST',
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message ?? 'Something went wrong');
        return;
      }
      if (json.data?.url) {
        window.location.href = json.data.url;
      }
    } catch {
      toast.error('Failed to open billing portal. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" disabled={loading} onClick={handleClick}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Manage Subscription
    </Button>
  );
}
