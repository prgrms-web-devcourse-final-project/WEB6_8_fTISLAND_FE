import { useMutation } from '@tanstack/react-query';
import { http, blockAuthRefresh } from '@/api/core';
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
        // 동일 키 변형이 남아 있을 가능성까지 제거
        try {
          localStorage.removeItem('persist:auth');
        } catch {}
        try {
          sessionStorage.removeItem('auth');
        } catch {}
        // 일정 시간 자동 refresh 차단 (직후 회원가입/로그인 이동 시 재인증 방지)
        blockAuthRefresh(15_000);
      } catch {}
      toast.success('로그아웃 되었습니다.');
    },
    onSettled: () => {
      // 서버 응답 성공/실패와 무관하게 프런트 상태를 비웁니다.
      try {
        useAuthStore.getState().clear();
        localStorage.removeItem('auth');
        try {
          localStorage.removeItem('persist:auth');
        } catch {}
        try {
          sessionStorage.removeItem('auth');
        } catch {}
        blockAuthRefresh(15_000);
      } catch {}
    },
  });

  return { logout: mutation.mutateAsync, loading: mutation.isPending };
}
