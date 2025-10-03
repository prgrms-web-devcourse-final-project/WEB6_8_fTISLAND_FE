import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { Home, Settings, User } from 'lucide-react';

export type SellerFooterItemKey = 'home' | 'manage' | 'my';

export interface SellerFooterNavProps {
  active: SellerFooterItemKey;
}

const NAV_ITEMS: Array<{
  key: SellerFooterItemKey;
  label: string;
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}> = [
  { key: 'home', label: '홈', to: '/seller', icon: Home },
  { key: 'manage', label: '관리', to: '/seller/manage', icon: Settings },
  { key: 'my', label: '마이뭐든', to: '/seller/mypage', icon: User },
];

export function SellerFooterNav({ active }: SellerFooterNavProps) {
  return (
    <footer className='fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[env(safe-area-inset-bottom)]'>
      <nav className='flex w-full max-w-[420px] items-center gap-1 border border-white/20 bg-[#2ac1bc] px-3.5 py-2 text-[11px] font-semibold text-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.55)] sm:text-[12px]'>
        {NAV_ITEMS.map(({ key, label, to, icon: Icon }) => {
          const isActive = key === active;
          return (
            <Button
              key={key}
              asChild
              variant='ghost'
              className={
                isActive
                  ? 'flex h-[42px] flex-1 flex-col items-center justify-center gap-1 rounded-[1rem] bg-white/18 text-white shadow-inner'
                  : 'flex h-[42px] flex-1 flex-col items-center justify-center gap-1 rounded-[1rem] text-white/75 hover:bg-white/15 hover:text-white'
              }>
              <Link to={to}>
                <Icon className='size-[17px]' aria-hidden />
                {label}
              </Link>
            </Button>
          );
        })}
      </nav>
    </footer>
  );
}
