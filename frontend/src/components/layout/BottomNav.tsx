import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart2,
  CheckSquare,
  Dumbbell,
  Home,
  Zap,
  type LucideIcon,
} from 'lucide-react';

type Tab = {
  label: string;
  to: string;
  icon: LucideIcon;
};

const tabs: Tab[] = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Tasks', to: '/tasks', icon: CheckSquare },
  { label: 'Insights', to: '/insights', icon: BarChart2 },
  { label: 'Grind', to: '/grind', icon: Zap },
  { label: 'Gym', to: '/gym', icon: Dumbbell },
];

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 h-20 bg-bg-base/95 backdrop-blur border-t border-neon-cyan/10 flex items-stretch z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2 h-full"
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="bottom-nav-dot"
                  className="absolute top-1 h-1.5 w-1.5 rounded-full bg-neon-cyan shadow-neon-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <tab.icon
                size={22}
                strokeWidth={isActive ? 2.4 : 1.8}
                className={isActive ? 'text-neon-cyan' : 'text-text-secondary'}
              />
              <span
                className={`text-xs font-medium tracking-wide ${
                  isActive ? 'text-neon-cyan' : 'text-text-secondary'
                }`}
                style={isActive ? { textShadow: '0 0 8px #00ffff80' } : undefined}
              >
                {tab.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
