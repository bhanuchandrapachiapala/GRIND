import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  DailyCompletionSummary,
  DayOfWeekPoint,
  GymInsightRow,
  HabitConsistency,
  LeetCodeInsightsResponse,
  StreakInfo,
  TopHabitsResponse,
  WeeklyTrendPoint,
} from '../types';

export function useStreak() {
  return useQuery<StreakInfo>({
    queryKey: ['streak'],
    queryFn: () => api.get<StreakInfo>('/api/insights/streak'),
  });
}

export function useTopHabits(enabled = true) {
  return useQuery<TopHabitsResponse>({
    queryKey: ['top-habits'],
    queryFn: () => api.get<TopHabitsResponse>('/api/insights/top-habits'),
    enabled,
  });
}

export function useWeeklyTrend(enabled = true) {
  return useQuery<WeeklyTrendPoint[]>({
    queryKey: ['weekly-trend'],
    queryFn: () => api.get<WeeklyTrendPoint[]>('/api/insights/weekly-trend'),
    enabled,
  });
}

export function useDayOfWeek(enabled = true) {
  return useQuery<DayOfWeekPoint[]>({
    queryKey: ['day-of-week'],
    queryFn: () => api.get<DayOfWeekPoint[]>('/api/insights/day-of-week'),
    enabled,
  });
}

export function useConsistency(enabled = true) {
  return useQuery<HabitConsistency[]>({
    queryKey: ['consistency'],
    queryFn: () => api.get<HabitConsistency[]>('/api/insights/consistency'),
    enabled,
  });
}

export function useLeetCodeInsights(enabled = true) {
  return useQuery<LeetCodeInsightsResponse>({
    queryKey: ['leetcode-insights'],
    queryFn: () => api.get<LeetCodeInsightsResponse>('/api/insights/leetcode'),
    enabled,
  });
}

export function useGymInsights(enabled = true) {
  return useQuery<GymInsightRow[]>({
    queryKey: ['gym-insights'],
    queryFn: () => api.get<GymInsightRow[]>('/api/insights/gym'),
    enabled,
  });
}

export function useHeatmapRange(start: string, end: string, enabled = true) {
  return useQuery<DailyCompletionSummary[]>({
    queryKey: ['heatmap', start, end],
    queryFn: () =>
      api.get<DailyCompletionSummary[]>(
        `/api/habits/completions/range?start_date=${start}&end_date=${end}`,
      ),
    enabled,
  });
}
