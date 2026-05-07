import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { today } from '../lib/utils';
import type { DailyNote, Mood } from '../types';

export const noteKey = (date: string) => ['daily-note', date] as const;
export const noteRangeKey = (start: string, end: string) =>
  ['daily-note', 'range', start, end] as const;

export function useNote(date: string = today()) {
  return useQuery<DailyNote | null>({
    queryKey: noteKey(date),
    queryFn: () => api.get<DailyNote | null>(`/api/notes?date=${date}`),
  });
}

export function useNoteRange(start: string, end: string, enabled = true) {
  return useQuery<DailyNote[]>({
    queryKey: noteRangeKey(start, end),
    queryFn: () =>
      api.get<DailyNote[]>(`/api/notes/range?start_date=${start}&end_date=${end}`),
    enabled,
  });
}

export function useUpsertNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { date: string; note: string; mood: Mood }) =>
      api.post<DailyNote>('/api/notes', data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: noteKey(data.date) });
      const prev = qc.getQueryData<DailyNote | null>(noteKey(data.date));
      const optimistic: DailyNote = {
        id: prev?.id ?? -Date.now(),
        date: data.date,
        note: data.note,
        mood: data.mood,
        created_at: prev?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      qc.setQueryData(noteKey(data.date), optimistic);
      return { prev };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(noteKey(vars.date), ctx.prev);
    },
    onSuccess: (saved) => {
      qc.setQueryData(noteKey(saved.date), saved);
      qc.invalidateQueries({ queryKey: ['daily-note', 'range'] });
    },
  });
}
