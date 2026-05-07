import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useGymList, useToggleGym } from '../../hooks/useGrind';
import { categoryLabel } from '../../lib/utils';
import type { GymExercise } from '../../types';

const CATEGORY_COLORS: Record<string, string> = {
  cardio: 'text-neon-red',
  strength: 'text-neon-cyan',
  core: 'text-neon-purple',
  supplement: 'text-neon-green',
};

export function GymChecklist() {
  const { data, isLoading } = useGymList();
  const toggle = useToggleGym();

  const grouped = useMemo(() => {
    const map = new Map<string, GymExercise[]>();
    (data ?? []).forEach((e) => {
      const list = map.get(e.category) ?? [];
      list.push(e);
      map.set(e.category, list);
    });
    return Array.from(map.entries());
  }, [data]);

  if (isLoading) return <LoadingSpinner className="py-10" />;

  return (
    <div className="space-y-4">
      {grouped.map(([cat, items]) => {
        const done = items.filter((e) => e.completed_today).length;
        return (
          <GlassCard key={cat}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-sm font-bold tracking-tight ${CATEGORY_COLORS[cat] || 'text-neon-cyan'}`}>
                {categoryLabel(cat)}
              </h3>
              <span className="text-[11px] font-mono text-text-secondary">
                {done}/{items.length}
              </span>
            </div>
            <ul className="space-y-1">
              {items.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() =>
                      toggle.mutate({
                        exercise_id: e.id,
                        completed: !e.completed_today,
                      })
                    }
                    className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <motion.span
                      animate={
                        e.completed_today
                          ? {
                              scale: [1, 0.85, 1.05, 1],
                              boxShadow: '0 0 10px #00ffff80',
                            }
                          : { scale: 1, boxShadow: '0 0 0 transparent' }
                      }
                      transition={{ duration: 0.3 }}
                      className={`relative h-6 w-6 rounded-md flex-shrink-0 flex items-center justify-center border-2 ${
                        e.completed_today
                          ? 'bg-neon-cyan border-neon-cyan'
                          : 'border-white/30 bg-white/5'
                      }`}
                    >
                      {e.completed_today && (
                        <Check size={14} strokeWidth={3} className="text-bg-base" />
                      )}
                    </motion.span>
                    <span
                      className={`flex-1 text-left text-sm font-medium ${
                        e.completed_today
                          ? 'text-text-secondary line-through'
                          : 'text-text-primary'
                      }`}
                    >
                      {e.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </GlassCard>
        );
      })}
    </div>
  );
}
