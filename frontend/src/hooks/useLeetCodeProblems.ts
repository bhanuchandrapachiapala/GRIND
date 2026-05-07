import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { today } from '../lib/utils';
import type { Difficulty, LeetCodeProblem } from '../types';

export const lcProblemsKey = (date: string) => ['lc-problems', date] as const;
export const lcAllProblemsKey = ['lc-problems', 'all'] as const;

export function useTodayProblems(date: string = today()) {
  return useQuery<LeetCodeProblem[]>({
    queryKey: lcProblemsKey(date),
    queryFn: () =>
      api.get<LeetCodeProblem[]>(`/api/grind/leetcode/problems?date=${date}`),
  });
}

export function useAllProblems(enabled = true) {
  return useQuery<LeetCodeProblem[]>({
    queryKey: lcAllProblemsKey,
    queryFn: () => api.get<LeetCodeProblem[]>('/api/grind/leetcode/problems/all'),
    enabled,
  });
}

export function useAddProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      date: string;
      problem_number: number;
      problem_name: string;
      difficulty: Difficulty;
    }) => api.post<LeetCodeProblem>('/api/grind/leetcode/problems', data),
    onSuccess: (problem) => {
      qc.invalidateQueries({ queryKey: lcProblemsKey(problem.date) });
      qc.invalidateQueries({ queryKey: lcAllProblemsKey });
    },
  });
}

export function useDeleteProblem(date?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.del<{ success: boolean }>(`/api/grind/leetcode/problems/${id}`),
    onMutate: async (id) => {
      const target = date ?? today();
      await qc.cancelQueries({ queryKey: lcProblemsKey(target) });
      const prev = qc.getQueryData<LeetCodeProblem[]>(lcProblemsKey(target)) || [];
      qc.setQueryData<LeetCodeProblem[]>(
        lcProblemsKey(target),
        prev.filter((p) => p.id !== id),
      );
      return { prev, target };
    },
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(lcProblemsKey(ctx.target), ctx.prev);
    },
    onSettled: (_d, _e, _v, ctx) => {
      if (ctx) qc.invalidateQueries({ queryKey: lcProblemsKey(ctx.target) });
      qc.invalidateQueries({ queryKey: lcAllProblemsKey });
    },
  });
}
