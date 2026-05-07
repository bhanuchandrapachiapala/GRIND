import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EmptyState } from '../ui/EmptyState';
import { useNoteRange } from '../../hooks/useNotes';
import type { DailyNote, Mood } from '../../types';

const MOOD_EMOJI: Record<Mood, string> = {
  great: '😄',
  good: '🙂',
  neutral: '😐',
  tough: '😕',
  bad: '😞',
};

export function JournalTimeline() {
  const end = format(new Date(), 'yyyy-MM-dd');
  const start = format(subDays(new Date(), 29), 'yyyy-MM-dd');
  const { data, isLoading } = useNoteRange(start, end);

  if (isLoading) return <LoadingSpinner className="py-10" />;
  const filtered = (data ?? []).filter((n) => n.note.trim().length > 0);
  if (filtered.length === 0)
    return (
      <EmptyState
        title="No journal entries yet"
        description="Add a daily note from the Home page to start your timeline."
      />
    );

  return (
    <div className="space-y-3">
      {filtered.map((n, i) => (
        <motion.div
          key={n.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <JournalCard note={n} />
        </motion.div>
      ))}
    </div>
  );
}

function JournalCard({ note }: { note: DailyNote }) {
  const [expanded, setExpanded] = useState(false);
  const long = note.note.length > 180;

  return (
    <GlassCard animated={false} className="relative">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-text-secondary font-semibold">
            {format(new Date(note.date), 'EEE, MMM d')}
          </p>
        </div>
        <span className="text-xl leading-none" aria-label={note.mood}>
          {MOOD_EMOJI[note.mood] ?? '📝'}
        </span>
      </div>
      <p
        className={`text-sm text-text-primary whitespace-pre-wrap ${
          !expanded && long ? 'line-clamp-3' : ''
        }`}
      >
        {note.note}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-xs text-neon-cyan hover:underline"
        >
          {expanded ? 'Show less' : 'Show more'}
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      )}
    </GlassCard>
  );
}
