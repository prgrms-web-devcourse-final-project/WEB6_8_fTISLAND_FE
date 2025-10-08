import { useMutation } from '@tanstack/react-query';
// import { http } from '@/api/core';

export type ProfileType = 'CUSTOMER' | 'SELLER' | 'RIDER';

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  success: boolean;
  code: string;
  message: string;
  content: {
    userId: number;
    email: string;
    name: string;
    currentActiveProfileType: ProfileType;
    currentActiveProfileId: number;
    isOnboardingCompleted: boolean;
    availableProfiles: ProfileType[];
    accessToken?: string;
    refreshToken?: string;
  };
};

export default function useLogin() {
  const mutation = useMutation({
    mutationKey: ['login'],
    mutationFn: async (payload: LoginPayload) => {
      // NOTE: http wrapper returns only data, but we need headers too for Authorization token
      // So we call api.request directly here
      const res = await fetchToken('/api/v1/auth/login', payload);
      return res;
    },
  });

  return { login: mutation.mutateAsync, loading: mutation.isPending };
}

async function fetchToken(url: string, body: unknown): Promise<LoginResponse> {
  // 직접 axios 인스턴스를 불러서 headers 읽기
  const { api } = await import('@/api/core');
  const response = await api.post<LoginResponse>(url, body);
  // Authorization: Bearer xxx
  const auth = response.headers?.['authorization'] || response.headers?.['Authorization'];
  if (auth && typeof auth === 'string') {
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : auth;
    try {
      const raw = localStorage.getItem('auth');
      const parsed = raw ? JSON.parse(raw) : { state: {} };
      parsed.state = { ...(parsed.state ?? {}), accessToken: token };
      localStorage.setItem('auth', JSON.stringify(parsed));
      // also attach to response content so caller can persist via store
      try {
        (response.data as any).content = {
          ...((response.data as any).content ?? {}),
          accessToken: token,
        };
      } catch {}
    } catch {
      // ignore
    }
  }
  return response.data;
}
