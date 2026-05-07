import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAwsTopics, useToggleAws } from '../../hooks/useGrind';
import type { AwsTopic } from '../../types';

export function AWSChecklist() {
  const { data, isLoading } = useAwsTopics();
  const toggle = useToggleAws();

  const grouped = useMemo(() => {
    const map = new Map<string, AwsTopic[]>();
    (data ?? []).forEach((t) => {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    });
    return Array.from(map.entries());
  }, [data]);

  if (isLoading) return <LoadingSpinner className="py-10" />;

  return (
    <div className="space-y-4">
      {grouped.map(([category, topics]) => {
        const done = topics.filter((t) => t.is_completed).length;
        const pct = (done / topics.length) * 100;
        return (
          <GlassCard key={category}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold tracking-tight text-neon-cyan">
                {category}
              </h3>
              <span className="text-[11px] font-mono text-text-secondary">
                {done}/{topics.length}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6 }}
                className="h-full bg-gradient-to-r from-cyan-400 to-teal-300"
                style={{ boxShadow: '0 0 6px rgba(0, 255, 255, 0.4)' }}
              />
            </div>
            <ul className="space-y-1">
              {topics.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() =>
                      toggle.mutate({ id: t.id, is_completed: !t.is_completed })
                    }
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <motion.span
                      animate={
                        t.is_completed
                          ? { scale: [1, 0.85, 1.05, 1] }
                          : { scale: 1 }
                      }
                      transition={{ duration: 0.3 }}
                      className={`relative h-5 w-5 rounded flex-shrink-0 flex items-center justify-center border-2 ${
                        t.is_completed
                          ? 'bg-neon-green border-neon-green'
                          : 'border-white/30 bg-white/5'
                      }`}
                    >
                      {t.is_completed && (
                        <Check size={12} strokeWidth={3} className="text-bg-base" />
                      )}
                    </motion.span>
                    <span
                      className={`flex-1 text-left text-sm ${
                        t.is_completed
                          ? 'text-text-secondary line-through'
                          : 'text-text-primary'
                      }`}
                    >
                      {t.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </GlassCard>
        );
      })}
    </div>
  );
}
