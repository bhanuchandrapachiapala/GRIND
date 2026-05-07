import { format } from 'date-fns';

export const formatDate = (d: Date | string): string =>
  format(new Date(d as string), 'yyyy-MM-dd');

export const formatDisplay = (d: Date | string): string =>
  format(new Date(d as string), 'MMM d, yyyy');

export const formatTime = (t: string): string => {
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 || 12;
  return `${display}:${m} ${ampm}`;
};

export const getTimeCategory = (
  time: string,
): 'morning' | 'afternoon' | 'evening' | 'night' => {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

export const getMotivationalTagline = (streak: number): string => {
  if (streak === 0) return 'Every legend starts somewhere. Start today.';
  if (streak < 3) return "The fire is lit. Don't let it die.";
  if (streak < 7) return 'Momentum is building. Keep grinding.';
  if (streak < 14) return "One week in. You're becoming consistent.";
  if (streak < 30) return 'Two weeks strong. Habits are forming.';
  if (streak < 60) return "A month of discipline. You're different now.";
  return "You're built different. Keep going.";
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
};

export const today = (): string => formatDate(new Date());

export const yesterday = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDate(d);
};

export const isTimePast = (t: string): boolean => {
  const [h, m] = t.split(':').map((p) => parseInt(p, 10));
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  return now.getTime() > target.getTime();
};

export const categoryLabel = (cat: string): string =>
  cat.charAt(0).toUpperCase() + cat.slice(1);

export const categoryBadgeClass = (cat: string): string => {
  switch (cat) {
    case 'morning':
      return 'bg-amber-500/20 text-amber-300';
    case 'afternoon':
      return 'bg-cyan-500/20 text-cyan-300';
    case 'evening':
      return 'bg-purple-500/20 text-purple-300';
    case 'night':
      return 'bg-indigo-500/20 text-indigo-300';
    default:
      return 'bg-white/10 text-white/70';
  }
};

export const heatmapColor = (pct: number): string => {
  if (pct === 0) return '#1a1f2e';
  if (pct <= 30) return '#0d4f4f';
  if (pct <= 60) return '#0a9e9e';
  if (pct <= 89) return '#00d4d4';
  return '#00ffff';
};

export const downloadJSON = (data: unknown, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
