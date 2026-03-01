'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Monitor } from '@/lib/db/schema';
import type { Plan } from '@/types';
import { UpgradeButton } from '@/components/dashboard/upgrade-button';

type LinkedMonitor = {
  monitorId: string;
  displayName: string | null;
  sortOrder: number;
};

type ListItem = {
  monitorId: string;
  displayName: string;
  checked: boolean;
};

const STATUS_COLORS: Record<string, string> = {
  up: 'bg-green-500',
  down: 'bg-red-500',
  paused: 'bg-amber-500',
  new: 'bg-gray-400',
};

function SortableMonitorItem({
  item,
  monitor,
  atLimit,
  onToggle,
  onDisplayNameChange,
}: {
  item: ListItem;
  monitor: Monitor;
  atLimit: boolean;
  onToggle: (monitorId: string) => void;
  onDisplayNameChange: (monitorId: string, value: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.monitorId, disabled: !item.checked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border transition-colors ${
        item.checked
          ? 'border-primary/50 bg-primary/5'
          : atLimit
            ? 'opacity-50'
            : 'hover:bg-muted/50'
      } ${isDragging ? 'z-10 shadow-md' : ''}`}
    >
      {/* Main row: checkbox + name + badge */}
      <label className="flex cursor-pointer items-center gap-3 px-3 py-2">
        <input
          type="checkbox"
          checked={item.checked}
          onChange={() => onToggle(item.monitorId)}
          disabled={!item.checked && atLimit}
          className="accent-primary h-4 w-4"
        />
        <span
          className={`h-2 w-2 rounded-full ${STATUS_COLORS[monitor.status] ?? 'bg-gray-400'}`}
        />
        <span className="flex-1 text-sm font-medium">{monitor.name}</span>
        <Badge variant="outline" className="text-xs">
          {monitor.status}
        </Badge>
      </label>

      {/* Expanded row: drag handle + display name input */}
      {item.checked && (
        <div className="flex items-center gap-2 border-t border-dashed px-3 py-2">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground cursor-grab touch-none active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="text-muted-foreground shrink-0 text-xs">
            Public name:
          </span>
          <Input
            placeholder={monitor.name}
            value={item.displayName}
            onChange={(e) =>
              onDisplayNameChange(item.monitorId, e.target.value)
            }
            className="h-7 flex-1 text-xs"
          />
        </div>
      )}
    </div>
  );
}

export function StatusPageMonitorLinker({
  statusPageId,
  allMonitors,
  linkedMonitors: initialLinked,
  monitorLimit,
  currentPlan,
}: {
  statusPageId: string;
  allMonitors: Monitor[];
  linkedMonitors: LinkedMonitor[];
  monitorLimit: number;
  currentPlan: Plan;
}) {
  const router = useRouter();
  const monitorsById = new Map(allMonitors.map((m) => [m.id, m]));
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Build initial list: checked monitors first (in sort order), then unchecked
  const [items, setItems] = useState<ListItem[]>(() => {
    const linkedMap = new Map(initialLinked.map((m) => [m.monitorId, m]));
    const checked = [...initialLinked]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((m) => ({
        monitorId: m.monitorId,
        displayName: m.displayName ?? '',
        checked: true,
      }));
    const unchecked = allMonitors
      .filter((m) => !linkedMap.has(m.id))
      .map((m) => ({
        monitorId: m.id,
        displayName: '',
        checked: false,
      }));
    return [...checked, ...unchecked];
  });
  const [saving, setSaving] = useState(false);

  const checkedCount = items.filter((i) => i.checked).length;
  const atLimit = checkedCount >= monitorLimit;

  function handleToggle(monitorId: string) {
    setItems((prev) => {
      const item = prev.find((i) => i.monitorId === monitorId);
      if (!item) return prev;

      if (item.checked) {
        // Uncheck: move to end of list, clear display name
        const without = prev.filter((i) => i.monitorId !== monitorId);
        return [...without, { ...item, checked: false, displayName: '' }];
      } else {
        if (atLimit) return prev;
        // Check: move to end of checked section (before first unchecked)
        const without = prev.filter((i) => i.monitorId !== monitorId);
        const firstUncheckedIdx = without.findIndex((i) => !i.checked);
        const insertAt =
          firstUncheckedIdx === -1 ? without.length : firstUncheckedIdx;
        const next = [...without];
        next.splice(insertAt, 0, { ...item, checked: true });
        return next;
      }
    });
  }

  function handleDisplayNameChange(monitorId: string, value: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.monitorId === monitorId ? { ...i, displayName: value } : i,
      ),
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.monitorId === active.id);
      const newIndex = prev.findIndex((i) => i.monitorId === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const monitors = items
        .filter((i) => i.checked)
        .map((i, idx) => ({
          monitorId: i.monitorId,
          displayName: i.displayName.trim() || null,
          sortOrder: idx,
        }));

      const res = await fetch(`/api/status-pages/${statusPageId}/monitors`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monitors }),
      });

      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message);
        return;
      }

      toast.success('Monitors updated');
      router.refresh();
    } catch {
      toast.error('Failed to update monitors');
    } finally {
      setSaving(false);
    }
  }

  if (allMonitors.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No monitors created yet.{' '}
        <a href="/dashboard" className="text-primary underline">
          Create a monitor
        </a>{' '}
        first.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.monitorId)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((item) => {
              const monitor = monitorsById.get(item.monitorId);
              if (!monitor) return null;

              return (
                <SortableMonitorItem
                  key={item.monitorId}
                  item={item}
                  monitor={monitor}
                  atLimit={atLimit}
                  onToggle={handleToggle}
                  onDisplayNameChange={handleDisplayNameChange}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {atLimit && (
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground text-xs">
            Monitor limit reached.
          </p>
          <UpgradeButton currentPlan={currentPlan}>Upgrade</UpgradeButton>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} size="sm">
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Monitors'
        )}
      </Button>
    </div>
  );
}
