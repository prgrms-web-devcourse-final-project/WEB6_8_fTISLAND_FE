import * as React from 'react';
import SockJS from 'sockjs-client';
import { Client, type IMessage } from '@stomp/stompjs';

export type RiderLocationDto = {
  latitude: number;
  longitude: number;
  timestamp: number; // ms (백엔드 스펙: 밀리초)
};

export interface UseRiderLocationSocketOptions {
  riderProfileId: string | number;
  // 예: `${API_BASE_URL}/ws` 또는 서버에서 지정한 소켓 엔드포인트
  endpoint?: string;
  // 연결 자동 시작 여부
  autoConnect?: boolean;
  // 서버가 라이더 알림을 브로드캐스트하는 토픽 구독 시 콜백
  onNotification?: (notification: any) => void;
  // 서버에서 요구하는 PUBLISH 목적지 (기본 '/app/location')
  publishDestination?: string;
  // 서버에서 위치 수신 토픽 커스터마이즈 필요 시
  subscribeLocationTopic?: (riderProfileId: string | number) => string;
  // 서버에서 알림 브로드캐스트 토픽 커스터마이즈 필요 시
  subscribeNotificationTopic?: (riderProfileId: string | number) => string;
}

export function useRiderLocationSocket({
  riderProfileId,
  endpoint,
  autoConnect = true,
  onNotification,
  publishDestination = '/app/location',
  subscribeLocationTopic,
  subscribeNotificationTopic,
}: UseRiderLocationSocketOptions) {
  const [connected, setConnected] = React.useState(false);
  const [lastLocation, setLastLocation] = React.useState<RiderLocationDto | null>(null);
  const clientRef = React.useRef<Client | null>(null);

  // accessToken 읽기 (zustand persist 구조 고려)
  const getAccessToken = React.useCallback((): string | null => {
    try {
      const raw = localStorage.getItem('auth');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const state = parsed?.state ?? parsed;
      const token = state?.accessToken as string | undefined;
      return token ?? null;
    } catch {
      return null;
    }
  }, []);

  const baseUrl = React.useMemo(() => {
    const fixed = (endpoint || '').toString().trim().replace(/\/$/, '');
    if (fixed) return fixed;
    const env = (import.meta as any)?.env ?? {};
    const base = (env.VITE_WS_URL || '').toString().trim().replace(/\/$/, '');
    // SockJS는 입력 URL로 http/https 스킴을 요구합니다 (내부적으로 ws로 업그레이드)
    return base || 'https://api.deliver-anything.shop/ws';
  }, [endpoint]);

  const connect = React.useCallback(() => {
    if (clientRef.current?.connected) return;
    console.info('[ws] connecting', baseUrl, { riderProfileId });
    // Authorization 헤더로 전달 (URL에 토큰 노출 방지)
    const token = getAccessToken();
    const urlWithToken = baseUrl;
    if (!token) console.warn('[ws] no accessToken found; backend must allow anonymous /ws/info or cookie auth');
    // withCredentials 전송(쿠키 인증)과 우선 전송방식 지정
    const sock = new SockJS(
      urlWithToken,
      undefined as any,
      {
        transports: ['xhr-streaming', 'xhr-polling', 'websocket'],
        transportOptions: {
          'xhr-streaming': { withCredentials: true },
          'xhr-polling': { withCredentials: true },
        } as any,
      } as any
    );
    const client = new Client({
      webSocketFactory: () => sock as any,
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (m: string) => m && console.debug('[stomp]', m),
      beforeConnect: () => {
        console.info('[stomp] beforeConnect');
      },
      // STOMP CONNECT 프레임에도 토큰 전달 (백엔드가 이 경로로 검증 시)
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      onConnect: (frame) => {
        console.info('[stomp] connected', frame?.headers);
        setConnected(true);
        const locTopic = subscribeLocationTopic
          ? subscribeLocationTopic(riderProfileId)
          : `/topic/rider/location/${riderProfileId}`;
        console.info('[stomp] subscribe', locTopic);
        client.subscribe(locTopic, (msg: IMessage) => {
          try {
            console.debug('[stomp] message', msg?.body);
            const body = JSON.parse(msg.body);
            // 서버가 envelope를 씌우면 content로 접근 필요할 수 있음
            const dto: RiderLocationDto = (body?.content as RiderLocationDto) || (body as RiderLocationDto);
            if (dto && typeof dto.latitude === 'number' && typeof dto.longitude === 'number') {
              setLastLocation(dto);
            }
          } catch (e) {
            console.error('[stomp] parse-error', e);
          }
        });
        // 라이더 알림 브로드캐스트 구독
        const notiTopic = subscribeNotificationTopic
          ? subscribeNotificationTopic(riderProfileId)
          : `/topic/rider/notification/${riderProfileId}`;
        console.info('[stomp] subscribe', notiTopic);
        client.subscribe(notiTopic, (msg: IMessage) => {
          try {
            const body = JSON.parse(msg.body);
            const payload = body?.payload ?? body;
            onNotification?.(payload);
          } catch (e) {
            console.error('[stomp] noti-parse-error', e);
          }
        });
      },
      onDisconnect: (frame) => {
        console.warn('[stomp] disconnected', frame?.headers);
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('[stomp] error', frame?.headers, frame?.body);
        setConnected(false);
      },
      onUnhandledMessage: (m) => console.warn('[stomp] unhandled message', m?.body),
      onUnhandledFrame: (f) => console.warn('[stomp] unhandled frame', f?.command),
      onUnhandledReceipt: (r: any) => console.warn('[stomp] unhandled receipt', r?.receiptId || r),
    });

    // 원소켓 레벨 이벤트 로깅
    (sock as any).onopen = (...args: any[]) => console.info('[ws] open', ...args);
    (sock as any).onclose = (...args: any[]) => console.warn('[ws] close', ...args);
    (sock as any).onerror = (...args: any[]) => console.error('[ws] error', ...args);

    client.activate();
    clientRef.current = client;
  }, [baseUrl, riderProfileId]);

  const disconnect = React.useCallback(() => {
    const c = clientRef.current;
    clientRef.current = null;
    if (c?.active) c.deactivate();
    setConnected(false);
    console.info('[stomp] manually disconnected');
  }, []);

  const sendLocation = React.useCallback((location: RiderLocationDto) => {
    const c = clientRef.current;
    if (!c?.connected) return;
    // 백엔드 스펙: RiderLocationDto(ms)만 전송
    const payload: RiderLocationDto = {
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      timestamp: Number(location?.timestamp ?? Date.now()),
    };
    const token = getAccessToken();
    console.debug('[stomp] publish', publishDestination, payload);
    c.publish({
      destination: publishDestination,
      body: JSON.stringify(payload),
      headers: {
        'content-type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }, []);

  React.useEffect(() => {
    if (!autoConnect) return;
    connect();
    return () => disconnect();
  }, [autoConnect, connect, disconnect]);

  return { connected, lastLocation, connect, disconnect, sendLocation } as const;
}
