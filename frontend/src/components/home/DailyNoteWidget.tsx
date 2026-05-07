import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';
import { useNote, useUpsertNote } from '../../hooks/useNotes';
import type { Mood } from '../../types';

const MAX_LEN = 500;
const DEBOUNCE_MS = 1000;
const SAVED_FADE_MS = 1500;

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'tough', emoji: '😕', label: 'Tough' },
  { value: 'bad', emoji: '😞', label: 'Bad' },
];

interface DailyNoteWidgetProps {
  date: string;
}

export function DailyNoteWidget({ date }: DailyNoteWidgetProps) {
  const { data, isLoading } = useNote(date);
  const upsert = useUpsertNote();

  const [note, setNote] = useState('');
  const [mood, setMood] = useState<Mood>('neutral');
  const [showSaved, setShowSaved] = useState(false);
  const [focused, setFocused] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const debounceRef = useRef<number | null>(null);
  const fadeRef = useRef<number | null>(null);
  const lastSavedRef = useRef<{ note: string; mood: Mood } | null>(null);

  // Hydrate from server
  useEffect(() => {
    if (data) {
      setNote(data.note);
      setMood(data.mood);
      lastSavedRef.current = { note: data.note, mood: data.mood };
    } else if (data === null) {
      lastSavedRef.current = { note: '', mood: 'neutral' };
    }
  }, [data]);

  // Auto-resize
  useLayoutEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }, [note]);

  const triggerSavedFlash = useCallback(() => {
    if (fadeRef.current) window.clearTimeout(fadeRef.current);
    setShowSaved(true);
    fadeRef.current = window.setTimeout(() => setShowSaved(false), SAVED_FADE_MS);
  }, []);

  const scheduleSave = useCallback(
    (nextNote: string, nextMood: Mood) => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        const last = lastSavedRef.current;
        if (last && last.note === nextNote && last.mood === nextMood) return;
        upsert.mutate(
          { date, note: nextNote, mood: nextMood },
          {
            onSuccess: (saved) => {
              lastSavedRef.current = { note: saved.note, mood: saved.mood };
              triggerSavedFlash();
            },
          },
        );
      }, DEBOUNCE_MS);
    },
    [date, upsert, triggerSavedFlash],
  );

  useEffect(
    () => () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      if (fadeRef.current) window.clearTimeout(fadeRef.current);
    },
    [],
  );

  const onTextChange = (v: string) => {
    const clipped = v.slice(0, MAX_LEN);
    setNote(clipped);
    scheduleSave(clipped, mood);
  };

  const onMoodChange = (m: Mood) => {
    setMood(m);
    scheduleSave(note, m);
  };

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs uppercase tracking-widest text-text-secondary font-semibold">
          Daily Note
        </h3>
        <AnimatePresence>
          {showSaved && (
            <motion.span
              key="saved"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-[11px] font-semibold text-neon-cyan"
            >
              Saved ✓
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-between gap-1.5 mb-3">
        {MOODS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => onMoodChange(m.value)}
            aria-label={m.label}
            aria-pressed={mood === m.value}
            className={`h-10 w-10 flex items-center justify-center rounded-full text-lg transition-all ${
              mood === m.value
                ? 'bg-neon-cyan/15 ring-2 ring-neon-cyan shadow-neon-sm'
                : 'bg-white/5 border border-white/10'
            }`}
          >
            <motion.span
              animate={mood === m.value ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {m.emoji}
            </motion.span>
          </button>
        ))}
      </div>
      <textarea
        ref={taRef}
        value={note}
        onChange={(e) => onTextChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="How's today going? Wins, blockers, thoughts..."
        rows={1}
        disabled={isLoading}
        maxLength={MAX_LEN}
        className="w-full input-bg border input-border focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/10 rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none resize-none overflow-hidden"
        style={{ minHeight: 44 }}
      />
      <div className="flex justify-end mt-1">
        {(focused || note.length > 0) && (
          <span
            className={`text-[10px] font-mono ${
              note.length > MAX_LEN * 0.9
                ? 'text-neon-amber'
                : 'text-text-secondary'
            }`}
          >
            {note.length} / {MAX_LEN}
          </span>
        )}
      </div>
    </GlassCard>
  );
}
