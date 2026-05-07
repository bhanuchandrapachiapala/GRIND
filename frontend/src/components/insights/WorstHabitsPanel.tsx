import { motion } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EmptyState } from '../ui/EmptyState';
import { useTopHabits } from '../../hooks/useInsights';

export function WorstHabitsPanel() {
  const { data, isLoading } = useTopHabits();
  if (isLoading) return <LoadingSpinner className="py-10" />;
  if (!data || data.bottom5.length === 0)
    return <EmptyState title="Nothing to show" description="Keep grinding to see weak spots." />;

  return (
    <GlassCard>
      <h3 className="text-sm uppercase tracking-widest text-text-secondary mb-3 font-semibold">
        Bottom 5 — Needs Attention
      </h3>
      <div className="space-y-3">
        {data.bottom5.map((h, i) => (
          <motion.div
            key={h.habit_id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium truncate pr-2 text-text-primary">
                {h.name}
              </span>
              <span className="text-neon-red font-mono">
                {h.completion_rate.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${h.completion_rate}%` }}
                transition={{ duration: 0.7, delay: 0.1 + i * 0.06 }}
                className="h-full bg-gradient-to-r from-red-500 to-amber-500"
                style={{ boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)' }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
