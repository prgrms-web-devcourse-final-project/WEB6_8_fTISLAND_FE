import * as React from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { RiderHeader } from './_components/RiderHeader';
import { RiderFooterNav } from './_components/RiderFooterNav';
import { Home, ClipboardList, History, User } from 'lucide-react';

interface RiderPageLayoutProps {
  children: React.ReactNode;
}

export function RiderPageLayout({ children }: RiderPageLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const items = [
    { label: '홈', to: '/rider', icon: Home },
    { label: '정산관리', to: '/rider/settlement', icon: ClipboardList },
    { label: '배달내역', to: '/rider/history', icon: History },
    { label: '마이뭐든', to: '/rider/mypage', icon: User },
  ];
  const activeIndex = Math.max(
    0,
    items.findIndex(
      (i) =>
        location.pathname.startsWith(i.to) || location.pathname.startsWith(i.to.replace('/rider', '/(dashboard)/rider'))
    )
  );
  return (
    <div className='flex min-h-[100dvh] w-full flex-col bg-[#2ac1bc]'>
      <RiderHeader
        nickname='뭐든라이더'
        address='서울시 성북구 돌곶이로 27'
        onClickAddress={() => navigate({ to: '/manage-address' })}
      />
      <main className='flex-1 overflow-y-auto rounded-t-[1.5rem] bg-[#f8f9fa] px-4 pb-6 pt-6 outline-[1.5px] outline-[#2ac1bc]/15 sm:rounded-t-[1.75rem] sm:px-6 sm:pb-7 sm:pt-7'>
        {children}
      </main>
      <div className='h-[calc(68px+env(safe-area-inset-bottom))]' />
      <div className='fixed inset-x-0 bottom-0 z-[999]'>
        <RiderFooterNav
          items={items.map(({ label, icon }) => ({ label, icon }))}
          activeIndex={activeIndex}
          onClickItem={(idx) => navigate({ to: items[idx].to })}
        />
      </div>
    </div>
  );
}

export default RiderPageLayout;
