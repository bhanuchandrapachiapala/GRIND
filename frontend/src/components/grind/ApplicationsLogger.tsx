import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { useGrindLog, useUpsertGrindLog } from '../../hooks/useGrind';
import { api } from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
import { today } from '../../lib/utils';
import type { GrindLog } from '../../types';

export function ApplicationsLogger() {
  const date = today();
  const log = useGrindLog(date);
  const upsert = useUpsertGrindLog();
  const [count, setCount] = useState(0);

  const totalsQuery = useQuery({
    queryKey: ['applications-total'],
    queryFn: async () => {
      const start = '1970-01-01';
      const end = today();
      const rows = await api.get<GrindLog[]>(
        `/api/grind/log/range?start_date=${start}&end_date=${end}`,
      );
      return rows.reduce((sum, r) => sum + (r.applications || 0), 0);
    },
  });

  useEffect(() => {
    if (log.data) setCount(log.data.applications);
    else if (log.data === null) setCount(0);
  }, [log.data]);

  const save = async () => {
    try {
      await upsert.mutateAsync({
        date,
        leetcode_easy: log.data?.leetcode_easy ?? 0,
        leetcode_medium: log.data?.leetcode_medium ?? 0,
        leetcode_hard: log.data?.leetcode_hard ?? 0,
        applications: count,
      });
      totalsQuery.refetch();
      toast.success("Today's applications saved");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (log.isLoading) return <LoadingSpinner className="py-10" />;

  return (
    <div className="space-y-4">
      <GlassCard>
        <h3 className="text-sm uppercase tracking-widest text-text-secondary mb-3 font-semibold">
          Cumulative Total
        </h3>
        <div className="text-center">
          <AnimatedNumber
            value={totalsQuery.data ?? 0}
            className="block text-4xl font-extrabold text-neon-cyan neon-text"
          />
          <span className="text-xs text-text-secondary uppercase tracking-widest">
            applications submitted
          </span>
        </div>
      </GlassCard>
      <GlassCard>
        <h3 className="text-sm uppercase tracking-widest text-text-secondary mb-3 font-semibold">
          Today
        </h3>
        <div className="flex items-center justify-center gap-4 py-4">
          <button
            type="button"
            aria-label="Decrement"
            onClick={() => setCount((c) => Math.max(0, c - 1))}
            className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"
          >
            <Minus size={18} />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={count}
            onChange={(e) =>
              setCount(Math.max(0, parseInt(e.target.value || '0', 10)))
            }
            className="w-24 h-16 text-center bg-transparent text-4xl font-extrabold text-neon-cyan rounded-lg outline-none focus:ring-2 focus:ring-neon-cyan/30"
          />
          <button
            type="button"
            aria-label="Increment"
            onClick={() => setCount((c) => c + 1)}
            className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"
          >
            <Plus size={18} />
          </button>
        </div>
        <NeonButton
          variant="solid"
          fullWidth
          onClick={save}
          disabled={upsert.isPending}
        >
          Save Today's Applications
        </NeonButton>
      </GlassCard>
    </div>
  );
}
