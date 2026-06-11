'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import type { StatusPage } from '@/lib/db/schema';
import { CopyButton } from '@/components/dashboard/copy-button';

export function StatusPageSettings({ statusPage }: { statusPage: StatusPage }) {
  const router = useRouter();
  const [title, setTitle] = useState(statusPage.title);
  const [slug, setSlug] = useState(statusPage.slug);
  const [description, setDescription] = useState(statusPage.description ?? '');
  const [isPublic, setIsPublic] = useState(statusPage.isPublic);
  const [showOverallUptime, setShowOverallUptime] = useState(
    statusPage.showOverallUptime,
  );
  const [showIncidentHistory, setShowIncidentHistory] = useState(
    statusPage.showIncidentHistory,
  );
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const publicUrl = `${appUrl}/status/${slug}`;

  async function handleSave() {
    setSaving(true);

    try {
      const body: Record<string, unknown> = {};
      if (title !== statusPage.title) body.title = title;
      if (slug !== statusPage.slug) body.slug = slug;
      if (description !== (statusPage.description ?? ''))
        body.description = description || null;
      if (isPublic !== statusPage.isPublic) body.isPublic = isPublic;
      if (showOverallUptime !== statusPage.showOverallUptime)
        body.showOverallUptime = showOverallUptime;
      if (showIncidentHistory !== statusPage.showIncidentHistory)
        body.showIncidentHistory = showIncidentHistory;

      if (Object.keys(body).length === 0) {
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/status-pages/${statusPage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (json.error) {
        if (json.error.code === 'SLUG_TAKEN') {
          toast.error('This slug is already taken. Try a different one.');
        } else {
          toast.error(json.error.message);
        }
        return;
      }

      toast.success('Changes saved');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/status-pages/${statusPage.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message);
        return;
      }
      toast.success('Status page deleted');
      router.push('/dashboard/status-pages');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sp-title">Title</Label>
          <Input
            id="sp-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sp-slug">Slug</Label>
          <Input
            id="sp-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          {slug !== statusPage.slug && (
            <p className="text-xs text-amber-600">
              Changing the slug will break existing links.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sp-description">Description</Label>
        <Textarea
          id="sp-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={500}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="sp-public">Public</Label>
          <Switch
            id="sp-public"
            checked={isPublic}
            onCheckedChange={setIsPublic}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="sp-uptime">Show overall uptime</Label>
          <Switch
            id="sp-uptime"
            checked={showOverallUptime}
            onCheckedChange={setShowOverallUptime}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="sp-incidents">Show incident history</Label>
          <Switch
            id="sp-incidents"
            checked={showIncidentHistory}
            onCheckedChange={setShowIncidentHistory}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Public URL</Label>
        <div className="flex items-center gap-2">
          <code className="bg-muted flex-1 truncate rounded px-2 py-1.5 text-xs">
            {publicUrl}
          </code>
          <CopyButton text={publicUrl} />
          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Open status page in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      <div className="border-destructive/20 mt-6 border-t pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Delete status page</p>
            <p className="text-muted-foreground text-sm">
              Permanently remove this status page.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {statusPage.title}?</DialogTitle>
            <DialogDescription>
              Are you sure? This will remove the public status page. Your
              monitors will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete status page'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
