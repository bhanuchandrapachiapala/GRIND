import { motion } from 'framer-motion';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface MissedDayRecoveryProps {
  yesterdayDate: string;
  onLogYesterday: () => void;
}

export function MissedDayRecovery({
  yesterdayDate,
  onLogYesterday,
}: MissedDayRecoveryProps) {
  const display = format(new Date(yesterdayDate), 'MMM d');
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative rounded-card border border-amber-500/40 bg-amber-500/10 backdrop-blur-md px-4 py-3 flex items-center gap-3"
    >
      <div className="h-9 w-9 flex-shrink-0 rounded-full bg-amber-500/20 flex items-center justify-center">
        <AlertCircle size={18} className="text-amber-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-100">
          You didn't log yesterday ({display}).
        </p>
        <p className="text-xs text-amber-200/80">Want to fill it in?</p>
      </div>
      <button
        type="button"
        onClick={onLogYesterday}
        className="flex items-center gap-1 px-3 py-2 rounded-full bg-amber-500/20 text-amber-100 text-xs font-semibold hover:bg-amber-500/30 transition-colors"
      >
        Log Yesterday
        <ArrowRight size={14} />
      </button>
    </motion.div>
  );
}
