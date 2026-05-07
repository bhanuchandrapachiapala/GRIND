import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { WeeklyReview } from '../types';

export const weeklyReviewKey = (weekStart: string) =>
  ['weekly-review', weekStart] as const;

export function useWeeklyReview(weekStart: string, enabled = true) {
  return useQuery<WeeklyReview>({
    queryKey: weeklyReviewKey(weekStart),
    queryFn: () =>
      api.get<WeeklyReview>(`/api/insights/weekly-review?week_start=${weekStart}`),
    enabled: enabled && Boolean(weekStart),
  });
}
