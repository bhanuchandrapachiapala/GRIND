import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, Calendar, Download, LogOut, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { TopBar } from '../components/layout/TopBar';
import { PageWrapper } from '../components/layout/PageWrapper';
import { GlassCard } from '../components/ui/GlassCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ThemeToggle } from '../components/settings/ThemeToggle';
import { WeeklyReviewModal } from '../components/insights/WeeklyReviewModal';
import { useSettings, useUpdateSetting } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { downloadJSON, today } from '../lib/utils';
import { currentWeekStart } from '../lib/week';
import {
  ensureServiceWorker,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeForPush,
  unsubscribeFromPush,
  type NotificationPermissionState,
} from '../lib/notifications';
import { useQueryClient } from '@tanstack/react-query';
import type { GrindLog, Habit, HabitCompletion } from '../types';

export function SettingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { data, isLoading } = useSettings();
  const update = useUpdateSetting();
  const qc = useQueryClient();
  const [resetOpen, setResetOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermissionState>(() =>
    getNotificationPermission(),
  );

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const threshold = parseInt(data?.streak_threshold ?? '70', 10);
  const notificationsEnabled = data?.notifications_enabled === 'true';
  const leadMinutes = parseInt(data?.notification_lead_minutes ?? '5', 10);

  const exportData = async () => {
    try {
      const [habits, completions, log] = await Promise.all([
        api.get<Habit[]>('/api/habits?include_paused=true'),
        api.get<HabitCompletion[]>(
          `/api/habits/completions/range?start_date=1970-01-01&end_date=${today()}`,
        ),
        api.get<GrindLog[]>(
          `/api/grind/log/range?start_date=1970-01-01&end_date=${today()}`,
        ),
      ]);
      downloadJSON(
        { exported_at: new Date().toISOString(), habits, completions, grind_log: log },
        `grind-export-${today()}.json`,
      );
      toast.success('Export ready');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const resetToday = async () => {
    try {
      const completions = await api.get<HabitCompletion[]>(
        `/api/habits/completions?date=${today()}`,
      );
      await Promise.all(
        completions.map((c) =>
          api.post('/api/habits/completions', {
            habit_id: c.habit_id,
            date: today(),
            completed: false,
          }),
        ),
      );
      qc.invalidateQueries({ queryKey: ['habit-completions', today()] });
      qc.invalidateQueries({ queryKey: ['streak'] });
      toast.success("Today's progress reset");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const enableNotifications = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result !== 'granted') {
      toast.error('Notifications permission denied');
      return;
    }
    const reg = await ensureServiceWorker();
    if (reg) await subscribeForPush(reg);
    update.mutate({ key: 'notifications_enabled', value: 'true' });
    toast.success('Notifications enabled');
  };

  const disableNotifications = async () => {
    await unsubscribeFromPush();
    update.mutate({ key: 'notifications_enabled', value: 'false' });
    toast.success('Notifications disabled');
  };

  const signOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <PageWrapper>
      <TopBar title="Settings" subtitle="Tune your grind" showSettings={false} />
      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <>
          <GlassCard>
            <ThemeToggle />
            <div className="h-px my-4 bg-white/5" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Streak Threshold</span>
              <span className="text-lg font-bold text-neon-cyan font-mono">
                {threshold}%
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={90}
              step={5}
              value={threshold}
              onChange={(e) =>
                update.mutate({ key: 'streak_threshold', value: e.target.value })
              }
              className="w-full accent-neon-cyan"
            />
            <p className="mt-2 text-xs text-text-secondary">
              A day counts toward your streak if you complete at least {threshold}% of your habits.
            </p>
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm uppercase tracking-widest text-text-secondary mb-3 font-semibold">
              Notifications
            </h3>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium">Habit reminders</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {permission === 'granted'
                    ? notificationsEnabled
                      ? 'On'
                      : 'Permission granted, currently off'
                    : permission === 'denied'
                      ? 'Denied — enable in browser settings'
                      : permission === 'unsupported'
                        ? 'Not supported on this device'
                        : 'Off'}
                </p>
              </div>
              {notificationsEnabled ? (
                <button
                  type="button"
                  onClick={disableNotifications}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold"
                >
                  <BellOff size={14} />
                  Turn off
                </button>
              ) : (
                <button
                  type="button"
                  onClick={enableNotifications}
                  disabled={permission === 'denied' || permission === 'unsupported'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neon-cyan/15 border border-neon-cyan/40 text-neon-cyan text-xs font-semibold disabled:opacity-40"
                >
                  <Bell size={14} />
                  Enable
                </button>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Lead time</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Notify {leadMinutes} min before each habit
                </p>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                step={5}
                value={leadMinutes}
                onChange={(e) =>
                  update.mutate({
                    key: 'notification_lead_minutes',
                    value: e.target.value,
                  })
                }
                className="w-32 accent-neon-cyan"
              />
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm uppercase tracking-widest text-text-secondary mb-3 font-semibold">
              Review
            </h3>
            <button
              type="button"
              onClick={() => setReviewOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg row-bg border row-border hover:border-neon-cyan/30 transition-colors text-left"
            >
              <Calendar size={18} className="text-neon-cyan" />
              <span className="text-sm font-medium">Open Weekly Review</span>
            </button>
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm uppercase tracking-widest text-text-secondary mb-3 font-semibold">
              Data
            </h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={exportData}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg row-bg border row-border hover:border-neon-cyan/30 transition-colors text-left"
              >
                <Download size={18} className="text-neon-cyan" />
                <span className="text-sm font-medium">Export Data</span>
              </button>
              <button
                type="button"
                onClick={() => setResetOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg row-bg border row-border hover:border-amber-400/30 transition-colors text-left"
              >
                <RotateCcw size={18} className="text-neon-amber" />
                <span className="text-sm font-medium">Reset Today's Progress</span>
              </button>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm uppercase tracking-widest text-text-secondary mb-3 font-semibold">
              Account
            </h3>
            <button
              type="button"
              onClick={signOut}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg row-bg border row-border hover:border-neon-red/30 transition-colors text-left"
            >
              <LogOut size={18} className="text-neon-red" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm uppercase tracking-widest text-text-secondary mb-2 font-semibold">
              About
            </h3>
            <p className="text-sm text-text-primary">GRIND v2.0.0</p>
            <p className="text-xs text-text-secondary mt-1">
              Built for Bhanu. Powered by discipline.
            </p>
          </GlassCard>
        </>
      )}

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={resetToday}
        title="Reset today's progress?"
        description="This clears every habit completion for today. The action cannot be undone."
        confirmLabel="Reset"
        destructive
      />

      <WeeklyReviewModal
        open={reviewOpen}
        weekStart={currentWeekStart()}
        onClose={() => setReviewOpen(false)}
      />
    </PageWrapper>
  );
}
