import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import toast from 'react-hot-toast';
import { TopBar } from '../components/layout/TopBar';
import { PageWrapper } from '../components/layout/PageWrapper';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { HabitListItem } from '../components/tasks/HabitListItem';
import { SortableHabitItem } from '../components/tasks/SortableHabitItem';
import { HabitFormSheet } from '../components/tasks/HabitFormSheet';
import { FABButton } from '../components/tasks/FABButton';
import {
  useDeleteHabit,
  useHabits,
  usePauseHabit,
  useReorderHabits,
  useResumeHabit,
} from '../hooks/useHabits';
import type { Habit } from '../types';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'morning', label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening' },
  { key: 'night', label: 'Night' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function TasksPage() {
  const { data, isLoading } = useHabits(true); // include_paused for management
  const del = useDeleteHabit();
  const pause = usePauseHabit();
  const resume = useResumeHabit();
  const reorder = useReorderHabits();

  const [tab, setTab] = useState<TabKey>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Habit | null>(null);
  const [reorderMode, setReorderMode] = useState(false);

  const all = useMemo(() => data ?? [], [data]);
  const active = useMemo(
    () =>
      all
        .filter((h) => !h.is_paused)
        .filter((h) => (tab === 'all' ? true : h.category === tab))
        .sort(
          (a, b) =>
            a.sort_order - b.sort_order ||
            a.scheduled_time.localeCompare(b.scheduled_time),
        ),
    [all, tab],
  );
  const paused = useMemo(
    () => all.filter((h) => h.is_paused).sort((a, b) => a.sort_order - b.sort_order),
    [all],
  );

  // Local list used while dragging for instant visual feedback
  const [localActive, setLocalActive] = useState<Habit[]>(active);
  useEffect(() => setLocalActive(active), [active]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active: dragged, over } = e;
    if (!over || dragged.id === over.id) return;
    const oldIndex = localActive.findIndex((h) => h.id === dragged.id);
    const newIndex = localActive.findIndex((h) => h.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(localActive, oldIndex, newIndex);
    setLocalActive(next);
    const updates = next.map((h, i) => ({ id: h.id, sort_order: i + 1 }));
    reorder.mutate(updates, {
      onSuccess: () => toast.success('Order saved'),
      onError: (err) => toast.error((err as Error).message),
    });
  };

  const openAdd = () => {
    setEditing(null);
    setSheetOpen(true);
  };
  const openEdit = (h: Habit) => {
    setEditing(h);
    setSheetOpen(true);
  };

  return (
    <PageWrapper>
      <TopBar
        title="Tasks"
        subtitle={`${active.length} active · ${paused.length} paused`}
        right={
          <button
            type="button"
            onClick={() => setReorderMode((v) => !v)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              reorderMode
                ? 'bg-neon-cyan text-bg-base shadow-neon-sm'
                : 'bg-white/5 border border-white/10 text-text-secondary'
            }`}
          >
            {reorderMode ? 'Done' : 'Reorder'}
          </button>
        }
      />

      {!reorderMode && (
        <div className="-mx-1 px-1 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  tab === t.key
                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-neon-sm'
                    : 'bg-white/5 text-text-secondary border border-white/10'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <>
          {localActive.length === 0 ? (
            <EmptyState
              title="No habits in this category"
              description="Tap + to add a habit."
            />
          ) : reorderMode ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={localActive.map((h) => h.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2 pt-2">
                  {localActive.map((h) => (
                    <SortableHabitItem
                      key={h.id}
                      habit={h}
                      reorderMode
                      onEdit={() => openEdit(h)}
                      onDelete={() => setDeleteTarget(h)}
                      onPause={() => pause.mutate(h.id)}
                      onResume={() => resume.mutate(h.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="space-y-2 pt-2">
              <AnimatePresence>
                {localActive.map((h) => (
                  <HabitListItem
                    key={h.id}
                    habit={h}
                    onEdit={() => openEdit(h)}
                    onDelete={() => setDeleteTarget(h)}
                    onPause={() =>
                      pause.mutate(h.id, {
                        onSuccess: () => toast.success(`Paused "${h.name}"`),
                        onError: (err) => toast.error((err as Error).message),
                      })
                    }
                    onResume={() => resume.mutate(h.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {paused.length > 0 && !reorderMode && (
            <section className="pt-2">
              <h3 className="text-xs uppercase tracking-widest text-amber-300/80 font-semibold px-1 mb-2">
                Paused — {paused.length}
              </h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {paused.map((h) => (
                    <HabitListItem
                      key={h.id}
                      habit={h}
                      onEdit={() => openEdit(h)}
                      onDelete={() => setDeleteTarget(h)}
                      onPause={() => pause.mutate(h.id)}
                      onResume={() =>
                        resume.mutate(h.id, {
                          onSuccess: () => toast.success(`Resumed "${h.name}"`),
                          onError: (err) => toast.error((err as Error).message),
                        })
                      }
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}
        </>
      )}

      {!reorderMode && <FABButton onClick={openAdd} />}
      <HabitFormSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        initial={editing}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          del.mutate(deleteTarget.id, {
            onSuccess: () => toast.success('Habit deleted'),
            onError: (err) => toast.error((err as Error).message),
          });
        }}
        title="Delete habit?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" will be hidden from your daily view.`
            : ''
        }
        confirmLabel="Delete"
        destructive
      />
    </PageWrapper>
  );
}
