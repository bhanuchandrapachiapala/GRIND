import { motion, type HTMLMotionProps } from 'framer-motion';

interface NeonButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode;
  variant?: 'outline' | 'solid';
  fullWidth?: boolean;
  className?: string;
}

export function NeonButton({
  children,
  variant = 'outline',
  fullWidth = false,
  className = '',
  ...rest
}: NeonButtonProps) {
  const base =
    'rounded-full px-6 py-3 font-semibold transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const styles =
    variant === 'solid'
      ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-black font-bold shadow-neon glow-pulse'
      : 'bg-neon-cyan/10 border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/20 hover:shadow-neon';
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      type={rest.type ?? 'button'}
      {...rest}
      className={`${base} ${styles} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </motion.button>
  );
}
