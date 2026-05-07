import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { TasksPage } from './pages/TasksPage';
import { InsightsPage } from './pages/InsightsPage';
import { GrindPage } from './pages/GrindPage';
import { GymPage } from './pages/GymPage';
import { SettingsPage } from './pages/SettingsPage';
import { WeeklyReviewModal } from './components/insights/WeeklyReviewModal';
import { SESSION_KEY } from './hooks/useAuth';
import {
  useHabitNotificationScheduler,
  useHabits,
} from './hooks/useHabits';
import { useSettings, useTheme } from './hooks/useSettings';
import { currentWeekStart } from './lib/week';
import { today } from './lib/utils';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem(SESSION_KEY);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AuthedShellEffects() {
  // Theme is bound to user settings on every authed render.
  useTheme();

  const { data: settings } = useSettings();
  const { data: habits } = useHabits(false);

  const notifsEnabled = settings?.notifications_enabled === 'true';
  const leadMinutes = parseInt(settings?.notification_lead_minutes ?? '5', 10);
  useHabitNotificationScheduler(habits, {
    enabled: notifsEnabled,
    leadMinutes,
  });

  return null;
}

function WeeklyReviewAutoShow() {
  const [open, setOpen] = useState(false);
  const [weekStart] = useState(currentWeekStart());
  const dismissedKey = `grind_weekly_review_dismissed_${today()}`;

  useEffect(() => {
    const isSunday = new Date().getDay() === 0;
    if (!isSunday) return;
    if (localStorage.getItem(dismissedKey)) return;
    setOpen(true);
  }, [dismissedKey]);

  const close = () => {
    localStorage.setItem(dismissedKey, 'true');
    setOpen(false);
  };

  return (
    <WeeklyReviewModal open={open} weekStart={weekStart} onClose={close} />
  );
}

export default function App() {
  const location = useLocation();
  const isAuthed = Boolean(localStorage.getItem(SESSION_KEY));

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <RequireAuth>
                <>
                  <AuthedShellEffects />
                  <AppShell />
                </>
              </RequireAuth>
            }
          >
            <Route path="/" element={<HomePage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/grind" element={<GrindPage />} />
            <Route path="/gym" element={<GymPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      {isAuthed && <WeeklyReviewAutoShow />}
    </>
  );
}
