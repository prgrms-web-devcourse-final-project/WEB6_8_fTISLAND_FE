import * as React from 'react';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { getGetUnreadCountQueryKey } from '@/api/generated';

type NotificationEvent = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
};

type SSEOptions = {
  autoInvalidate?: boolean;
  onEvent?: (ev: NotificationEvent) => void;
};

export function useNotificationsSSE(deviceId: string | undefined, options?: SSEOptions) {
  const [connected, setConnected] = React.useState(false);
  const eventsRef = React.useRef<NotificationEvent[]>([]);
  const qc = useQueryClient();

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
        // 실시간 갱신: 알림/안읽음 카운트 관련 쿼리 무효화
        if (options?.autoInvalidate) {
          try {
            // 모든 알림 목록 쿼리 무효화
            qc.invalidateQueries({
              predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === '/api/v1/notifications',
            });
            // 안읽음 카운트 무효화
            qc.invalidateQueries({ queryKey: getGetUnreadCountQueryKey() as any });
          } catch {}
        }
        options?.onEvent?.(data);
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
