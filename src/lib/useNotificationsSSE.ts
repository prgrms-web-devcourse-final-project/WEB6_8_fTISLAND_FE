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
    if (!activeDeviceId) {
      console.log('[sse] deviceId not available, skipping connection');
      return;
    }

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

    console.log('[sse] attempting to connect...', {
      deviceId: activeDeviceId,
      hasToken: !!token,
      url: 'https://api.deliver-anything.shop/api/v1/notifications/stream',
    });

    const url = 'https://api.deliver-anything.shop/api/v1/notifications/stream';

    try {
      const eventSource = new EventSourcePolyfill(url, {
        headers: {
          'X-Device-ID': String(activeDeviceId),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        withCredentials: true,
      });

      console.log('[sse] EventSource created, readyState:', (eventSource as any).readyState);

      eventSource.onopen = () => {
        setConnected(true);
        console.info('[sse] ✅ connection opened successfully, readyState:', (eventSource as any).readyState);
      };

      // 기본 메시지 채널 (event 미지정)
      eventSource.onmessage = (event) => {
        try {
          const data: NotificationEnvelope = JSON.parse(event.data);
          console.log('[sse] received message:', data);
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
      eventSource.addEventListener('connect', (event) => {
        try {
          const eventData = (event as MessageEvent)?.data;
          console.log('[sse] 🎉 connect event received:', eventData);
          if (eventData) toast.success('알림 연결 성공');
        } catch (e) {
          console.warn('[sse] connect event error', e);
        }
      });

      eventSource.addEventListener('notification-read', (event) => {
        try {
          const id = Number((event as MessageEvent)?.data);
          if (!Number.isFinite(id)) return;
          console.log('[sse] notification-read:', id);
          // 읽음 처리된 항목 제거/표시
          eventsRef.current = eventsRef.current.map((n) => (n.id === id ? { ...n, isRead: true } : n));
          // 필요 시 캐시 무효화
          if (options?.autoInvalidate) {
            qc.invalidateQueries({
              predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === '/api/v1/notifications',
            });
            qc.invalidateQueries({ queryKey: getGetUnreadCountQueryKey() as any });
          }
        } catch (e) {
          console.warn('[sse] notification-read error', e);
        }
      });

      eventSource.addEventListener('heartbeat', () => {
        console.log('[sse] 💓 heartbeat received');
      });

      eventSource.onerror = (err) => {
        console.error('[sse] ❌ connection error', {
          error: err,
          readyState: (eventSource as any).readyState,
          // readyState: 0 (CONNECTING), 1 (OPEN), 2 (CLOSED)
        });
        setConnected(false);

        // 에러 상세 정보 출력
        if ((err as any).status) {
          console.error('[sse] HTTP Status:', (err as any).status);
        }
        if ((err as any).message) {
          console.error('[sse] Error message:', (err as any).message);
        }
      };

      return () => {
        console.info('[sse] 🔌 closing connection (cleanup)');
        try {
          eventSource.close();
        } catch (e) {
          console.warn('[sse] error closing connection', e);
        }
      };
    } catch (error) {
      console.error('[sse] ❌ failed to create EventSource', error);
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDeviceId]);

  return {
    connected,
    getEvents: () => eventsRef.current,
  } as const;
}
