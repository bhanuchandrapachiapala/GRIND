import { Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  title: string;
  subtitle?: string;
  showSettings?: boolean;
  right?: React.ReactNode;
  subtitleAbove?: boolean;
}

export function TopBar({
  title,
  subtitle,
  showSettings = true,
  right,
  subtitleAbove = false,
}: TopBarProps) {
  const navigate = useNavigate();
  const titleEl = (
    <h1 className="text-xl font-bold tracking-tight">{title}</h1>
  );
  const subtitleEl = subtitle ? (
    <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>
  ) : null;
  return (
    <header className="flex items-center justify-between px-5 pt-6 pb-3">
      <div>
        {subtitleAbove ? (
          <>
            {subtitleEl}
            <div className={subtitle ? 'mt-0.5' : ''}>{titleEl}</div>
          </>
        ) : (
          <>
            {titleEl}
            {subtitleEl}
          </>
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
