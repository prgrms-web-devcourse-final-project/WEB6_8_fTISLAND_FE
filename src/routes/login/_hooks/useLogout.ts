import { useMutation } from '@tanstack/react-query';
import { http } from '@/api/core';

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
  });

  return { logout: mutation.mutateAsync, loading: mutation.isPending };
}
