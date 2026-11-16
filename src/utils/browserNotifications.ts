export type BrowserNotificationPermission = NotificationPermission | 'unsupported';

const PREF_STORAGE_KEY = 'autec-browser-notifs-enabled';

export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getBrowserNotificationPermission(): BrowserNotificationPermission {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  return window.Notification.permission;
}

export function getBrowserNotificationsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(PREF_STORAGE_KEY);
    if (raw === null) return true;
    return raw === 'true';
  } catch {
    return true;
  }
}

export function setBrowserNotificationsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREF_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore storage errors
  }
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationPermission> {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  try {
    const result = await window.Notification.requestPermission();
    if (result === 'granted') {
      setBrowserNotificationsEnabled(true);
    }
    return result;
  } catch {
    return window.Notification.permission;
  }
}

export interface NativeNotificationPayload {
  title: string;
  body: string;
  tag?: string;
  requireInteraction?: boolean;
  onClick?: () => void;
}

export function sendBrowserNotification(payload: NativeNotificationPayload): boolean {
  if (!isBrowserNotificationSupported()) return false;
  if (window.Notification.permission !== 'granted') return false;
  if (!getBrowserNotificationsEnabled()) return false;

  try {
    const notification = new window.Notification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      requireInteraction: payload.requireInteraction ?? false,
    });

    notification.onclick = () => {
      try {
        window.focus();
      } catch {
        // ignore focus restriction
      }
      payload.onClick?.();
      notification.close();
    };

    return true;
  } catch {
    return false;
  }
}
