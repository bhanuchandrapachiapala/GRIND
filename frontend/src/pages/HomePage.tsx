import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { PageWrapper } from '../components/layout/PageWrapper';
import { GlassCard } from '../components/ui/GlassCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { StreakRing } from '../components/home/StreakRing';
import { TodayProgress } from '../components/home/TodayProgress';
import { TaskTimeGroup } from '../components/home/TaskTimeGroup';
import { MotivationalBanner } from '../components/home/MotivationalBanner';
import { DailyNoteWidget } from '../components/home/DailyNoteWidget';
import { MissedDayRecovery } from '../components/home/MissedDayRecovery';
import {
  useCompletionsRange,
  useHabits,
  useTodayCompletions,
  useToggleCompletion,
} from '../hooks/useHabits';
import { useStreak } from '../hooks/useInsights';
import { getGreeting, today, yesterday } from '../lib/utils';
import type { Habit } from '../types';

const TIME_GROUPS: {
  key: 'morning' | 'afternoon' | 'evening' | 'night';
  label: string;
}[] = [
  { key: 'morning', label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening' },
  { key: 'night', label: 'Night' },
];

export function HomePage() {
  const [selectedDate, setSelectedDate] = useState<string>(today());
  const isYesterdayMode = selectedDate !== today();

  const habitsQ = useHabits();
  const completionsQ = useTodayCompletions(selectedDate);
  const streakQ = useStreak();
  const toggle = useToggleCompletion(selectedDate);

  // Yesterday's summary — used to decide whether to show MissedDayRecovery
  const ystr = yesterday();
  const yesterdaySummary = useCompletionsRange(ystr, ystr);
  const yesterdayCompleted =
    (yesterdaySummary.data ?? []).find((d) => d.date === ystr)?.total_completed ?? 0;
  const showMissedBanner =
    !isYesterdayMode &&
    yesterdaySummary.isSuccess &&
    yesterdayCompleted === 0 &&
    (habitsQ.data?.length ?? 0) > 0;

  const completedSet = useMemo(
    () => new Set((completionsQ.data ?? []).map((c) => c.habit_id)),
    [completionsQ.data],
  );

  const habits = habitsQ.data ?? [];
  const totalHabits = habits.length;
  const completedCount = completedSet.size;

  const groups = useMemo(() => {
    const map: Record<string, Habit[]> = {
      morning: [],
      afternoon: [],
      evening: [],
      night: [],
      general: [],
    };
    habits.forEach((h) => {
      const key = h.category in map ? h.category : 'general';
      map[key].push(h);
    });
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time)),
    );
    return map;
  }, [habits]);

  const handleToggle = (h: Habit) => {
    toggle.mutate({ habit_id: h.id, completed: !completedSet.has(h.id) });
  };

  const isLoading =
    habitsQ.isLoading || completionsQ.isLoading || streakQ.isLoading;

  const titleText = isYesterdayMode
    ? `Logging: ${format(new Date(selectedDate), 'MMM d')}`
    : `${getGreeting()}, Bhanu 👋`;
  const subtitleText = isYesterdayMode
    ? 'Filling in yesterday'
    : format(new Date(), 'EEEE, MMM d');

  return (
    <PageWrapper>
      <TopBar
        title={titleText}
        subtitle={subtitleText}
        right={
          isYesterdayMode ? (
            <button
              type="button"
              onClick={() => setSelectedDate(today())}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-neon-cyan/15 border border-neon-cyan/40 text-neon-cyan text-xs font-semibold hover:bg-neon-cyan/25 transition-colors"
            >
              <ArrowLeft size={14} />
              Back to Today
            </button>
          ) : undefined
        }
      />

      {showMissedBanner && (
        <MissedDayRecovery
          yesterdayDate={ystr}
          onLogYesterday={() => setSelectedDate(ystr)}
        />
      )}

      {isLoading && !streakQ.data ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <>
          <GlassCard className="!p-3" animated>
            <StreakRing
              streak={streakQ.data?.current_streak ?? 0}
              todayPct={streakQ.data?.today_pct ?? 0}
              threshold={streakQ.data?.streak_threshold ?? 70}
            />
          </GlassCard>
          <GlassCard>
            <TodayProgress completed={completedCount} total={totalHabits} />
          </GlassCard>

          {!isYesterdayMode && <DailyNoteWidget date={selectedDate} />}

          <MotivationalBanner streak={streakQ.data?.current_streak ?? 0} />

          {totalHabits === 0 ? (
            <EmptyState
              title="No habits yet"
              description="Add your first habit on the Tasks tab."
            />
          ) : (
            <div className="space-y-5 pt-1">
              {TIME_GROUPS.map((g) => (
                <TaskTimeGroup
                  key={g.key}
                  label={g.label}
                  habits={groups[g.key] ?? []}
                  completedSet={completedSet}
                  onToggle={handleToggle}
                />
              ))}
              {(groups.general ?? []).length > 0 && (
                <TaskTimeGroup
                  label="General"
                  habits={groups.general}
                  completedSet={completedSet}
                  onToggle={handleToggle}
                />
              )}
            </div>
          )}
        </>
      )}
    </PageWrapper>
  );
}
