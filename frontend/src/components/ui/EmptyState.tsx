import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center text-center py-10 px-6 ${className}`}
    >
      <div className="h-14 w-14 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center mb-3">
        {icon ?? <Sparkles size={22} className="text-neon-cyan" />}
      </div>
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-text-secondary max-w-xs">{description}</p>
      )}
    </motion.div>
  );
}
