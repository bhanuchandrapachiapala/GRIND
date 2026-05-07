import { motion } from 'framer-motion';
import { ProgressRing } from '../ui/ProgressRing';
import { AnimatedNumber } from '../ui/AnimatedNumber';

interface StreakRingProps {
  streak: number;
  todayPct: number;
  threshold: number;
}

export function StreakRing({ streak, todayPct, threshold }: StreakRingProps) {
  let color = '#6b7a99';
  if (streak > 0) color = '#22c55e';
  else if (todayPct > 0 && todayPct < threshold) color = '#f59e0b';

  return (
    <div className="flex items-center justify-center py-2">
      <ProgressRing progress={todayPct} color={color} size={272} stroke={14}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', damping: 14 }}
          className="flex flex-col items-center"
        >
          <span className="text-3xl">🔥</span>
          <AnimatedNumber
            value={streak}
            className="text-6xl font-extrabold leading-none mt-1 tracking-tight neon-text"
          />
          <span className="mt-1 text-sm text-text-secondary uppercase tracking-widest">
            day streak
          </span>
          <span className="mt-1 text-xs text-text-secondary">
            {todayPct.toFixed(0)}% today
          </span>
        </motion.div>
      </ProgressRing>
    </div>
  );
}
