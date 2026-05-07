import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BottomSheet } from '../ui/BottomSheet';
import { NeonButton } from '../ui/NeonButton';
import { useCreateHabit, useUpdateHabit } from '../../hooks/useHabits';
import { getTimeCategory } from '../../lib/utils';
import type { CategoryName, Habit } from '../../types';

interface HabitFormSheetProps {
  open: boolean;
  onClose: () => void;
  initial?: Habit | null;
}

const CATEGORY_OPTIONS: { value: CategoryName; label: string }[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'night', label: 'Night' },
  { value: 'general', label: 'General' },
];

export function HabitFormSheet({ open, onClose, initial }: HabitFormSheetProps) {
  const [name, setName] = useState('');
  const [time, setTime] = useState('09:00');
  const [category, setCategory] = useState<CategoryName | 'auto'>('auto');

  const create = useCreateHabit();
  const update = useUpdateHabit();
  const isEdit = Boolean(initial);

  useEffect(() => {
    if (open) {
      if (initial) {
        setName(initial.name);
        setTime(initial.scheduled_time.slice(0, 5));
        setCategory(initial.category);
      } else {
        setName('');
        setTime('09:00');
        setCategory('auto');
      }
    }
  }, [open, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    const cat = category === 'auto' ? getTimeCategory(time) : category;
    try {
      if (initial) {
        await update.mutateAsync({
          id: initial.id,
          data: { name: name.trim(), scheduled_time: time, category: cat },
        });
        toast.success('Habit updated');
      } else {
        await create.mutateAsync({
          name: name.trim(),
          scheduled_time: time,
          category: cat,
        });
        toast.success('Habit added');
      }
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={isEdit ? 'Edit Habit' : 'New Habit'}>
      <form onSubmit={submit} className="space-y-4 pb-2">
        <label className="block">
          <span className="block text-xs uppercase tracking-widest text-text-secondary mb-1.5">
            Name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Morning Cardio"
            className="w-full bg-white/5 border border-white/10 focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/10 rounded-lg px-4 py-3 text-white outline-none"
            autoFocus
          />
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-widest text-text-secondary mb-1.5">
            Time
          </span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-white/5 border border-white/10 focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/10 rounded-lg px-4 py-3 text-white outline-none"
          />
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-widest text-text-secondary mb-1.5">
            Category
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryName | 'auto')}
            className="w-full bg-white/5 border border-white/10 focus:border-neon-cyan/50 rounded-lg px-4 py-3 text-white outline-none"
          >
            <option value="auto">Auto (from time)</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <div className="pt-2 flex flex-col gap-3">
          <NeonButton
            type="submit"
            variant="solid"
            fullWidth
            disabled={create.isPending || update.isPending}
          >
            {isEdit ? 'Save Habit' : 'Add Habit'}
          </NeonButton>
        </div>
      </form>
    </BottomSheet>
  );
}
