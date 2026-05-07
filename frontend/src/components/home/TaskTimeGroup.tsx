import { motion } from 'framer-motion';
import { HabitCheckRow } from './HabitCheckRow';
import { staggerContainer } from '../../lib/animations';
import type { Habit } from '../../types';

interface TaskTimeGroupProps {
  label: string;
  habits: Habit[];
  completedSet: Set<number>;
  onToggle: (habit: Habit) => void;
}

export function TaskTimeGroup({
  label,
  habits,
  completedSet,
  onToggle,
}: TaskTimeGroupProps) {
  if (habits.length === 0) return null;
  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-xs uppercase tracking-widest text-text-secondary font-semibold">
          {label}
        </h3>
        <span className="text-[10px] text-text-secondary">
          {habits.filter((h) => completedSet.has(h.id)).length} / {habits.length}
        </span>
      </div>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-2"
      >
        {habits.map((h) => (
          <HabitCheckRow
            key={h.id}
            habit={h}
            completed={completedSet.has(h.id)}
            onToggle={() => onToggle(h)}
          />
        ))}
      </motion.div>
    </section>
  );
}
