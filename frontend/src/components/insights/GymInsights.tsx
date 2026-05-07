import { motion } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EmptyState } from '../ui/EmptyState';
import { useGymInsights } from '../../hooks/useInsights';

const CATEGORY_COLORS: Record<string, string> = {
  cardio: '#ef4444',
  strength: '#00ffff',
  core: '#a855f7',
  supplement: '#22c55e',
};

export function GymInsights() {
  const { data, isLoading } = useGymInsights();
  if (isLoading) return <LoadingSpinner className="py-10" />;
  if (!data || data.length === 0)
    return <EmptyState title="No gym data yet" description="Log gym workouts on the Grind tab." />;

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <GlassCard>
      <h3 className="text-sm uppercase tracking-widest text-text-secondary mb-3 font-semibold">
        Last 30 Days — Per Exercise
      </h3>
      <div className="space-y-3">
        {data.map((row, i) => (
          <motion.div
            key={row.exercise_name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-text-primary">
                {row.exercise_name}
              </span>
              <span className="font-mono text-text-secondary">
                {row.count}×
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(row.count / max) * 100}%` }}
                transition={{ duration: 0.7, delay: 0.1 + i * 0.04 }}
                className="h-full rounded-full"
                style={{
                  backgroundColor: CATEGORY_COLORS[row.category] || '#00ffff',
                  boxShadow: `0 0 6px ${CATEGORY_COLORS[row.category] || '#00ffff'}66`,
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
