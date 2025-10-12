import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin } from 'lucide-react';

interface RiderHeaderProps {
  nickname?: string;
  deliveryArea?: string;
  profileImageUrl?: string;
  onClickAddress?: () => void;
}

export function RiderHeader({
  nickname = '라이더',
  deliveryArea = '배달 가능 지역을 설정해 주세요',
  profileImageUrl,
  onClickAddress,
}: RiderHeaderProps) {
  return (
    <header className='relative px-4 pb-6 pt-9 text-white sm:px-6 sm:pt-10'>
      <div className='flex items-start justify-between'>
        <div className='flex items-center gap-3'>
          <Avatar className='size-9 ring-1 ring-white/30'>
            <AvatarImage src={profileImageUrl} alt={nickname} />
            <AvatarFallback className='bg-white/10 text-white'>{nickname?.slice(0, 1) ?? '라'}</AvatarFallback>
          </Avatar>
          <div className='space-y-1'>
            <p className='text-[12px] font-semibold uppercase tracking-[0.3em]'>배달 가능 지역</p>
            <button
              type='button'
              onClick={onClickAddress}
              className='inline-flex items-center gap-1 text-left text-sm font-semibold text-white'>
              <MapPin className='size-4' aria-hidden />
              {deliveryArea}
            </button>
            <p className='text-[12px] text-white/80'>
              <span className='font-semibold'>{nickname}</span>님, 안전 배달 시작해 볼까요?
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default RiderHeader;
