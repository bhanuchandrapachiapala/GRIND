import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { TopBar } from '../components/layout/TopBar';
import { PageWrapper } from '../components/layout/PageWrapper';
import { GlassCard } from '../components/ui/GlassCard';
import { HeatmapCalendar } from '../components/ui/HeatmapCalendar';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { TopHabitsPanel } from '../components/insights/TopHabitsPanel';
import { WorstHabitsPanel } from '../components/insights/WorstHabitsPanel';
import { WeeklyTrendChart } from '../components/insights/WeeklyTrendChart';
import { DayOfWeekChart } from '../components/insights/DayOfWeekChart';
import { ConsistencyTable } from '../components/insights/ConsistencyTable';
import { LeetCodeInsights } from '../components/insights/LeetCodeInsights';
import { GymInsights } from '../components/insights/GymInsights';
import { JournalTimeline } from '../components/insights/JournalTimeline';
import { useHeatmapRange } from '../hooks/useInsights';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'trends', label: 'Trends' },
  { key: 'consistency', label: 'Consistency' },
  { key: 'heatmap', label: 'Heatmap' },
  { key: 'leetcode', label: 'LeetCode' },
  { key: 'gym', label: 'Gym' },
  { key: 'journal', label: 'Journal' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function InsightsPage() {
  const [tab, setTab] = useState<TabKey>('overview');

  return (
    <PageWrapper>
      <TopBar title="Insights" subtitle="Understand your patterns" />
      <div className="-mx-1 px-1 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                tab === t.key
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-neon-sm'
                  : 'bg-white/5 text-text-secondary border border-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-4 pt-1"
        >
          {tab === 'overview' && (
            <>
              <TopHabitsPanel />
              <WorstHabitsPanel />
            </>
          )}
          {tab === 'trends' && (
            <>
              <WeeklyTrendChart />
              <DayOfWeekChart />
            </>
          )}
          {tab === 'consistency' && <ConsistencyTable />}
          {tab === 'heatmap' && <HeatmapTab />}
          {tab === 'leetcode' && <LeetCodeInsights />}
          {tab === 'gym' && <GymInsights />}
          {tab === 'journal' && <JournalTimeline />}
        </motion.div>
      </AnimatePresence>
    </PageWrapper>
  );
}

function HeatmapTab() {
  const end = format(new Date(), 'yyyy-MM-dd');
  const start = format(subDays(new Date(), 89), 'yyyy-MM-dd');
  const { data, isLoading } = useHeatmapRange(start, end);
  return (
    <GlassCard>
      <h3 className="text-sm uppercase tracking-widest text-text-secondary mb-3 font-semibold">
        90-Day Heatmap
      </h3>
      {isLoading ? (
        <LoadingSpinner className="py-10" />
      ) : (
        <HeatmapCalendar data={data ?? []} days={90} />
      )}
    </GlassCard>
  );
}
