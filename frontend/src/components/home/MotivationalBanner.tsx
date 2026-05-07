import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { getMotivationalTagline } from '../../lib/utils';

interface MotivationalBannerProps {
  streak: number;
}

export function MotivationalBanner({ streak }: MotivationalBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-neon-cyan/10 via-purple-500/5 to-transparent border border-neon-cyan/15"
    >
      <Flame size={18} className="text-neon-cyan" />
      <p className="text-sm font-medium text-text-primary">
        {getMotivationalTagline(streak)}
      </p>
    </motion.div>
  );
}
