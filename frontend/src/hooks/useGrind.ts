import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { today } from '../lib/utils';
import type { AwsTopic, GrindLog, GymExercise } from '../types';

export const grindLogKey = (date: string) => ['grind-log', date] as const;
export const gymKey = ['gym', 'today'] as const;
export const awsKey = ['aws-topics'] as const;

export function useGrindLog(date: string = today()) {
  return useQuery<GrindLog | null>({
    queryKey: grindLogKey(date),
    queryFn: () => api.get<GrindLog | null>(`/api/grind/log?date=${date}`),
  });
}

export function useUpsertGrindLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Partial<Omit<GrindLog, 'id'>> & { date: string },
    ) => api.post<GrindLog>('/api/grind/log', data),
    onSuccess: (data) => {
      qc.setQueryData(grindLogKey(data.date), data);
      qc.invalidateQueries({ queryKey: ['leetcode-insights'] });
    },
  });
}

export function useGymList() {
  return useQuery<GymExercise[]>({
    queryKey: gymKey,
    queryFn: () => api.get<GymExercise[]>('/api/grind/gym'),
  });
}

export function useToggleGym() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ exercise_id, completed }: { exercise_id: number; completed: boolean }) =>
      api.post<{ success: boolean; completed: boolean }>('/api/grind/gym/toggle', {
        exercise_id,
        date: today(),
        completed,
      }),
    onMutate: async ({ exercise_id, completed }) => {
      await qc.cancelQueries({ queryKey: gymKey });
      const prev = qc.getQueryData<GymExercise[]>(gymKey) || [];
      qc.setQueryData<GymExercise[]>(
        gymKey,
        prev.map((e) => (e.id === exercise_id ? { ...e, completed_today: completed } : e)),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(gymKey, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: gymKey }),
  });
}

export interface GymExerciseRow {
  id: number;
  name: string;
  category: 'cardio' | 'strength' | 'core' | 'supplement';
  sort_order: number;
  is_active: boolean;
}

export function useCreateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      category: GymExerciseRow['category'];
      sort_order?: number;
    }) => api.post<GymExerciseRow>('/api/grind/gym/exercises', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gymKey });
      qc.invalidateQueries({ queryKey: ['gym-insights'] });
    },
  });
}

export function useUpdateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        name?: string;
        category?: GymExerciseRow['category'];
        sort_order?: number;
      };
    }) => api.put<GymExerciseRow>(`/api/grind/gym/exercises/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gymKey });
      qc.invalidateQueries({ queryKey: ['gym-insights'] });
    },
  });
}

export function useDeleteExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.del<{ success: boolean }>(`/api/grind/gym/exercises/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gymKey });
      qc.invalidateQueries({ queryKey: ['gym-insights'] });
    },
  });
}

export function useAwsTopics() {
  return useQuery<AwsTopic[]>({
    queryKey: awsKey,
    queryFn: () => api.get<AwsTopic[]>('/api/grind/aws'),
  });
}

export function useToggleAws() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_completed }: { id: number; is_completed: boolean }) =>
      api.put<AwsTopic>(`/api/grind/aws/${id}`, { is_completed }),
    onMutate: async ({ id, is_completed }) => {
      await qc.cancelQueries({ queryKey: awsKey });
      const prev = qc.getQueryData<AwsTopic[]>(awsKey) || [];
      qc.setQueryData<AwsTopic[]>(
        awsKey,
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                is_completed,
                completed_at: is_completed ? new Date().toISOString() : null,
              }
            : t,
        ),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(awsKey, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: awsKey }),
  });
}
