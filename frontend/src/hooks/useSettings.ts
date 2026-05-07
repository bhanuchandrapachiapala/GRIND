import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { AppSettings, ThemeMode } from '../types';

export const settingsKey = ['settings'] as const;
export const THEME_STORAGE_KEY = 'grind_theme';

export function applyThemeClass(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'light') root.classList.add('light');
  else root.classList.remove('light');
}

function readStoredTheme(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'dark';
  const v = localStorage.getItem(THEME_STORAGE_KEY);
  return v === 'light' ? 'light' : 'dark';
}

export function useSettings() {
  return useQuery<AppSettings>({
    queryKey: settingsKey,
    queryFn: () => api.get<AppSettings>('/api/settings'),
  });
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      api.put<{ key: string; value: string }>(`/api/settings/${key}`, { value }),
    onMutate: async ({ key, value }) => {
      await qc.cancelQueries({ queryKey: settingsKey });
      const prev = qc.getQueryData<AppSettings>(settingsKey);
      qc.setQueryData<AppSettings>(settingsKey, {
        ...(prev || ({} as AppSettings)),
        [key]: value,
      } as AppSettings);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(settingsKey, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: settingsKey });
      qc.invalidateQueries({ queryKey: ['streak'] });
    },
  });
}

export function useTheme(): ThemeMode {
  const { data } = useSettings();
  const [theme, setTheme] = useState<ThemeMode>(() => readStoredTheme());

  useEffect(() => {
    if (data?.theme === 'light' || data?.theme === 'dark') {
      setTheme(data.theme);
      localStorage.setItem(THEME_STORAGE_KEY, data.theme);
      applyThemeClass(data.theme);
    }
  }, [data?.theme]);

  return theme;
}

export function useUpdateTheme() {
  const qc = useQueryClient();
  const update = useUpdateSetting();
  return useCallback(
    (theme: ThemeMode) => {
      // Apply visual change instantly
      applyThemeClass(theme);
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      const prev = qc.getQueryData<AppSettings>(settingsKey);
      qc.setQueryData<AppSettings>(settingsKey, {
        ...(prev || ({} as AppSettings)),
        theme,
      } as AppSettings);
      // Persist to server
      update.mutate({ key: 'theme', value: theme });
    },
    [qc, update],
  );
}
