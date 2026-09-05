import { useEffect } from 'react';
import { api } from './api';
import { User } from '../types';
import { firestore, doc, setDoc } from './firebase';

export function usePresenceTracker(user: User | null, token: string | null, activeView: string, lastAction?: string) {
  useEffect(() => {
    if (!user || !token) return;

    const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
      const width = window.innerWidth;
      if (width < 640) return 'mobile';
      if (width < 1024) return 'tablet';
      return 'desktop';
    };

    const getBrowserName = (): string => {
      const ua = navigator.userAgent;
      if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
      if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
      if (ua.includes('Firefox')) return 'Firefox';
      if (ua.includes('Edg')) return 'Edge';
      return 'Mobile Browser';
    };

    const sendPing = async () => {
      const now = new Date().toISOString();
      const payload = {
        currentView: activeView,
        deviceType: getDeviceType(),
        browser: getBrowserName(),
        lastAction: lastAction || `Viewing ${activeView.replace('-', ' ')}`,
      };

      // 1. Send to server heartbeat endpoint
      try {
        await api.sendHeartbeat(payload);
      } catch {
        // Fallback gracefully
      }

      // 2. Realtime sync to Cloud Firestore
      try {
        if (firestore && user.id) {
          await setDoc(
            doc(firestore, 'user_presences', user.id),
            {
              userId: user.id,
              userName: user.name,
              userEmail: user.email,
              avatarUrl: user.avatarUrl || null,
              plan: user.plan || 'free',
              role: user.role || 'user',
              isOnline: true,
              currentView: activeView,
              lastActiveAt: now,
              deviceType: payload.deviceType,
              browser: payload.browser,
              lastAction: payload.lastAction,
              updatedAt: now,
            },
            { merge: true }
          );
        }
      } catch {
        // Firestore presence fallback
      }
    };

    // Send immediately on view change
    sendPing();

    // Heartbeat every 15 seconds
    const interval = setInterval(sendPing, 15000);

    // Also send immediately when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendPing();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, token, activeView, lastAction]);
}
