import { Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  title: string;
  subtitle?: string;
  showSettings?: boolean;
  right?: React.ReactNode;
}

export function TopBar({ title, subtitle, showSettings = true, right }: TopBarProps) {
  const navigate = useNavigate();
  return (
    <header className="flex items-center justify-between px-5 pt-6 pb-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {right}
        {showSettings && (
          <button
            type="button"
            onClick={() => navigate('/settings')}
            aria-label="Settings"
            className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:border-neon-cyan/40 transition-colors"
          >
            <SettingsIcon size={18} className="text-text-secondary" />
          </button>
        )}
      </div>
    </header>
  );
}
