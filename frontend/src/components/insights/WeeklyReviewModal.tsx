import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Minus, X } from 'lucide-react';
import { format } from 'date-fns';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useWeeklyReview } from '../../hooks/useWeeklyReview';
import type { HabitChange, WeeklyReview } from '../../types';

interface WeeklyReviewModalProps {
  open: boolean;
  weekStart: string;
  onClose: () => void;
}

export function WeeklyReviewModal({
  open,
  weekStart,
  onClose,
}: WeeklyReviewModalProps) {
  const { data, isLoading } = useWeeklyReview(weekStart, open);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 280 }}
            className="fixed inset-x-0 bottom-0 top-4 z-[71] bg-bg-base border-t border-neon-cyan/20 rounded-t-3xl flex flex-col"
          >
            <div className="flex justify-center pt-3 pb-1">
              <span className="h-1 w-10 rounded-full bg-white/20" />
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-8">
              {isLoading || !data ? (
                <div className="py-24">
                  <LoadingSpinner />
                </div>
              ) : (
                <ReviewContent data={data} onClose={onClose} />
              )}
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/5 border border-white/10 hover:border-neon-cyan/40 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ReviewContent({
  data,
  onClose,
}: {
  data: WeeklyReview;
  onClose: () => void;
}) {
  const start = format(new Date(data.week_start), 'MMM d');
  const end = format(new Date(data.week_end), 'MMM d');
  const delta = data.pct_change;
  const deltaColor =
    delta > 0
      ? 'text-neon-green'
      : delta < 0
        ? 'text-neon-red'
        : 'text-text-secondary';
  const DeltaIcon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;

  return (
    <div className="space-y-5 pt-2">
      <header>
        <p className="text-[10px] uppercase tracking-widest text-text-secondary font-semibold">
          Weekly Review
        </p>
        <h2 className="text-2xl font-extrabold tracking-tight neon-text mt-1">
          Week of {start}–{end}
        </h2>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <ScoreCell label="This Week" value={data.this_week_avg_pct} highlight />
        <ScoreCell label="Last Week" value={data.last_week_avg_pct} />
      </section>
      <div
        className={`flex items-center justify-center gap-2 text-sm font-bold ${deltaColor}`}
      >
        <DeltaIcon size={16} />
        <span>
          {delta > 0 ? '+' : ''}
          {delta.toFixed(0)}% vs last week
        </span>
      </div>

      {data.best_day && data.worst_day && (
        <section className="grid grid-cols-2 gap-3">
          <DayCell label="Best Day" date={data.best_day.date} pct={data.best_day.pct} good />
          <DayCell
            label="Worst Day"
            date={data.worst_day.date}
            pct={data.worst_day.pct}
          />
        </section>
      )}

      <section>
        <h3 className="text-xs uppercase tracking-widest text-text-secondary mb-2 font-semibold">
          Most Improved
        </h3>
        <ChangeList items={data.most_improved_habits} positive />
      </section>

      <section>
        <h3 className="text-xs uppercase tracking-widest text-text-secondary mb-2 font-semibold">
          Dropped Off
        </h3>
        <ChangeList items={data.most_dropped_habits} positive={false} />
      </section>

      <section className="flex flex-wrap gap-2">
        <Pill emoji="🧩" label={`${data.total_leetcode} LeetCode`} />
        <Pill emoji="📨" label={`${data.total_applications} Apps`} />
        <Pill emoji="💪" label={`${data.gym_sessions} Gym Sessions`} />
      </section>

      <section className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-neon-cyan/15 via-purple-500/10 to-transparent border border-neon-cyan/20">
        <span className="text-2xl">🔥</span>
        <p className="text-sm font-semibold">
          Streak:{' '}
          <span className="text-neon-cyan">
            {data.streak_at_end_of_week} days
          </span>
        </p>
      </section>

      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 text-bg-base font-bold py-3 shadow-neon glow-pulse"
      >
        Got it, let's crush this week
      </button>
    </div>
  );
}

function ScoreCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 text-center ${
        highlight
          ? 'bg-neon-cyan/10 border-neon-cyan/40 shadow-neon-sm'
          : 'glass-bg glass-border'
      }`}
    >
      <p className="text-[10px] uppercase tracking-widest text-text-secondary font-semibold mb-1">
        {label}
      </p>
      <div className="text-3xl font-extrabold">
        <AnimatedNumber value={Math.round(value)} className="" />
        <span className="text-text-secondary text-base">%</span>
      </div>
    </div>
  );
}

function DayCell({
  label,
  date,
  pct,
  good,
}: {
  label: string;
  date: string;
  pct: number;
  good?: boolean;
}) {
  return (
    <div className="rounded-2xl glass-bg border glass-border p-3">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary font-semibold">
        {label}
      </p>
      <p className="text-sm font-semibold mt-1">
        {format(new Date(date), 'EEE, MMM d')}
      </p>
      <p
        className={`text-lg font-extrabold ${
          good ? 'text-neon-green' : 'text-neon-red'
        }`}
      >
        {pct.toFixed(0)}%
      </p>
    </div>
  );
}

function ChangeList({
  items,
  positive,
}: {
  items: HabitChange[];
  positive: boolean;
}) {
  if (items.length === 0)
    return (
      <p className="text-xs text-text-secondary italic px-1">
        Nothing notable.
      </p>
    );
  return (
    <ul className="space-y-2">
      {items.map((h, i) => (
        <motion.li
          key={h.habit_id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl row-bg border row-border"
        >
          {positive ? (
            <ArrowUp size={14} className="text-neon-green" />
          ) : (
            <ArrowDown size={14} className="text-neon-red" />
          )}
          <span className="flex-1 text-sm font-medium truncate">{h.name}</span>
          <span
            className={`text-xs font-mono ${
              positive ? 'text-neon-green' : 'text-neon-red'
            }`}
          >
            {h.change > 0 ? '+' : ''}
            {h.change.toFixed(0)}%
          </span>
        </motion.li>
      ))}
    </ul>
  );
}

function Pill({ emoji, label }: { emoji: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-xs font-semibold text-neon-cyan">
      <span>{emoji}</span>
      {label}
    </span>
  );
}
