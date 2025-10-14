import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { toast } from 'sonner';
import { refreshToken as callRefresh } from '@/api/generated';
import type { RefreshTokenRequest } from '@/api/generated/model/refreshTokenRequest';

// Resolve API base URL from environment variables
const { VITE_API_URL, VITE_SERVER_URL } = (import.meta as any).env ?? {};
const RAW_BASE = (VITE_API_URL || VITE_SERVER_URL || '') as string;
const API_BASE_URL = RAW_BASE.trim().replace(/\/$/, '');

// Placeholder for future auth token retrieval
function getAccessToken(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // zustand persist default structure: { state: {...}, version?: number }
    const state = parsed?.state ?? parsed;
    const token = state?.accessToken as string | undefined;
    return token ?? null;
  } catch {
    return null;
  }
}

function setAccessToken(token: string | null | undefined): void {
  try {
    if (typeof window === 'undefined') return;
    if (!token) return;
    const raw = localStorage.getItem('auth');
    const parsed = raw ? JSON.parse(raw) : { state: {} };
    parsed.state = { ...(parsed.state ?? {}), accessToken: token };
    localStorage.setItem('auth', JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

function getRefreshToken(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const state = parsed?.state ?? parsed;
    const token = state?.refreshToken as string | undefined;
    return token ?? null;
  } catch {
    return null;
  }
}

function getDeviceId(): string {
  try {
    if (typeof window === 'undefined') return 'web';
    const key = 'device-id';
    const existing = localStorage.getItem(key);
    const id: string =
      existing ??
      ((crypto as any)?.randomUUID
        ? (crypto as any).randomUUID()
        : `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    if (!existing) {
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return 'web';
  }
}

function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL || undefined,
    timeout: 20_000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });

  // Request interceptor: attach bearer token later when available
  instance.interceptors.request.use((config) => {
    // Decide whether this request requires auth
    const skipByFlag = (config as any)?.withAuth === false || (config.headers as any)?.['X-Require-Auth'] === false;
    const url = (config.url || '').toString();
    const isAuthEndpoint = url.includes('/api/v1/auth/login') || url.includes('/api/v1/auth/refresh');

    const shouldAttachAuth = !skipByFlag && !isAuthEndpoint;
    if (shouldAttachAuth) {
      const token = getAccessToken();
      if (token) {
        config.headers = config.headers ?? {};
        (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }
    // Always attach X-Device-ID for server-side subscription identification
    const deviceId = getDeviceId();
    if (deviceId) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>)['X-Device-ID'] = deviceId;
    }
    return config;
  });

  // Response interceptor: persist Authorization bearer token when present, toast on error
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      try {
        const hdr = (response.headers as any)?.authorization ?? (response.headers as any)?.Authorization;
        if (hdr && typeof hdr === 'string') {
          const token = hdr.toLowerCase().startsWith('bearer ') ? hdr.slice(7) : hdr;
          setAccessToken(token);
        }
        // If server sets Set-Cookie for refresh token, withCredentials already ensures cookie persistence
      } catch {
        // ignore
      }
      return response;
    },
    (error: AxiosError<any>) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
      const reqUrl = (originalRequest?.url || '').toString();
      const isRefreshCall = reqUrl.includes('/api/v1/auth/refresh');

      // refresh 호출 자체가 401이면 즉시 종료 (무한 루프 방지)
      if (error.response?.status === 401 && isRefreshCall) {
        const msg = extractErrorMessage(error) || '세션이 만료되었습니다. 다시 로그인해 주세요.';
        if (msg) toast.error(msg);
        return Promise.reject(error);
      }

      // 자동 재시도: 401 && 아직 미시도 && refresh 가능 상태
      if (error.response?.status === 401 && !originalRequest?._retry) {
        originalRequest._retry = true;
        return triggerRefresh()
          .then(() => {
            // refresh 성공 후, Authorization 헤더는 인터셉터에서 저장됨. 원요청 재시도
            return api.request(originalRequest);
          })
          .catch((refreshErr) => {
            // refresh 실패 시 사용자에게 안내만 하고 세션은 유지(자동 로그아웃 방지)
            const msg = extractErrorMessage(error) || '세션이 만료되었습니다. 다시 로그인해 주세요.';
            if (msg) toast.error(msg);
            return Promise.reject(refreshErr);
          });
      }

      const message = extractErrorMessage(error);
      if (message) toast.error(message);
      return Promise.reject(error);
    }
  );

  return instance;
}

function extractErrorMessage(error: AxiosError<any>): string {
  // 서버/네트워크에서 의미 있는 메시지일 때만 반환하고, 그렇지 않으면 빈 문자열을 반환해 토스트를 띄우지 않습니다.
  if (!error) return '';

  // 네트워크 오류
  if (error.code === 'ECONNABORTED') return '요청 시간이 초과되었습니다.';
  if (error.message === 'Network Error') return '네트워크 연결을 확인해 주세요.';

  const data = error.response?.data;
  if (!data) return '';

  // 일반적인 형태: { message: string }
  if (typeof (data as any).message === 'string') return (data as any).message;

  // 중첩 형태: { error: { message: string } }
  if (typeof (data as any).error?.message === 'string') return (data as any).error.message;

  // 배열 형태: { errors: string[] | { message: string }[] }
  const errors = (data as any).errors;
  if (Array.isArray(errors)) {
    const first = errors[0];
    if (typeof first === 'string') return first;
    if (first && typeof first.message === 'string') return first.message;
  }

  return '';
}

export const api = createApiClient();

let refreshingPromise: Promise<unknown> | null = null;
function triggerRefresh(): Promise<unknown> {
  if (!refreshingPromise) {
    const rt = getRefreshToken();
    if (!rt) {
      return Promise.reject(new Error('Missing refresh token'));
    }
    refreshingPromise = callRefresh({ refreshToken: rt } as RefreshTokenRequest)
      .then((res: any) => {
        // Try to persist access token from headers or response body
        try {
          const hdr = res?.headers?.authorization ?? res?.headers?.Authorization;
          if (hdr && typeof hdr === 'string') {
            const token = hdr.toLowerCase().startsWith('bearer ') ? hdr.slice(7) : hdr;
            setAccessToken(token);
            return res;
          }
        } catch {}
        try {
          const data = res?.data ?? {};
          const token =
            data?.accessToken ||
            data?.token ||
            data?.data?.accessToken ||
            data?.data?.token ||
            data?.content?.accessToken ||
            data?.content?.token ||
            data?.data?.content?.accessToken ||
            data?.data?.content?.token;
          if (typeof token === 'string' && token) {
            setAccessToken(token);
          }
        } catch {}
        return res;
      })
      .catch((err) => {
        throw err;
      })
      .finally(() => {
        refreshingPromise = null;
      });
  }
  return refreshingPromise;
}

// Generic request helper (data 반환)
export async function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  const res = await api.request<T>(config);
  // 서버가 { data } 래핑 없이 반환하는 케이스도 고려해 그대로 반환
  return res.data as T;
}

export const http = {
  get: async <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ method: 'GET', url: withBase(url), ...(config ?? {}) }),
  post: async <T = unknown>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ method: 'POST', url: withBase(url), data: body, ...(config ?? {}) }),
  put: async <T = unknown>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ method: 'PUT', url: withBase(url), data: body, ...(config ?? {}) }),
  patch: async <T = unknown>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ method: 'PATCH', url: withBase(url), data: body, ...(config ?? {}) }),
  delete: async <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ method: 'DELETE', url: withBase(url), ...(config ?? {}) }),
};

export default api;

function withBase(path: string): string {
  if (!API_BASE_URL) {
    // 환경변수 누락 시 상대경로로 호출되므로, 개발자가 알아차릴 수 있게 경고
    if (typeof window !== 'undefined' && !(window as any).__API_BASE_WARNED__) {
      console.warn('[api] VITE_API_URL 또는 VITE_SERVER_URL 이 설정되지 않아 현재 오리진으로 요청합니다.');
      (window as any).__API_BASE_WARNED__ = true;
    }
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}
