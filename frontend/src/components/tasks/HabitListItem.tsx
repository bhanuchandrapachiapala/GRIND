import { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  GripVertical,
  MoreVertical,
  PauseCircle,
  Pencil,
  PlayCircle,
  Trash2,
} from 'lucide-react';
import { CategoryBadge } from '../ui/Badge';
import { formatTime } from '../../lib/utils';
import type { Habit } from '../../types';

interface HabitListItemProps {
  habit: Habit;
  onEdit: () => void;
  onDelete: () => void;
  onPause: () => void;
  onResume: () => void;
  reorderMode?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

export const HabitListItem = forwardRef<HTMLDivElement, HabitListItemProps>(
  function HabitListItem(
    {
      habit,
      onEdit,
      onDelete,
      onPause,
      onResume,
      reorderMode = false,
      dragHandleProps,
    },
    ref,
  ) {
    const [menuOpen, setMenuOpen] = useState(false);
    const isPaused = habit.is_paused;

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 8 }}
        className={`relative flex items-center gap-3 px-3 py-3 rounded-xl border ${
          isPaused
            ? 'bg-amber-500/5 border-amber-500/30'
            : 'row-bg row-border'
        }`}
      >
        {reorderMode && (
          <button
            type="button"
            aria-label="Drag to reorder"
            {...dragHandleProps}
            className="h-8 w-6 -ml-1 flex items-center justify-center text-text-secondary touch-none cursor-grab active:cursor-grabbing"
          >
            <GripVertical size={18} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={`text-sm font-medium truncate ${
                isPaused ? 'text-amber-200' : ''
              }`}
            >
              {habit.name}
            </p>
            {isPaused && (
              <span className="text-[10px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                Paused
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-mono text-text-secondary">
              {formatTime(habit.scheduled_time)}
            </span>
            <CategoryBadge category={habit.category} />
          </div>
        </div>

        {!reorderMode && isPaused && (
          <button
            type="button"
            onClick={onResume}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-200 text-xs font-semibold hover:bg-amber-500/25 transition-colors"
          >
            <PlayCircle size={14} />
            Resume
          </button>
        )}

        {!reorderMode && (
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Habit options"
            className="h-9 w-9 rounded-full hover:bg-white/5 flex items-center justify-center"
          >
            <MoreVertical size={18} className="text-text-secondary" />
          </button>
        )}
        {menuOpen && !reorderMode && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute right-2 top-12 z-10 min-w-[150px] rounded-xl bg-bg-elevated border border-neon-cyan/15 shadow-neon-sm overflow-hidden"
          >
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onEdit();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-white/5 text-left"
            >
              <Pencil size={14} className="text-neon-cyan" />
              Edit
            </button>
            {isPaused ? (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onResume();
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-white/5 text-left text-amber-200"
              >
                <PlayCircle size={14} />
                Resume
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onPause();
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-white/5 text-left text-amber-200"
              >
                <PauseCircle size={14} />
                Pause
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-white/5 text-left text-neon-red"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </motion.div>
        )}
      </motion.div>
    );
  },
);
