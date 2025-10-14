import * as React from 'react';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { toast } from 'sonner';

type NotificationEvent = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
};

export function useNotificationsSSE(deviceId: string | undefined) {
  const [connected, setConnected] = React.useState(false);
  const eventsRef = React.useRef<NotificationEvent[]>([]);

  React.useEffect(() => {
    if (!deviceId) return;

    const token = (() => {
      try {
        const raw = localStorage.getItem('auth');
        const parsed = raw ? JSON.parse(raw) : null;
        const state = parsed?.state ?? parsed;
        return state?.accessToken as string | undefined;
      } catch {
        return undefined;
      }
    })();

    const url = 'https://api.deliver-anything.shop/api/v1/notifications/stream';
    const es = new EventSourcePolyfill(url, {
      headers: {
        'X-Device-ID': String(deviceId),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      withCredentials: true,
      heartbeatTimeout: 60000,
    });

    es.onopen = () => {
      setConnected(true);
      console.info('[sse] open');
    };
    es.onmessage = (ev) => {
      try {
        const data: NotificationEvent = JSON.parse(ev.data);
        eventsRef.current = [data, ...eventsRef.current].slice(0, 50);
        toast(data.message ?? '새 알림이 도착했어요');
      } catch (e) {
        console.warn('[sse] parse error', e);
      }
    };
    es.onerror = (err) => {
      console.error('[sse] error', err);
      setConnected(false);
    };

    return () => es.close();
  }, [deviceId]);

  return {
    connected,
    getEvents: () => eventsRef.current,
  } as const;
}
