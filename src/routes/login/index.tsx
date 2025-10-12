import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { LoginForm } from './_components/LoginForm';
import useLogin from './_hooks/useLogin';
import { useAuthStore, type AuthState } from '@/store/auth';
import { toast } from 'sonner';

export const Route = createFileRoute('/login/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { login } = useLogin();
  const setAuth = useAuthStore((s: AuthState) => s.setAuth);
  return (
    <LoginForm
      onSubmit={async ({ email, password }) => {
        const res = await login({ email, password });
        if (res?.success) {
          const c = res.content;
          setAuth({
            userId: c.userId,
            email: c.email,
            name: (c as any).name ?? (c as any).username,
            currentActiveProfileType: c.currentActiveProfileType,
            currentActiveProfileId: c.currentActiveProfileId,
            storeId: (c as any).storeId ?? (c as any)?.currentProfileDetail?.storeId,
            isOnboardingCompleted: c.isOnboardingCompleted,
            availableProfiles: c.availableProfiles,
            accessToken: c.accessToken,
            refreshToken: c.refreshToken,
          });
          toast.success('로그인에 성공했어요.');
          // 프로필이 하나도 없으면 프로필 생성 페이지로 유도
          if (!Array.isArray(c.availableProfiles) || c.availableProfiles.length === 0) {
            navigate({ to: '/make-profile' });
            return;
          }
          if (c.isOnboardingCompleted === false) {
            navigate({ to: '/make-profile' });
            return;
          }
          // 온보딩 완료: 활성 프로필 타입에 따라 대시보드로 이동
          switch (c.currentActiveProfileType) {
            case 'CUSTOMER':
              navigate({ to: '/customer' });
              break;
            case 'SELLER':
              navigate({ to: '/seller' });
              break;
            case 'RIDER':
              navigate({ to: '/rider' });
              break;
            default:
              navigate({ to: '/' });
          }
        }
      }}
      onSignup={() => {
        navigate({ to: '/signup' });
      }}
    />
  );
}
