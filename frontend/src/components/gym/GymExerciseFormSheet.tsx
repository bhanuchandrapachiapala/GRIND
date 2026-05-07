import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BottomSheet } from '../ui/BottomSheet';
import { NeonButton } from '../ui/NeonButton';
import { useCreateExercise, useUpdateExercise } from '../../hooks/useGrind';
import type { GymExercise } from '../../types';

type Category = 'cardio' | 'strength' | 'core' | 'supplement';

interface GymExerciseFormSheetProps {
  open: boolean;
  onClose: () => void;
  initial?: GymExercise | null;
}

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'cardio', label: 'Cardio' },
  { value: 'strength', label: 'Strength' },
  { value: 'core', label: 'Core' },
  { value: 'supplement', label: 'Supplement' },
];

export function GymExerciseFormSheet({
  open,
  onClose,
  initial,
}: GymExerciseFormSheetProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('strength');
  const [sortOrder, setSortOrder] = useState<number>(0);

  const create = useCreateExercise();
  const update = useUpdateExercise();
  const isEdit = Boolean(initial);

  useEffect(() => {
    if (open) {
      if (initial) {
        setName(initial.name);
        setCategory(initial.category);
        setSortOrder(initial.sort_order);
      } else {
        setName('');
        setCategory('strength');
        setSortOrder(0);
      }
    }
  }, [open, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      if (initial) {
        await update.mutateAsync({
          id: initial.id,
          data: {
            name: name.trim(),
            category,
            sort_order: sortOrder,
          },
        });
        toast.success('Exercise updated');
      } else {
        await create.mutateAsync({
          name: name.trim(),
          category,
          sort_order: sortOrder || undefined,
        });
        toast.success('Exercise added');
      }
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Exercise' : 'New Exercise'}
    >
      <form onSubmit={submit} className="space-y-4 pb-2">
        <label className="block">
          <span className="block text-xs uppercase tracking-widest text-text-secondary mb-1.5">
            Exercise Name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Deadlift"
            className="w-full bg-white/5 border border-white/10 focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/10 rounded-lg px-4 py-3 text-white outline-none"
            autoFocus
          />
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-widest text-text-secondary mb-1.5">
            Category
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full bg-white/5 border border-white/10 focus:border-neon-cyan/50 rounded-lg px-4 py-3 text-white outline-none"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-widest text-text-secondary mb-1.5">
            Sort Order
          </span>
          <input
            type="number"
            inputMode="numeric"
            value={sortOrder}
            min={0}
            onChange={(e) =>
              setSortOrder(parseInt(e.target.value || '0', 10) || 0)
            }
            className="w-full bg-white/5 border border-white/10 focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/10 rounded-lg px-4 py-3 text-white outline-none"
          />
          <span className="block text-[11px] text-text-secondary mt-1">
            Lower numbers appear first within the category.
          </span>
        </label>
        <div className="pt-2">
          <NeonButton
            type="submit"
            variant="solid"
            fullWidth
            disabled={create.isPending || update.isPending}
          >
            {isEdit ? 'Save Exercise' : 'Add Exercise'}
          </NeonButton>
        </div>
      </form>
    </BottomSheet>
  );
}
