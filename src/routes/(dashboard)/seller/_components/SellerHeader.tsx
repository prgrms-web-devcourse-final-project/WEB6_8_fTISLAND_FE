import * as React from 'react';
import { MapPin } from 'lucide-react';

export interface SellerHeaderProps {
  profileImageUrl?: string;
  nickname: string;
  storeName: string;
  address: string;
  description?: string;
  onSettingsClick?: () => void;
}

export function SellerHeader({ profileImageUrl, nickname, storeName, address, description }: SellerHeaderProps) {
  const avatarInitial = React.useMemo(() => nickname.trim().charAt(0).toUpperCase(), [nickname]);

  return (
    <header className='relative px-4 pb-6 pt-9 text-white sm:px-6 sm:pt-10'>
      <div className='flex items-start justify-between gap-4'>
        <div className='flex flex-1 items-start gap-3'>
          <div className='relative flex size-14 items-center justify-center rounded-full border border-white/40 bg-white/10 text-lg font-semibold sm:size-14'>
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={`${nickname} 프로필 이미지`}
                className='size-full rounded-full object-cover'
              />
            ) : (
              <span className='text-white'>{avatarInitial}</span>
            )}
          </div>
          <div className='space-y-1 text-left'>
            <h1 className='text-[1.75rem] font-extrabold leading-tight sm:text-3xl'>{storeName}</h1>
            <p className='text-[13px] font-semibold text-white/90'>
              {description ? (
                description
              ) : (
                <>
                  {nickname}
                  <span className='pl-1 text-white/60'>사장님</span>
                </>
              )}
            </p>
            <p className='flex items-center gap-1 text-[12px] text-white/75 sm:text-sm'>
              <MapPin className='size-[14px]' aria-hidden />
              {address}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
