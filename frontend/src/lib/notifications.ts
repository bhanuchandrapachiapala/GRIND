/// <reference types="vite/client" />
// Local-only notification scheduling. Server-side Web Push would post to
// `/api/push/...` here — see `<<SERVER_PUSH_HOOK>>` below for the wiring point.
// <<SERVER_PUSH_HOOK>> e.g. await api.post('/api/push/subscribe', subscription)

import type { Habit } from '../types';

const SUBSCRIPTION_KEY = 'grind_push_subscription';

export type NotificationPermissionState =
  | 'default'
  | 'granted'
  | 'denied'
  | 'unsupported';

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  const result = await Notification.requestPermission();
  return result as NotificationPermissionState;
}

export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const reg =
      (await navigator.serviceWorker.getRegistration()) ??
      (await navigator.serviceWorker.register('/sw.js'));
    return reg;
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export async function subscribeForPush(
  reg: ServiceWorkerRegistration,
): Promise<PushSubscription | null> {
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!vapidKey) return null; // Skipping server-push subscription if no VAPID key configured.
  try {
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
    });
    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(sub.toJSON()));
    // <<SERVER_PUSH_HOOK>> e.g. await api.post('/api/push/subscribe', sub.toJSON())
    return sub;
  } catch {
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  localStorage.removeItem(SUBSCRIPTION_KEY);
  const reg = await ensureServiceWorker();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (sub) await sub.unsubscribe();
}

// ── In-page setTimeout scheduler ────────────────────────────────────────
// Works while the tab is open. For background/lock-screen alerts you need
// real Web Push from a server (wire at <<SERVER_PUSH_HOOK>> above).

let timers: number[] = [];

export function clearScheduledNotifications(): void {
  timers.forEach((id) => window.clearTimeout(id));
  timers = [];
}

interface ScheduleArgs {
  habits: Habit[];
  leadMinutes: number;
}

function nextDelayMs(scheduledTime: string, leadMinutes: number): number | null {
  const [h, m] = scheduledTime.split(':').map((p) => parseInt(p, 10));
  const target = new Date();
  target.setHours(h, m, 0, 0);
  const fireAt = target.getTime() - leadMinutes * 60_000;
  const delay = fireAt - Date.now();
  return delay > 0 ? delay : null;
}

async function showLocalNotification(title: string, body: string, tag: string) {
  const reg = await ensureServiceWorker();
  if (reg && Notification.permission === 'granted') {
    reg.active?.postMessage({
      type: 'showNotification',
      title,
      body,
      tag,
    });
    return;
  }
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body, tag, icon: '/favicon.ico' });
  }
}

export function scheduleHabitNotifications({
  habits,
  leadMinutes,
}: ScheduleArgs): void {
  clearScheduledNotifications();
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  habits
    .filter((h) => !h.is_paused && h.is_active)
    .forEach((h) => {
      const delay = nextDelayMs(h.scheduled_time, leadMinutes);
      if (delay === null) return;
      const id = window.setTimeout(() => {
        showLocalNotification('GRIND', `Time for: ${h.name}`, `habit-${h.id}`);
      }, delay);
      timers.push(id);
    });
}
