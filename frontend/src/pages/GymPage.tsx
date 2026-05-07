import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { TopBar } from '../components/layout/TopBar';
import { PageWrapper } from '../components/layout/PageWrapper';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { GymChecklist } from '../components/grind/GymChecklist';
import { GymExerciseListItem } from '../components/gym/GymExerciseListItem';
import { GymExerciseFormSheet } from '../components/gym/GymExerciseFormSheet';
import { FABButton } from '../components/tasks/FABButton';
import { useDeleteExercise, useGymList } from '../hooks/useGrind';
import type { GymExercise } from '../types';

const SUB_TABS = [
  { key: 'today', label: 'Today' },
  { key: 'manage', label: 'Manage' },
] as const;

type SubTabKey = (typeof SUB_TABS)[number]['key'];

export function GymPage() {
  const [tab, setTab] = useState<SubTabKey>('today');
  return (
    <PageWrapper>
      <TopBar title="Gym" subtitle="Train. Recover. Repeat." />
      <div className="-mx-1 px-1 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {SUB_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
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
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-4 pt-1"
        >
          {tab === 'today' && <GymChecklist />}
          {tab === 'manage' && <ManageGymTab />}
        </motion.div>
      </AnimatePresence>
    </PageWrapper>
  );
}

function ManageGymTab() {
  const { data, isLoading } = useGymList();
  const del = useDeleteExercise();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<GymExercise | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GymExercise | null>(null);

  const exercises = (data ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);

  const openAdd = () => {
    setEditing(null);
    setSheetOpen(true);
  };
  const openEdit = (e: GymExercise) => {
    setEditing(e);
    setSheetOpen(true);
  };

  return (
    <>
      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : exercises.length === 0 ? (
        <EmptyState
          title="No exercises yet"
          description="Tap + to add your first gym exercise."
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {exercises.map((e) => (
              <GymExerciseListItem
                key={e.id}
                exercise={e}
                onEdit={() => openEdit(e)}
                onDelete={() => setDeleteTarget(e)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <FABButton onClick={openAdd} label="Add exercise" />
      <GymExerciseFormSheet
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
            onSuccess: () => toast.success('Exercise deleted'),
            onError: (err) => toast.error((err as Error).message),
          });
        }}
        title="Delete exercise?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" will be removed along with all its completion history.`
            : ''
        }
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}
