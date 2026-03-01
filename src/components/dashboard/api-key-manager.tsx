'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CopyButton } from '@/components/dashboard/copy-button';
import { Key, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type ApiKeyItem = {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: Date | null;
  createdAt: Date;
};

export function ApiKeyManager({ initialKeys }: { initialKeys: ApiKeyItem[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate() {
    if (!newKeyName.trim()) return;
    setIsCreating(true);

    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message);
        return;
      }

      setCreatedKey(json.data.rawKey);
      setKeys((prev) => [
        ...prev,
        {
          id: json.data.id,
          name: json.data.name,
          keyPrefix: json.data.keyPrefix,
          lastUsedAt: null,
          createdAt: new Date(json.data.createdAt),
        },
      ]);
      setNewKeyName('');
    } catch {
      toast.error('Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(keyId: string) {
    setDeletingId(keyId);
    try {
      const res = await fetch(`/api/api-keys?id=${keyId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message);
        return;
      }
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
      toast.success('API key deleted');
    } catch {
      toast.error('Failed to delete API key');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Manage API keys for programmatic access to monitors
            </CardDescription>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setCreatedKey(null);
                setNewKeyName('');
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              {createdKey ? (
                <>
                  <DialogHeader>
                    <DialogTitle>API Key Created</DialogTitle>
                    <DialogDescription>
                      Copy this key now. You won&apos;t be able to see it again.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex items-center gap-2">
                    <pre className="bg-muted flex-1 overflow-x-auto rounded-lg p-3 text-sm">
                      <code>{createdKey}</code>
                    </pre>
                    <CopyButton text={createdKey} />
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setDialogOpen(false)}>Done</Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Create API Key</DialogTitle>
                    <DialogDescription>
                      Give your key a name so you can identify it later.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="key-name">Key Name</Label>
                    <Input
                      id="key-name"
                      placeholder="e.g. CI/CD Pipeline"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreate();
                      }}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleCreate}
                      disabled={isCreating || !newKeyName.trim()}
                    >
                      {isCreating ? 'Creating...' : 'Create Key'}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Key className="text-muted-foreground mb-3 h-8 w-8" />
            <p className="text-muted-foreground text-sm">
              No API keys yet. Create one to access the API programmatically.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <div>
                  <span className="text-sm font-medium">{key.name}</span>
                  <span className="text-muted-foreground ml-2 font-mono text-xs">
                    {key.keyPrefix}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-xs">
                    {key.lastUsedAt
                      ? `Used ${new Date(key.lastUsedAt).toLocaleDateString()}`
                      : 'Never used'}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground h-8 w-8 hover:text-red-600"
                    onClick={() => handleDelete(key.id)}
                    disabled={deletingId === key.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
