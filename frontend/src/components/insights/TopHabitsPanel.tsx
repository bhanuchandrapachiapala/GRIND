import { motion } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EmptyState } from '../ui/EmptyState';
import { useTopHabits } from '../../hooks/useInsights';

export function TopHabitsPanel() {
  const { data, isLoading } = useTopHabits();
  if (isLoading) return <LoadingSpinner className="py-10" />;
  if (!data || data.top5.length === 0)
    return <EmptyState title="No data yet" description="Track a few days to see your top habits." />;

  const max = Math.max(...data.top5.map((h) => h.completion_rate), 1);
  return (
    <GlassCard>
      <h3 className="text-sm uppercase tracking-widest text-text-secondary mb-3 font-semibold">
        Top 5 Habits — Last 30 Days
      </h3>
      <div className="space-y-3">
        {data.top5.map((h, i) => (
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
              <span className="text-neon-cyan font-mono">
                {h.completion_rate.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(h.completion_rate / max) * 100}%` }}
                transition={{ duration: 0.7, delay: 0.1 + i * 0.06 }}
                className="h-full bg-gradient-to-r from-cyan-400 to-teal-300"
                style={{ boxShadow: '0 0 8px rgba(0, 255, 255, 0.4)' }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
