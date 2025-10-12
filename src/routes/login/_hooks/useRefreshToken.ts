import { useRefreshToken } from '@/api/generated';
import type { RefreshTokenRequest } from '@/api/generated/model/refreshTokenRequest';

// 서버가 refreshToken을 쿠키로 전달하므로, 바디는 비워두거나 서버 스펙에 맞춰 전달
// 여기서는 안전하게 빈 바디 전송
export default function useRefresh() {
  const mutation = useRefreshToken({
    mutation: {
      onSuccess: (_res) => {
        // Authorization 헤더에서 accessToken 갱신은 axios 인터셉터가 처리
      },
    },
  });

  return {
    refresh: async () => {
      // 일부 서버는 POST /refresh-token 단순 호출만으로 쿠키 기반 갱신
      return await mutation.mutateAsync({ data: {} as RefreshTokenRequest });
    },
    loading: (mutation as any).isPending as boolean,
  };
}
