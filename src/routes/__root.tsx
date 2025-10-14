import { Outlet, createRootRoute, useLocation, useNavigate, redirect } from '@tanstack/react-router';
import { CustomerFooterNav } from './(dashboard)/customer/_components/CustomerFooterNav';
import { Home, ListFilter, Search, User } from 'lucide-react';

export const Route = createRootRoute({
  beforeLoad: () => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname;

    // 공개 경로: 로그인/회원가입/온보딩/결제 콜백 등
    const publicPaths = new Set<string>(['/login', '/signup', '/make-profile', '/payment/success', '/payment/fail']);

    // auth 상태 로드 (zustand persist 구조 호환)
    const raw = localStorage.getItem('auth');
    const parsed = raw ? JSON.parse(raw) : null;
    const state = parsed?.state ?? parsed;
    const token = state?.accessToken as string | undefined;
    const profile = state?.currentActiveProfileType as 'CUSTOMER' | 'SELLER' | 'RIDER' | undefined;
    const available = state?.availableProfiles as any[] | undefined | null;

    // 루트 경로 접근 시 토큰/프로필에 따라 즉시 라우팅
    if (path === '/') {
      if (!token) throw redirect({ to: '/login' });
      switch (profile) {
        case 'SELLER':
          throw redirect({ to: '/seller' });
        case 'RIDER':
          throw redirect({ to: '/rider' });
        default:
          throw redirect({ to: '/customer' });
      }
    }

    // 비로그인 사용자의 보호 경로 접근 차단
    if (!token && !publicPaths.has(path)) {
      throw redirect({ to: '/login' });
    }

    // 로그인된 사용자가 로그인/회원가입 페이지 접근 시 프로필 홈으로 리다이렉트
    if (token && publicPaths.has(path) && (path === '/login' || path === '/signup')) {
      // 로그인했지만 사용 가능한 프로필이 없으면 온보딩으로
      if (!available || !Array.isArray(available) || available.length === 0) {
        throw redirect({ to: '/make-profile' });
      }
      switch (profile) {
        case 'SELLER':
          throw redirect({ to: '/seller' });
        case 'RIDER':
          throw redirect({ to: '/rider' });
        default:
          throw redirect({ to: '/customer' });
      }
    }

    // 프로필 역할 기반 가드: 내 프로필과 맞지 않는 섹션 접근 차단
    if (token) {
      // 사용 가능한 프로필이 전혀 없으면 어느 보호 경로든 온보딩으로 보냄
      if (!available || !Array.isArray(available) || available.length === 0) {
        if (!publicPaths.has(path) && path !== '/make-profile') {
          throw redirect({ to: '/make-profile' });
        }
      }
      if (path.startsWith('/customer') && profile && profile !== 'CUSTOMER') {
        throw redirect({ to: profile === 'SELLER' ? '/seller' : '/rider' });
      }
      if (path.startsWith('/seller') && profile && profile !== 'SELLER') {
        throw redirect({ to: profile === 'CUSTOMER' ? '/customer' : '/rider' });
      }
      if (path.startsWith('/rider') && profile && profile !== 'RIDER') {
        throw redirect({ to: profile === 'CUSTOMER' ? '/customer' : '/seller' });
      }
    }
  },
  component: RootComponent,
});

function RootComponent() {
  const location = useLocation();
  const navigate = useNavigate();
  const isCustomer = location.pathname.startsWith('/customer');
  const isCustomerLayout = location.pathname.startsWith('/(dashboard)/customer');

  const items = [
    { label: '홈', to: '/customer', icon: Home },
    { label: '검색', to: '/customer/search', icon: Search },
    { label: '주문내역', to: '/customer/orders', icon: ListFilter },
    { label: '마이뭐든', to: '/customer/mypage', icon: User },
  ];
  const activeIndex = isCustomer
    ? Math.max(
        0,
        items.findIndex((i) => location.pathname.startsWith(i.to))
      )
    : -1;

  return (
    <div className='flex min-h-[100dvh] w-full justify-center bg-[#f1f5f9] text-[#1b1b1b]'>
      <main className='flex w-full min-h-[100dvh] flex-col bg-transparent sm:mx-auto sm:max-w-[28rem] md:max-w-[32rem] lg:max-w-[36rem]'>
        <Outlet />
        {isCustomer && !isCustomerLayout ? <div className='h-[calc(68px+env(safe-area-inset-bottom))]' /> : null}
      </main>
      {isCustomer && !isCustomerLayout ? (
        <div className='fixed inset-x-0 bottom-0 z-[1000]'>
          <CustomerFooterNav
            items={items.map(({ label, icon }) => ({ label, icon }))}
            activeIndex={activeIndex}
            onClickItem={(idx) => navigate({ to: items[idx].to })}
          />
        </div>
      ) : null}
    </div>
  );
}
