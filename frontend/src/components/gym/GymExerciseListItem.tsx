import { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { categoryLabel } from '../../lib/utils';
import type { GymExercise } from '../../types';

interface GymExerciseListItemProps {
  exercise: GymExercise;
  onEdit: () => void;
  onDelete: () => void;
}

const CATEGORY_BADGE: Record<string, string> = {
  cardio: 'bg-red-500/20 text-red-300',
  strength: 'bg-cyan-500/20 text-cyan-300',
  core: 'bg-purple-500/20 text-purple-300',
  supplement: 'bg-green-500/20 text-green-300',
};

export function GymExerciseListItem({
  exercise,
  onEdit,
  onDelete,
}: GymExerciseListItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      className="relative flex items-center gap-3 px-3 py-3 rounded-xl row-bg border row-border"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{exercise.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge className={CATEGORY_BADGE[exercise.category] ?? 'bg-white/10 text-white/70'}>
            {categoryLabel(exercise.category)}
          </Badge>
          <span className="text-[10px] font-mono text-text-secondary">
            #{exercise.sort_order}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Exercise options"
        className="h-9 w-9 rounded-full hover:bg-white/5 flex items-center justify-center"
      >
        <MoreVertical size={18} className="text-text-secondary" />
      </button>
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute right-2 top-12 z-10 min-w-[140px] rounded-xl bg-bg-elevated border border-neon-cyan/15 shadow-neon-sm overflow-hidden"
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
}
