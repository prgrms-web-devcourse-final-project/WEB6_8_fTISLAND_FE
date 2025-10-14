import { useMutation } from '@tanstack/react-query';
import { http } from '@/api/core';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';

export type LogoutResponse = {
  success: boolean;
  code: string;
  message: string;
  content: Record<string, never>;
};

export default function useLogout() {
  const mutation = useMutation({
    mutationKey: ['logout'],
    mutationFn: async () => {
      return await http.post<LogoutResponse>('/api/v1/auth/logout');
    },
    onSuccess: () => {
      try {
        // 메모리/로컬스토리지 모두 정리
        useAuthStore.getState().clear();
        localStorage.removeItem('auth');
      } catch {}
      toast.success('로그아웃 되었습니다.');
    },
    onSettled: () => {
      // 서버 응답 성공/실패와 무관하게 프런트 상태를 비웁니다.
      try {
        useAuthStore.getState().clear();
        localStorage.removeItem('auth');
      } catch {}
    },
  });

  return { logout: mutation.mutateAsync, loading: mutation.isPending };
}
