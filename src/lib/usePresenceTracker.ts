import { useEffect } from 'react';
import { api } from './api';
import { User } from '../types';

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
      try {
        await api.sendHeartbeat({
          currentView: activeView,
          deviceType: getDeviceType(),
          browser: getBrowserName(),
          lastAction: lastAction || `Viewing ${activeView}`,
        });
      } catch {
        // Silent heartbeat fail
      }
    };

    // Send immediately on view change
    sendPing();

    // Heartbeat every 20 seconds
    const interval = setInterval(sendPing, 20000);
    return () => clearInterval(interval);
  }, [user, token, activeView, lastAction]);
}
