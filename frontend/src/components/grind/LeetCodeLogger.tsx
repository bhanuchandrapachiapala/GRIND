import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { useGrindLog, useUpsertGrindLog } from '../../hooks/useGrind';
import { useLeetCodeInsights } from '../../hooks/useInsights';
import { LeetCodeProblemLogger } from './LeetCodeProblemLogger';
import { today } from '../../lib/utils';

type Difficulty = 'easy' | 'medium' | 'hard';

const ROWS: { key: Difficulty; label: string; color: string; dot: string }[] = [
  { key: 'easy', label: 'Easy', color: 'text-neon-green', dot: 'bg-neon-green' },
  { key: 'medium', label: 'Medium', color: 'text-neon-amber', dot: 'bg-neon-amber' },
  { key: 'hard', label: 'Hard', color: 'text-neon-red', dot: 'bg-neon-red' },
];

export function LeetCodeLogger() {
  const date = today();
  const log = useGrindLog(date);
  const totals = useLeetCodeInsights();
  const upsert = useUpsertGrindLog();

  const [easy, setEasy] = useState(0);
  const [medium, setMedium] = useState(0);
  const [hard, setHard] = useState(0);

  useEffect(() => {
    if (log.data) {
      setEasy(log.data.leetcode_easy);
      setMedium(log.data.leetcode_medium);
      setHard(log.data.leetcode_hard);
    } else if (log.data === null) {
      setEasy(0);
      setMedium(0);
      setHard(0);
    }
  }, [log.data]);

  const getValue = (k: Difficulty) =>
    k === 'easy' ? easy : k === 'medium' ? medium : hard;

  const setValue = (k: Difficulty, v: number) => {
    const clamped = Math.max(0, v);
    if (k === 'easy') setEasy(clamped);
    else if (k === 'medium') setMedium(clamped);
    else setHard(clamped);
  };

  const save = async () => {
    try {
      await upsert.mutateAsync({
        date,
        leetcode_easy: easy,
        leetcode_medium: medium,
        leetcode_hard: hard,
        applications: log.data?.applications ?? 0,
      });
      toast.success("Today's progress saved");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (log.isLoading) return <LoadingSpinner className="py-10" />;

  return (
    <div className="space-y-4">
      <GlassCard>
        <h3 className="text-sm uppercase tracking-widest text-text-secondary mb-3 font-semibold">
          Cumulative Totals
        </h3>
        <div className="grid grid-cols-4 gap-2 text-center">
          <Stat label="Easy" value={totals.data?.total_easy ?? 0} color="text-neon-green" />
          <Stat label="Medium" value={totals.data?.total_medium ?? 0} color="text-neon-amber" />
          <Stat label="Hard" value={totals.data?.total_hard ?? 0} color="text-neon-red" />
          <Stat label="Total" value={totals.data?.total_all ?? 0} color="text-neon-cyan" />
        </div>
      </GlassCard>
      <GlassCard>
        <h3 className="text-sm uppercase tracking-widest text-text-secondary mb-3 font-semibold">
          Today's Solved
        </h3>
        <div className="space-y-3">
          {ROWS.map((r) => (
            <motion.div
              key={r.key}
              layout
              className="flex items-center gap-3 px-3 py-3 rounded-xl row-bg border row-border"
            >
              <span className={`h-3 w-3 rounded-full ${r.dot}`} />
              <span className={`flex-1 text-sm font-medium ${r.color}`}>
                {r.label}
              </span>
              <button
                type="button"
                aria-label={`Decrement ${r.label}`}
                onClick={() => setValue(r.key, getValue(r.key) - 1)}
                className="h-11 w-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={getValue(r.key)}
                onChange={(e) =>
                  setValue(r.key, parseInt(e.target.value || '0', 10))
                }
                className="w-14 h-11 text-center bg-transparent text-xl font-bold rounded-lg outline-none focus:ring-2 focus:ring-neon-cyan/30"
              />
              <button
                type="button"
                aria-label={`Increment ${r.label}`}
                onClick={() => setValue(r.key, getValue(r.key) + 1)}
                className="h-11 w-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"
              >
                <Plus size={16} />
              </button>
            </motion.div>
          ))}
        </div>
        <div className="pt-4">
          <NeonButton
            variant="solid"
            fullWidth
            onClick={save}
            disabled={upsert.isPending}
          >
            Save Today's Progress
          </NeonButton>
        </div>
      </GlassCard>
      <LeetCodeProblemLogger />
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <AnimatedNumber value={value} className={`block text-2xl font-extrabold ${color}`} />
      <span className="text-[10px] uppercase tracking-widest text-text-secondary">
        {label}
      </span>
    </div>
  );
}
