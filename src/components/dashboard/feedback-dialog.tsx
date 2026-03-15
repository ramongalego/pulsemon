'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Bug, Lightbulb, LifeBuoy } from 'lucide-react';

const TYPES = [
  { value: 'feedback' as const, label: 'Feedback', icon: Lightbulb },
  { value: 'bug' as const, label: 'Bug Report', icon: Bug },
  { value: 'support' as const, label: 'Support', icon: LifeBuoy },
];

type FeedbackType = (typeof TYPES)[number]['value'];

export function FeedbackDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [type, setType] = useState<FeedbackType>('feedback');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  function reset() {
    setType('feedback');
    setMessage('');
  }

  async function handleSubmit() {
    if (message.trim().length < 10) {
      toast.error('Message must be at least 10 characters');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message: message.trim() }),
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message);
        return;
      }
      toast.success('Thanks for your feedback!');
      reset();
      onOpenChange(false);
    } catch {
      toast.error('Failed to send feedback');
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Let us know how we can improve PulseMon.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                    type === t.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground hover:bg-accent border-input',
                  )}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="feedback-message">Message</Label>
              <span className="text-muted-foreground text-xs">
                {message.length}/2000
              </span>
            </div>
            <Textarea
              id="feedback-message"
              className="field-sizing-fixed"
              placeholder="Tell us what's on your mind..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={2000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={sending || message.trim().length < 10}
          >
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
