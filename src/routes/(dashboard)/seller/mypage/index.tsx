import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { SellerFooterNav } from '../_components/SellerFooterNav';
import { User, Store, Bike } from 'lucide-react';
import {
  useGetAvailableProfiles,
  useSwitchProfile,
  useGetMyInfo,
  useGetAddress,
  useChangePassword,
} from '@/api/generated';
import type { ChangePasswordRequest } from '@/api/generated/model/changePasswordRequest';
import { toast } from 'sonner';
import useLogout from '@/routes/login/_hooks/useLogout';
import { useAuthStore } from '@/store/auth';

// footer items are rendered by SellerFooterNav directly

export const Route = createFileRoute('/(dashboard)/seller/mypage/')({
  component: RouteComponent,
});

// 판매자 기본 폴백 프로필
const FALLBACK_PROFILE = {
  nickname: '뭐든배달 판매자',
  address: '주소를 설정해 주세요',
};

function RouteComponent() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false);
  const [keyboardOffset, setKeyboardOffset] = React.useState(0);
  const availableProfilesQuery = useGetAvailableProfiles();
  const available = ((availableProfilesQuery.data as any)?.data?.content?.availableProfiles ?? []) as string[];
  const switchMutation = useSwitchProfile({
    mutation: {
      onSuccess: (res) => {
        const type =
          (res as any)?.data?.content?.currentProfileType ?? (res as any)?.data?.content?.currentActiveProfileType;
        if (type === 'CUSTOMER') navigate({ to: '/customer/mypage' });
        else if (type === 'SELLER') navigate({ to: '/seller/mypage' });
        else if (type === 'RIDER') navigate({ to: '/rider/mypage' });
      },
    },
  });

  React.useEffect(() => {
    if (!isPasswordDialogOpen || typeof window === 'undefined') {
      setKeyboardOffset(0);
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    const handleViewportChange = () => {
      const keyboardHeight = Math.max(0, window.innerHeight - (viewport.height + viewport.offsetTop));
      if (keyboardHeight === 0) {
        setKeyboardOffset(0);
        return;
      }

      const maxShift = viewport.height * 0.4;
      const shift = Math.min(keyboardHeight * 0.6, maxShift);
      setKeyboardOffset(shift);
    };

    viewport.addEventListener('resize', handleViewportChange);
    viewport.addEventListener('scroll', handleViewportChange);
    handleViewportChange();

    return () => {
      viewport.removeEventListener('resize', handleViewportChange);
      viewport.removeEventListener('scroll', handleViewportChange);
    };
  }, [isPasswordDialogOpen]);

  const { logout } = useLogout();
  const clearAuth = useAuthStore((s) => s.clear);
  const isLoggedIn = !!useAuthStore((s) => s.accessToken);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  // 내 정보 조회 및 표시값
  const myInfoQuery = useGetMyInfo();
  const my = (myInfoQuery.data as any)?.data?.content;
  const displayName =
    my?.currentProfileDetail?.nickname ?? my?.username ?? (my as any)?.name ?? FALLBACK_PROFILE.nickname;
  const defaultAddressId = my?.currentProfileDetail?.defaultAddressId as number | undefined;
  const addressQuery = useGetAddress(defaultAddressId ?? 0, { query: { enabled: !!defaultAddressId } } as any);
  const addressText = (addressQuery.data as any)?.data?.content?.address ?? FALLBACK_PROFILE.address;

  const changePasswordMutation = useChangePassword({
    mutation: {
      onSuccess: () => {
        toast.success('비밀번호가 변경되었습니다.');
        setIsPasswordDialogOpen(false);
        setCurrentPassword('');
        setNewPassword('');
      },
    },
  });

  // 판매자 프로필 수정은 별도 다이얼로그 구현 시 연동 예정

  return (
    <div className='flex min-h-[100dvh] w-full flex-col bg-[#f8f9fa] text-[#1b1b1b]'>
      <main className='flex-1 space-y-5 overflow-y-auto px-4 pb-28 pt-8 sm:px-6 sm:pb-32 sm:pt-10'>
        <section className='flex flex-col items-center gap-4 text-center'>
          <div className='relative flex size-24 items-center justify-center rounded-full bg-[#e0f7f5] text-[24px] font-extrabold text-[#1ba7a1] shadow-[0_18px_40px_-32px_rgba(15,23,42,0.35)]'>
            {my?.currentProfileDetail?.profileImageUrl ? (
              <img
                src={my.currentProfileDetail.profileImageUrl}
                alt='프로필 이미지'
                className='size-full rounded-full object-cover'
              />
            ) : (
              (displayName as string).charAt(0)
            )}
          </div>
          <div className='space-y-1'>
            <h1 className='text-[20px] font-extrabold text-[#1b1b1b]'>{displayName}</h1>
            <p className='text-[13px] text-[#6b7785]'>{addressText}</p>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              className='h-9 rounded-full border-[#cbd8e2] px-4 text-[12px] font-semibold text-[#1b1b1b] hover:bg-[#f5f7f9]'>
              주소 관리
            </Button>
            <Button className='h-9 rounded-full bg-[#1ba7a1] px-4 text-[12px] font-semibold text-white hover:bg-[#17928d]'>
              리뷰 관리
            </Button>
          </div>
        </section>

        <section className='space-y-3 rounded-2xl bg-white p-4 shadow-[0_20px_48px_-32px_rgba(15,23,42,0.28)]'>
          <header className='flex items-center justify-between'>
            <p className='text-[13px] font-semibold text-[#1b1b1b]'>역할별 프로필</p>
          </header>
          <div className='grid grid-cols-3 gap-2'>
            {/* 판매자 */}
            <div className='flex flex-col items-center gap-2 rounded-2xl border border-[#dbe4ec] bg-white p-3'>
              <div className='flex size-10 items-center justify-center rounded-full bg-[#fff3e0] text-[#fb923c]'>
                <Store className='size-5' />
              </div>
              <p className='text-[12px] font-semibold text-[#1b1b1b]'>판매자</p>
              {/* 현재 페이지는 SELLER이므로 전환 버튼 숨김; SELLER 없으면 생성 버튼 */}
              {!available.includes('SELLER') ? (
                <Button
                  size='sm'
                  className='h-8 w-full rounded-full bg-[#1ba7a1] text-[10px] font-semibold text-white hover:bg-[#17928d]'
                  onClick={() => navigate({ to: '/make-profile/seller' })}>
                  프로필 생성하기
                </Button>
              ) : null}
            </div>

            {/* 소비자 */}
            <div className='flex flex-col items-center gap-2 rounded-2xl border border-[#dbe4ec] bg-white p-3'>
              <div className='flex size-10 items-center justify-center rounded-full bg-[#e0f7f5] text-[#1ba7a1]'>
                <User className='size-5' />
              </div>
              <p className='text-[12px] font-semibold text-[#1b1b1b]'>소비자</p>
              {available.includes('CUSTOMER') ? (
                <Button
                  size='sm'
                  className='h-8 w-full rounded-full bg-[#2ac1bc] text-[10px] font-semibold text-white hover:bg-[#1ba7a1]'
                  onClick={async () => {
                    await switchMutation.mutateAsync({ data: { targetProfileType: 'CUSTOMER' } as any });
                  }}>
                  전환
                </Button>
              ) : (
                <Button
                  size='sm'
                  className='h-8 w-full rounded-full bg-[#1ba7a1] text-[10px] font-semibold text-white hover:bg-[#17928d]'
                  onClick={() => navigate({ to: '/make-profile/customer' })}>
                  프로필 생성하기
                </Button>
              )}
            </div>

            {/* 라이더 */}
            <div className='flex flex-col items-center gap-2 rounded-2xl border border-[#dbe4ec] bg-white p-3'>
              <div className='flex size-10 items-center justify-center rounded-full bg-[#e5e7ff] text-[#6366f1]'>
                <Bike className='size-5' />
              </div>
              <p className='text-[12px] font-semibold text-[#1b1b1b]'>라이더</p>
              {available.includes('RIDER') ? (
                <Button
                  size='sm'
                  className='h-8 w-full rounded-full bg-[#2ac1bc] text-[10px] font-semibold text-white hover:bg-[#1ba7a1]'
                  onClick={async () => {
                    await switchMutation.mutateAsync({ data: { targetProfileType: 'RIDER' } as any });
                  }}>
                  전환
                </Button>
              ) : (
                <Button
                  size='sm'
                  className='h-8 w-full rounded-full bg-[#1ba7a1] text-[10px] font-semibold text-white hover:bg-[#17928d]'
                  onClick={() => navigate({ to: '/make-profile/rider' })}>
                  프로필 생성하기
                </Button>
              )}
            </div>
          </div>
        </section>

        <Card className='border-none bg-white shadow-[0_20px_48px_-32px_rgba(15,23,42,0.28)]'>
          <CardContent className='space-y-3 px-4 py-4'>
            <div className='flex items-center justify-between rounded-2xl bg-[#f5f7f9] px-4 py-3'>
              <div>
                <p className='text-[12px] font-semibold text-[#6b7785]'>계정 아이디</p>
                <p className='text-[13px] font-semibold text-[#1b1b1b]'>{my?.email ?? 'example@domain.com'}</p>
              </div>
            </div>
            <div className='flex items-center justify-between rounded-2xl bg-[#f5f7f9] px-4 py-3'>
              <div>
                <p className='text-[12px] font-semibold text-[#6b7785]'>비밀번호</p>
                <p className='text-[13px] font-semibold text-[#1b1b1b]'>
                  보안을 위해 주기적으로
                  <br />
                  변경해 주세요.
                </p>
              </div>
              <Dialog
                open={isPasswordDialogOpen}
                onOpenChange={(nextOpen) => {
                  setIsPasswordDialogOpen(nextOpen);
                  if (!nextOpen) {
                    setCurrentPassword('');
                    setNewPassword('');
                  }
                }}>
                <DialogTrigger asChild>
                  <Button className='h-9 rounded-full bg-[#1ba7a1] px-4 text-[12px] font-semibold text-white hover:bg-[#17928d]'>
                    비밀번호 변경하기
                  </Button>
                </DialogTrigger>
                <DialogContent
                  onOpenAutoFocus={(event) => event.preventDefault()}
                  className='max-w-sm rounded-3xl border-none bg-white p-6 shadow-[0_28px_72px_-28px_rgba(15,23,42,0.45)]'
                  style={keyboardOffset ? { top: `calc(50% - ${keyboardOffset}px)` } : undefined}>
                  <DialogHeader>
                    <DialogTitle className='text-[16px] font-semibold text-[#1b1b1b]'>비밀번호 변경</DialogTitle>
                  </DialogHeader>
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='current-password' className='text-[12px] font-semibold text-[#1b1b1b]'>
                        현재 비밀번호
                      </Label>
                      <Input
                        id='current-password'
                        type='password'
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        className='h-10 rounded-xl border-[#dbe4ec] text-[13px]'
                        placeholder='현재 비밀번호를 입력해 주세요'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='new-password' className='text-[12px] font-semibold text-[#1b1b1b]'>
                        새 비밀번호
                      </Label>
                      <Input
                        id='new-password'
                        type='password'
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        className='h-10 rounded-xl border-[#dbe4ec] text-[13px]'
                        placeholder='새 비밀번호를 입력해 주세요'
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      disabled={changePasswordMutation.isPending || !currentPassword || !newPassword}
                      onClick={async () => {
                        if (!currentPassword || !newPassword) return;
                        const payload: ChangePasswordRequest = { currentPassword, newPassword };
                        await changePasswordMutation.mutateAsync({ data: payload });
                      }}
                      className='h-10 w-full rounded-full bg-[#1ba7a1] text-[13px] font-semibold text_white hover:bg-[#17928d] disabled:opacity-60 disabled:cursor-not-allowed'>
                      {changePasswordMutation.isPending ? '변경 중...' : '변경하기'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {isLoggedIn ? (
              <div className='flex items-center justify-between rounded-2xl bg-[#f5f7f9] px-4 py-3'>
                <div>
                  <p className='text-[12px] font-semibold text-[#6b7785]'>로그아웃</p>
                  <p className='text-[10px] text-[#9aa5b1]'>현재 기기에서 로그아웃합니다.</p>
                </div>
                <Button
                  className='h-9 rounded-full bg-[#f43f5e] px-4 text-[12px] font-semibold text-white hover:bg-[#e11d48]'
                  onClick={() => setConfirmOpen(true)}>
                  로그아웃
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
        {isLoggedIn ? (
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>로그아웃하시겠습니까?</DialogTitle>
              </DialogHeader>
              <DialogFooter>
                <Button variant='outline' onClick={() => setConfirmOpen(false)}>
                  취소
                </Button>
                <Button
                  className='bg-[#f43f5e] hover:bg-[#e11d48]'
                  onClick={async () => {
                    await logout();
                    clearAuth();
                    setConfirmOpen(false);
                    navigate({ to: '/login' });
                  }}>
                  로그아웃
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      </main>
      <SellerFooterNav active='my' />
    </div>
  );
}
