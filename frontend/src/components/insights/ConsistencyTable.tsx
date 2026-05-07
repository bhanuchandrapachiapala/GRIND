import { motion } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EmptyState } from '../ui/EmptyState';
import { useConsistency } from '../../hooks/useInsights';

export function ConsistencyTable() {
  const { data, isLoading } = useConsistency();
  if (isLoading) return <LoadingSpinner className="py-10" />;
  if (!data || data.length === 0)
    return <EmptyState title="No habits tracked yet" />;

  return (
    <GlassCard className="!p-0 overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-3 text-[10px] uppercase tracking-widest text-text-secondary border-b border-white/5">
        <span>Habit</span>
        <span className="text-center">Done</span>
        <span className="text-center">Streak</span>
        <span className="text-center">Rate</span>
      </div>
      <div className="divide-y divide-white/5">
        {data.map((row, i) => (
          <motion.div
            key={row.habit_id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-3 items-center"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{row.name}</p>
              <p className="text-[10px] text-text-secondary">
                Best streak {row.best_streak}d
              </p>
            </div>
            <span className="text-sm font-mono text-text-primary text-center w-10">
              {row.total_completed}
            </span>
            <span className="text-sm font-mono text-neon-cyan text-center w-10">
              {row.current_streak}
            </span>
            <span
              className={`text-sm font-mono text-center w-12 ${
                row.completion_rate >= 70
                  ? 'text-neon-green'
                  : row.completion_rate >= 40
                    ? 'text-neon-amber'
                    : 'text-neon-red'
              }`}
            >
              {row.completion_rate.toFixed(0)}%
            </span>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
