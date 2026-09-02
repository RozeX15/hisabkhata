import { AppNotification } from '../types';
import { api } from './api';

// Sound chime using Web Audio API
export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  } catch (err) {
    // Audio Context might be restricted before user gesture
  }
}

// Request Browser Push Notification Permission
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Could not request notification permission:', err);
    return 'denied';
  }
}

// Check if Push Notification is permitted
export function getPushPermissionState(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

// Show Native Device Push Notification
export function triggerNativePushNotification(title: string, body: string, icon = '/icon-192.png') {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon,
          badge: '/icon-192.png',
          vibrate: [200, 100, 200],
          tag: `hk-notif-${Date.now()}`,
        } as any);
      }).catch(() => {
        new Notification(title, { body, icon });
      });
    } else {
      new Notification(title, { body, icon });
    }
  } catch (err) {
    console.warn('Failed to trigger native notification:', err);
  }
}
