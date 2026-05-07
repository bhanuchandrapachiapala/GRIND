import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme, useUpdateTheme } from '../../hooks/useSettings';

export function ThemeToggle() {
  const theme = useTheme();
  const setTheme = useUpdateTheme();
  const isLight = theme === 'light';

  const toggle = () => setTheme(isLight ? 'dark' : 'light');

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">Theme</p>
        <p className="text-xs text-text-secondary mt-0.5">
          {isLight ? 'Light mode' : 'Dark mode'}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isLight}
        aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
        onClick={toggle}
        className={`relative h-9 w-[72px] rounded-full border transition-colors ${
          isLight
            ? 'bg-neon-cyan/15 border-neon-cyan/40'
            : 'bg-white/5 border-white/10'
        }`}
      >
        <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-widest">
          <span className={isLight ? 'text-text-secondary' : 'text-neon-cyan'}>
            Dark
          </span>
          <span className={isLight ? 'text-neon-cyan' : 'text-text-secondary'}>
            Light
          </span>
        </div>
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 600, damping: 32 }}
          className="absolute top-1 h-7 w-7 rounded-full bg-bg-elevated shadow-neon-sm flex items-center justify-center"
          style={{ left: isLight ? 40 : 4 }}
        >
          {isLight ? (
            <Sun size={14} className="text-neon-amber" />
          ) : (
            <Moon size={14} className="text-neon-cyan" />
          )}
        </motion.span>
      </button>
    </div>
  );
}
