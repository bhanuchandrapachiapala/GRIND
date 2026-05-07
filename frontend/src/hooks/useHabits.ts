import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../lib/api';
import { today } from '../lib/utils';
import {
  clearScheduledNotifications,
  scheduleHabitNotifications,
} from '../lib/notifications';
import type {
  DailyCompletionSummary,
  Habit,
  HabitCompletion,
} from '../types';

export const habitsKey = (includePaused = false) =>
  ['habits', includePaused] as const;
export const completionsKey = (date: string) => ['habit-completions', date] as const;
export const completionsRangeKey = (start: string, end: string) =>
  ['habit-completions', 'range', start, end] as const;

export function useHabits(includePaused = false) {
  return useQuery<Habit[]>({
    queryKey: habitsKey(includePaused),
    queryFn: () =>
      api.get<Habit[]>(`/api/habits?include_paused=${includePaused}`),
  });
}

export function useTodayCompletions(date: string = today()) {
  return useQuery<HabitCompletion[]>({
    queryKey: completionsKey(date),
    queryFn: () => api.get<HabitCompletion[]>(`/api/habits/completions?date=${date}`),
  });
}

export function useCompletionsRange(start: string, end: string) {
  return useQuery<DailyCompletionSummary[]>({
    queryKey: completionsRangeKey(start, end),
    queryFn: () =>
      api.get<DailyCompletionSummary[]>(
        `/api/habits/completions/range?start_date=${start}&end_date=${end}`,
      ),
  });
}

export function useToggleCompletion(date: string = today()) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ habit_id, completed }: { habit_id: number; completed: boolean }) =>
      api.post<{ success: boolean; completed: boolean }>(
        '/api/habits/completions',
        { habit_id, date, completed },
      ),
    onMutate: async ({ habit_id, completed }) => {
      await qc.cancelQueries({ queryKey: completionsKey(date) });
      const prev = qc.getQueryData<HabitCompletion[]>(completionsKey(date)) || [];
      const habits = qc.getQueryData<Habit[]>(habitsKey()) || [];
      const habit = habits.find((h) => h.id === habit_id);
      const next: HabitCompletion[] = completed
        ? [
            ...prev.filter((c) => c.habit_id !== habit_id),
            {
              id: -Date.now(),
              habit_id,
              habit_name: habit?.name ?? '',
              date,
              completed_at: new Date().toISOString(),
            },
          ]
        : prev.filter((c) => c.habit_id !== habit_id);
      qc.setQueryData(completionsKey(date), next);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(completionsKey(date), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: completionsKey(date) });
      qc.invalidateQueries({ queryKey: ['streak'] });
    },
  });
}

const HABITS_ROOT_KEY = ['habits'] as const;

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; scheduled_time: string; category?: string }) =>
      api.post<Habit>('/api/habits', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: HABITS_ROOT_KEY }),
  });
}

export interface HabitUpdatePayload {
  name?: string;
  scheduled_time?: string;
  category?: string;
  is_paused?: boolean;
  sort_order?: number;
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: HabitUpdatePayload }) =>
      api.put<Habit>(`/api/habits/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: HABITS_ROOT_KEY }),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del<{ success: boolean }>(`/api/habits/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: HABITS_ROOT_KEY }),
  });
}

function applyPauseOptimistic(
  qc: ReturnType<typeof useQueryClient>,
  id: number,
  is_paused: boolean,
) {
  // Update both cached variants of the habits query
  for (const includePaused of [true, false]) {
    const key = habitsKey(includePaused);
    const prev = qc.getQueryData<Habit[]>(key);
    if (!prev) continue;
    const next = prev
      .map((h) => (h.id === id ? { ...h, is_paused } : h))
      // Hide newly-paused habit from the active-only variant
      .filter((h) => (includePaused ? true : !h.is_paused));
    qc.setQueryData<Habit[]>(key, next);
  }
}

export function usePauseHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.put<Habit>(`/api/habits/${id}`, { is_paused: true }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: HABITS_ROOT_KEY });
      const snapshots = {
        active: qc.getQueryData<Habit[]>(habitsKey(false)),
        all: qc.getQueryData<Habit[]>(habitsKey(true)),
      };
      applyPauseOptimistic(qc, id, true);
      return snapshots;
    },
    onError: (_e, _id, ctx) => {
      if (!ctx) return;
      if (ctx.active) qc.setQueryData(habitsKey(false), ctx.active);
      if (ctx.all) qc.setQueryData(habitsKey(true), ctx.all);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: HABITS_ROOT_KEY });
      qc.invalidateQueries({ queryKey: ['streak'] });
    },
  });
}

export function useResumeHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.put<Habit>(`/api/habits/${id}`, { is_paused: false }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: HABITS_ROOT_KEY });
      const snapshots = {
        active: qc.getQueryData<Habit[]>(habitsKey(false)),
        all: qc.getQueryData<Habit[]>(habitsKey(true)),
      };
      // Mark resumed in the all-variant; active-variant will refetch
      const all = qc.getQueryData<Habit[]>(habitsKey(true));
      if (all)
        qc.setQueryData<Habit[]>(
          habitsKey(true),
          all.map((h) => (h.id === id ? { ...h, is_paused: false } : h)),
        );
      return snapshots;
    },
    onError: (_e, _id, ctx) => {
      if (!ctx) return;
      if (ctx.active) qc.setQueryData(habitsKey(false), ctx.active);
      if (ctx.all) qc.setQueryData(habitsKey(true), ctx.all);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: HABITS_ROOT_KEY });
      qc.invalidateQueries({ queryKey: ['streak'] });
    },
  });
}

export function useHabitNotificationScheduler(
  habits: Habit[] | undefined,
  options: { enabled: boolean; leadMinutes: number },
) {
  useEffect(() => {
    if (!options.enabled || !habits) {
      clearScheduledNotifications();
      return;
    }
    scheduleHabitNotifications({ habits, leadMinutes: options.leadMinutes });
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        scheduleHabitNotifications({ habits, leadMinutes: options.leadMinutes });
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearScheduledNotifications();
    };
  }, [habits, options.enabled, options.leadMinutes]);
}

export function useReorderHabits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: number; sort_order: number }[]) => {
      // Send sequentially to avoid hammering Supabase
      for (const u of updates) {
        await api.put(`/api/habits/${u.id}`, { sort_order: u.sort_order });
      }
      return { count: updates.length };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: HABITS_ROOT_KEY }),
  });
}
