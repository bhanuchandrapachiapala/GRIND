import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface FABButtonProps {
  onClick: () => void;
  label?: string;
}

export function FABButton({ onClick, label = 'Add habit' }: FABButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.93 }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 14 }}
      className="fixed right-5 z-40 h-14 w-14 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-bg-base shadow-neon-lg flex items-center justify-center"
      style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
    >
      <Plus size={26} strokeWidth={2.5} />
    </motion.button>
  );
}
