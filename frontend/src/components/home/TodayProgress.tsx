import { motion } from 'framer-motion';

interface TodayProgressProps {
  completed: number;
  total: number;
}

export function TodayProgress({ completed, total }: TodayProgressProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">Today's Progress</span>
        <span className="font-semibold text-neon-cyan">
          {completed} / {total} habits done
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-teal-300"
          style={{ boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)' }}
        />
      </div>
    </div>
  );
}
