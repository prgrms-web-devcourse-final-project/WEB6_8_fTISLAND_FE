import * as React from 'react';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { getGetUnreadCountQueryKey } from '@/api/generated';

type NotificationEnvelope = {
  id: number;
  recipientId: number;
  type: string; // 이벤트 타입 (NEW_REVIEW, ORDER_PAID_CUSTOMER, ...)
  message: string;
  data?: string; // JSON 문자열 (각 타입별 스펙)
  isRead?: boolean;
  createdAt: string;
};

type SSEOptions = {
  autoInvalidate?: boolean;
  onEvent?: (ev: NotificationEnvelope) => void;
};

export function useNotificationsSSE(deviceId: string | undefined, options?: SSEOptions) {
  const [connected, setConnected] = React.useState(false);
  const [activeDeviceId, setActiveDeviceId] = React.useState<string | undefined>(deviceId);
  const eventsRef = React.useRef<NotificationEnvelope[]>([]);
  const qc = useQueryClient();

  React.useEffect(() => {
    setActiveDeviceId(deviceId);
  }, [deviceId]);

  React.useEffect(() => {
    const onChanged = (e: any) => {
      try {
        const next = (e?.detail as string) || localStorage.getItem('device-id') || undefined;
        setActiveDeviceId(next || undefined);
      } catch {}
    };
    window.addEventListener('device-id:changed', onChanged as any);
    return () => window.removeEventListener('device-id:changed', onChanged as any);
  }, []);

  React.useEffect(() => {
    if (!activeDeviceId) return;

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
        'X-Device-ID': String(activeDeviceId),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      withCredentials: true,
      heartbeatTimeout: 60000,
    });

    es.onopen = () => {
      setConnected(true);
      console.info('[sse] open');
    };
    // 기본 메시지 채널 (event 미지정)
    es.onmessage = (ev) => {
      try {
        const data: NotificationEnvelope = JSON.parse(ev.data);
        eventsRef.current = [data, ...eventsRef.current].slice(0, 50);
        if (data?.message) toast(data.message);
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
    // 명명된 이벤트 핸들러
    es.addEventListener('connect', (e: MessageEvent) => {
      try {
        const text = (e as any)?.data as string | undefined;
        if (text) console.info('[sse] connect:', text);
      } catch {}
    });
    es.addEventListener('notification-read', (e: MessageEvent) => {
      try {
        const id = Number((e as any)?.data);
        if (!Number.isFinite(id)) return;
        // 읽음 처리된 항목 제거/표시
        eventsRef.current = eventsRef.current.map((n) => (n.id === id ? { ...n, isRead: true } : n));
        // 필요 시 캐시 무효화
        if (options?.autoInvalidate) {
          qc.invalidateQueries({
            predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === '/api/v1/notifications',
          });
          qc.invalidateQueries({ queryKey: getGetUnreadCountQueryKey() as any });
        }
      } catch {}
    });
    es.addEventListener('heartbeat', () => {
      // ping 무시
    });
    es.onerror = (err) => {
      console.error('[sse] error', err);
      setConnected(false);
    };

    return () => es.close();
  }, [activeDeviceId]);

  return {
    connected,
    getEvents: () => eventsRef.current,
  } as const;
}
