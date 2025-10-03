import { Outlet, createFileRoute, useLocation } from '@tanstack/react-router';
import { SellerFooterNav } from './_components/SellerFooterNav';
import { useMemo } from 'react';
import type { SellerFooterItemKey } from './_components/SellerFooterNav';

export const Route = createFileRoute('/(dashboard)/seller/_layout')({
  component: RouteComponent,
});

function RouteComponent() {
  const location = useLocation();
  const active = useMemo<SellerFooterItemKey>(() => {
    if (location.pathname.startsWith('/seller/manage')) {
      return 'manage';
    }
    if (location.pathname.startsWith('/seller/mypage')) {
      return 'my';
    }
    return 'home';
  }, [location.pathname]);

  return (
    <div className='min-h-[100dvh] w-full pb-[calc(72px+env(safe-area-inset-bottom))]'>
      <Outlet />
      <SellerFooterNav active={active} />
    </div>
  );
}
