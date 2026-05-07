import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { formatTime, isTimePast } from '../../lib/utils';
import type { Habit } from '../../types';

interface HabitCheckRowProps {
  habit: Habit;
  completed: boolean;
  onToggle: () => void;
}

export function HabitCheckRow({ habit, completed, onToggle }: HabitCheckRowProps) {
  const past = isTimePast(habit.scheduled_time);
  const overdue = past && !completed;

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-colors ${
        completed
          ? 'bg-neon-cyan/[0.06] border-neon-cyan/30'
          : overdue
            ? 'bg-amber-500/5 border-amber-500/30'
            : 'row-bg row-border'
      }`}
    >
      <motion.span
        layout
        className={`relative h-7 w-7 flex-shrink-0 rounded-md flex items-center justify-center border-2 ${
          completed
            ? 'bg-neon-cyan border-neon-cyan'
            : 'border-white/30 bg-white/5'
        }`}
        animate={
          completed
            ? { scale: [1, 0.85, 1.05, 1], boxShadow: '0 0 10px #00ffff80' }
            : { scale: 1, boxShadow: '0 0 0px transparent' }
        }
        transition={{ duration: 0.3 }}
      >
        {completed && (
          <motion.span
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.05 }}
          >
            <Check size={16} strokeWidth={3} className="text-bg-base" />
          </motion.span>
        )}
      </motion.span>
      <span className="flex-1 text-left">
        <span
          className={`block text-sm font-medium ${
            completed
              ? 'text-text-secondary line-through'
              : 'text-text-primary'
          }`}
        >
          {habit.name}
        </span>
      </span>
      <span
        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
          completed
            ? 'bg-neon-cyan/10 text-neon-cyan'
            : overdue
              ? 'bg-amber-500/15 text-amber-300'
              : past
                ? 'bg-white/5 text-text-secondary'
                : 'bg-cyan-500/10 text-cyan-300'
        }`}
      >
        {formatTime(habit.scheduled_time)}
      </span>
    </motion.button>
  );
}
