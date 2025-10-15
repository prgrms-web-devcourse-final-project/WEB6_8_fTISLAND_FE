import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, ShoppingBag } from 'lucide-react';

interface CustomerHeaderProps {
  nickname?: string;
  address?: string;
  profileImageUrl?: string;
  onClickAddress?: () => void;
  headlineLines?: [string, string];
  unreadCount?: number;
  onClickNotifications?: () => void;
  onClickCart?: () => void;
}

export function CustomerHeader({
  nickname = '손님',
  address = '서울시 성북구 돌곶이로 27',
  profileImageUrl,
  onClickAddress,
  headlineLines = ['동네 가게에서 필요한 걸', '지금 바로 받아보세요'],
  unreadCount = 0,
  onClickNotifications,
  onClickCart,
}: CustomerHeaderProps) {
  return (
    <header className='relative px-4 pb-6 pt-9 text-white sm:px-6 sm:pt-10'>
      <div className='flex items-start justify-between'>
        <div className='flex items-center gap-3'>
          <Avatar className='size-9 ring-1 ring-white/30'>
            <AvatarImage src={profileImageUrl} alt={nickname} />
            <AvatarFallback className='bg-white/10 text-white'>{nickname?.slice(0, 1) ?? '유'}</AvatarFallback>
          </Avatar>
          <div className='space-y-1'>
            <p className='text-[12px] font-semibold uppercase tracking-[0.3em]'>현재 위치</p>
            <button type='button' onClick={onClickAddress} className='text-left text-sm font-semibold text-white'>
              {address}
            </button>
            <p className='text-[12px] text-white/80'>
              <span className='font-semibold'>{nickname}</span>님, 반가워요!
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='icon'
            className='relative size-9 rounded-full border border-white/30 text-white hover:bg-white/10'
            onClick={onClickNotifications}>
            <Bell className='size-4' aria-hidden />
            <span className='sr-only'>알림</span>
            {unreadCount > 0 ? (
              <span className='absolute -right-1 -top-1 min-w-[16px] rounded-full bg-[#ef4444] px-1 text-center text-[10px] font-bold leading-4 text-white ring-2 ring-[#2ac1bc]'>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='size-9 rounded-full border border-white/30 text-white hover:bg-white/10'
            onClick={onClickCart}>
            <ShoppingBag className='size-4' aria-hidden />
            <span className='sr-only'>장바구니</span>
          </Button>
        </div>
      </div>
      <p className='mt-5 text-[1.55rem] font-extrabold leading-tight sm:text-3xl'>
        {headlineLines[0]}
        <br />
        {headlineLines[1]}
      </p>
    </header>
  );
}

export default CustomerHeader;
