'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { PlanLimitDialog } from '@/components/dashboard/plan-limit-dialog';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function NewStatusPagePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallySet, setSlugManuallySet] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [planLimitMessage, setPlanLimitMessage] = useState<string | null>(null);

  const effectiveSlug = slugManuallySet ? slug : slugify(title);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/status-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: effectiveSlug,
          description: description || undefined,
        }),
      });

      const json = await res.json();
      if (json.error) {
        if (json.error.code === 'PLAN_LIMIT') {
          setPlanLimitMessage(json.error.message);
        } else if (json.error.code === 'SLUG_TAKEN') {
          toast.error('This slug is already taken. Try a different one.');
        } else {
          toast.error(json.error.message);
        }
        return;
      }

      toast.success('Status page created');
      router.push(`/dashboard/status-pages/${json.data.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/status-pages">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Create Status Page
          </h1>
          <p className="text-muted-foreground">
            Set up a public page to share your uptime with users
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Page Details</CardTitle>
          <CardDescription>
            Choose a title and URL for your status page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. Acme Corp Status"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="e.g. acme-corp"
                value={effectiveSlug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugManuallySet(true);
                }}
                required
              />
              {effectiveSlug && (
                <p className="text-muted-foreground text-xs">
                  Public URL:{' '}
                  <code className="bg-muted rounded px-1 py-0.5">
                    /status/{effectiveSlug}
                  </code>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description{' '}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="A brief description of what this page monitors"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !title || !effectiveSlug}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Status Page'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <PlanLimitDialog
        open={planLimitMessage !== null}
        onOpenChange={(open) => {
          if (!open) setPlanLimitMessage(null);
        }}
        message={planLimitMessage ?? ''}
      />
    </div>
  );
}
