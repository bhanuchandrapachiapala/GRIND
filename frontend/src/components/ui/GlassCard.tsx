import { motion, type HTMLMotionProps } from 'framer-motion';
import { cardEntrance } from '../../lib/animations';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  animated?: boolean;
}

export function GlassCard({
  children,
  className = '',
  animated = true,
  ...rest
}: GlassCardProps) {
  const animProps = animated
    ? {
        initial: cardEntrance.initial,
        animate: cardEntrance.animate,
        transition: cardEntrance.transition,
      }
    : {};
  return (
    <motion.div
      {...animProps}
      {...rest}
      className={`glass-bg border glass-border rounded-card backdrop-blur-md p-4 ${className}`}
    >
      {children}
    </motion.div>
  );
}
