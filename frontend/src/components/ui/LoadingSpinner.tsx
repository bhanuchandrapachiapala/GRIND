import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 32, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="block rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan"
        style={{ width: size, height: size, boxShadow: '0 0 10px #00ffff40' }}
      />
    </div>
  );
}
