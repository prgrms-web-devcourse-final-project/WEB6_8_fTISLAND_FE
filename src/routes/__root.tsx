import { Outlet, createRootRoute, useLocation, useNavigate } from '@tanstack/react-router';
import { CustomerFooterNav } from './(dashboard)/customer/_components/CustomerFooterNav';
import { Heart, Home, ListFilter, Search, User } from 'lucide-react';

export const Route = createRootRoute({
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
