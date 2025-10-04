import * as React from 'react';
import { Outlet, createFileRoute, useNavigate, useLocation } from '@tanstack/react-router';
import { CustomerFooterNav } from './_components/CustomerFooterNav';
import { Heart, Home, ListFilter, Search, User } from 'lucide-react';

export const Route = createFileRoute('/(dashboard)/customer/_layout')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const items = [
    { label: '홈', to: '/customer', icon: Home },
    { label: '검색', to: '/customer/search', icon: Search },
    { label: '즐겨찾기', to: '/customer/favorites', icon: Heart },
    { label: '주문내역', to: '/customer/orders', icon: ListFilter },
    { label: '마이뭐든', to: '/customer/mypage', icon: User },
  ];
  const activeIndex = Math.max(
    0,
    items.findIndex((i) => {
      const path = location.pathname;
      const dashboardPath = i.to.replace('/customer', '/(dashboard)/customer');
      return path.startsWith(i.to) || path.startsWith(dashboardPath);
    })
  );

  return (
    <div className='relative min-h-[100dvh]'>
      <Outlet />
      <div className='h-[calc(68px+env(safe-area-inset-bottom))]' />
      <div className='fixed inset-x-0 bottom-0 z-[999] pointer-events-auto'>
        <CustomerFooterNav
          items={items.map(({ label, icon }) => ({ label, icon }))}
          activeIndex={activeIndex}
          onClickItem={(idx) => navigate({ to: items[idx].to })}
        />
      </div>
    </div>
  );
}
