import { motion } from 'framer-motion';
import { pageTransition } from '../../lib/animations';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function PageWrapper({ children, className = '' }: PageWrapperProps) {
  return (
    <motion.div
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
      transition={pageTransition.transition}
      className={`px-5 pb-8 space-y-4 ${className}`}
    >
      {children}
    </motion.div>
  );
}
