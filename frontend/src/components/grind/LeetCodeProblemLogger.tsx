import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { GlassCard } from '../ui/GlassCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EmptyState } from '../ui/EmptyState';
import {
  useAddProblem,
  useDeleteProblem,
  useTodayProblems,
} from '../../hooks/useLeetCodeProblems';
import { today } from '../../lib/utils';
import type { Difficulty } from '../../types';

const DIFFICULTIES: {
  key: Difficulty;
  label: string;
  active: string;
  inactive: string;
  badge: string;
}[] = [
  {
    key: 'easy',
    label: 'Easy',
    active: 'bg-neon-green/20 border-neon-green text-neon-green',
    inactive: 'bg-white/5 border-white/10 text-text-secondary',
    badge: 'bg-neon-green/15 text-neon-green',
  },
  {
    key: 'medium',
    label: 'Medium',
    active: 'bg-neon-amber/20 border-neon-amber text-neon-amber',
    inactive: 'bg-white/5 border-white/10 text-text-secondary',
    badge: 'bg-neon-amber/15 text-neon-amber',
  },
  {
    key: 'hard',
    label: 'Hard',
    active: 'bg-neon-red/20 border-neon-red text-neon-red',
    inactive: 'bg-white/5 border-white/10 text-text-secondary',
    badge: 'bg-neon-red/15 text-neon-red',
  },
];

export function LeetCodeProblemLogger() {
  const date = today();
  const list = useTodayProblems(date);
  const add = useAddProblem();
  const del = useDeleteProblem(date);

  const [num, setNum] = useState<string>('');
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = parseInt(num, 10);
    if (!parsed || parsed < 1 || parsed > 9999) {
      setError('Problem number must be 1-9999');
      return;
    }
    if (!name.trim()) {
      setError('Problem name is required');
      return;
    }
    try {
      await add.mutateAsync({
        date,
        problem_number: parsed,
        problem_name: name.trim(),
        difficulty,
      });
      setNum('');
      setName('');
      setDifficulty('easy');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <GlassCard>
      <h3 className="text-sm uppercase tracking-widest text-text-secondary mb-3 font-semibold">
        Problems Solved Today
      </h3>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            value={num}
            onChange={(e) => setNum(e.target.value)}
            placeholder="#"
            min={1}
            max={9999}
            className="w-20 input-bg border input-border focus:border-neon-cyan/50 rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none text-center font-mono"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Problem name"
            maxLength={200}
            className="flex-1 input-bg border input-border focus:border-neon-cyan/50 rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none"
          />
        </div>
        <div className="flex gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setDifficulty(d.key)}
              className={`flex-1 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                difficulty === d.key ? d.active : d.inactive
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-neon-red"
          >
            {error}
          </motion.p>
        )}
        <button
          type="submit"
          disabled={add.isPending}
          className="w-full rounded-full py-2.5 bg-neon-cyan/10 border border-neon-cyan/40 text-neon-cyan text-sm font-semibold hover:bg-neon-cyan/20 hover:shadow-neon-sm transition-all disabled:opacity-50"
        >
          {add.isPending ? 'Logging…' : 'Add'}
        </button>
      </form>

      <div className="mt-4 pt-3 border-t border-white/5">
        {list.isLoading ? (
          <LoadingSpinner className="py-6" />
        ) : (list.data ?? []).length === 0 ? (
          <EmptyState
            title="No problems logged yet"
            description="Add your first solved problem above."
          />
        ) : (
          <ul className="space-y-2">
            <AnimatePresence>
              {(list.data ?? []).map((p) => {
                const diff = DIFFICULTIES.find((d) => d.key === p.difficulty);
                return (
                  <motion.li
                    key={p.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl row-bg border row-border"
                  >
                    <span className="font-mono text-xs text-text-secondary w-12 flex-shrink-0">
                      #{p.problem_number}
                    </span>
                    <span className="flex-1 text-sm font-medium truncate">
                      {p.problem_name}
                    </span>
                    <span
                      className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full ${
                        diff?.badge ?? 'bg-white/10 text-white'
                      }`}
                    >
                      {p.difficulty}
                    </span>
                    <button
                      type="button"
                      aria-label="Delete problem"
                      onClick={() =>
                        del.mutate(p.id, {
                          onError: (err) => toast.error((err as Error).message),
                        })
                      }
                      className="h-7 w-7 rounded-full hover:bg-neon-red/10 flex items-center justify-center text-text-secondary hover:text-neon-red transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </GlassCard>
  );
}
