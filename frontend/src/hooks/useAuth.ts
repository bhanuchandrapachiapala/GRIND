import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

export const SESSION_KEY = 'grind_session';

export function useAuth() {
  const [isAuthed, setIsAuthed] = useState<boolean>(() =>
    Boolean(localStorage.getItem(SESSION_KEY)),
  );

  useEffect(() => {
    const handler = () => setIsAuthed(Boolean(localStorage.getItem(SESSION_KEY)));
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.post<{ success: boolean; token: string }>(
      '/api/auth/login',
      { username, password },
    );
    localStorage.setItem(SESSION_KEY, res.token);
    setIsAuthed(true);
    return res;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setIsAuthed(false);
  }, []);

  return { isAuthed, login, logout };
}
