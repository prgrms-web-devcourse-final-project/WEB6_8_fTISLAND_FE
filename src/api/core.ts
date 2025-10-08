import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { toast } from 'sonner';

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

function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL || undefined,
    timeout: 20_000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor: attach bearer token later when available
  instance.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
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
          if (typeof window !== 'undefined' && token) {
            const raw = localStorage.getItem('auth');
            const parsed = raw ? JSON.parse(raw) : { state: {} };
            parsed.state = { ...(parsed.state ?? {}), accessToken: token };
            localStorage.setItem('auth', JSON.stringify(parsed));
          }
        }
      } catch {
        // ignore
      }
      return response;
    },
    (error: AxiosError<any>) => {
      const message = extractErrorMessage(error);
      if (message) toast.error(message);
      return Promise.reject(error);
    }
  );

  return instance;
}

function extractErrorMessage(error: AxiosError<any>): string {
  // 서버 응답 형태를 최대한 유연하게 처리
  const fallback = '요청 처리 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.';
  if (!error) return fallback;

  // 네트워크 오류
  if (error.code === 'ECONNABORTED') return '요청 시간이 초과되었습니다.';
  if (error.message === 'Network Error') return '네트워크 연결을 확인해 주세요.';

  const data = error.response?.data;
  if (!data) return error.response?.status ? `${fallback} (HTTP ${error.response.status})` : fallback;

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

  return fallback;
}

export const api = createApiClient();

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
