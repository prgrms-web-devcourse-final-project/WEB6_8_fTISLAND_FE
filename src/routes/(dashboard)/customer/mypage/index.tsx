import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Store, Bike } from 'lucide-react';
import useLogout from '@/routes/login/_hooks/useLogout';
import { useAuthStore } from '@/store/auth';
import { useGetMyInfo, useGetAddress, useGetAvailableProfiles, useSwitchProfile } from '@/api/generated';
import { useChangePassword } from '@/api/generated';
import type { ChangePasswordRequest } from '@/api/generated/model/changePasswordRequest';
import { toast } from 'sonner';

export const Route = createFileRoute('/(dashboard)/customer/mypage/')({
  component: RouteComponent,
});

const PROFILE = {
  nickname: '맛있는 김치찜',
  address: '서울 성북구 동소문로25길 12 1층',
};

function RouteComponent() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false);
  const [keyboardOffset, setKeyboardOffset] = React.useState(0);
  // roleProfiles mock removed; using availableProfiles + switch API instead

  React.useEffect(() => {
    if (!isPasswordDialogOpen || typeof window === 'undefined') {
      setKeyboardOffset(0);
      return;
    }
    const viewport = window.visualViewport;
    if (!viewport) return;
    const handleViewportChange = () => {
      const keyboardHeight = Math.max(0, window.innerHeight - (viewport.height + viewport.offsetTop));
      if (keyboardHeight === 0) return setKeyboardOffset(0);
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
  const [confirmOpen, setConfirmOpen] = React.useState(false);
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

  const myInfoQuery = useGetMyInfo();
  const my = (myInfoQuery.data as any)?.data?.content;
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
  const defaultAddressId = my?.currentProfileDetail?.defaultAddressId as number | undefined;
  const addressQuery = useGetAddress(defaultAddressId ?? 0, { query: { enabled: !!defaultAddressId } } as any);
  const addressText = (addressQuery.data as any)?.data?.content?.address ?? PROFILE.address;
  const displayEmail = my?.email ?? 'example@domain.com';
  const displayName = my?.currentProfileDetail?.nickname ?? my?.username ?? (my as any)?.name ?? PROFILE.nickname;
  const roleLabel =
    my?.currentActiveProfileType === 'SELLER'
      ? '판매자'
      : my?.currentActiveProfileType === 'RIDER'
        ? '라이더'
        : '소비자';

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
            <div className='flex items-center justify-center gap-2'>
              <span className='rounded-full bg-[#2ac1bc]/10 px-2 py-0.5 text-[11px] font-semibold text-[#1f6e6b]'>
                {roleLabel}
              </span>
              <span className='text-[13px] text-[#6b7785]'>{addressText}</span>
            </div>
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

        <Card className='border-none bg-white shadow-[0_20px_48px_-32px_rgba(15,23,42,0.28)]'>
          <CardContent className='space-y-3 px-4 py-4'>
            <div className='flex items-center justify-between'>
              <p className='text-[13px] font-semibold text-[#1b1b1b]'>역할별 프로필</p>
            </div>
            <div className='grid grid-cols-3 gap-2'>
              {/* 소비자 */}
              <div className='flex flex-col items-center gap-2 rounded-2xl border border-[#dbe4ec] bg-white p-3'>
                <div className='flex size-10 items-center justify-center rounded-full bg-[#e0f7f5] text-[#1ba7a1]'>
                  <User className='size-5' />
                </div>
                <p className='text-[12px] font-semibold text-[#1b1b1b]'>소비자</p>
                {available.includes('CUSTOMER') && my?.currentActiveProfileType !== 'CUSTOMER' ? (
                  <Button
                    size='sm'
                    className='h-8 w-full rounded-full bg-[#2ac1bc] text-[10px] font-semibold text-white hover:bg-[#1ba7a1]'
                    onClick={async () => {
                      await switchMutation.mutateAsync({ data: { targetProfileType: 'CUSTOMER' } as any });
                    }}>
                    전환
                  </Button>
                ) : !available.includes('CUSTOMER') ? (
                  <Button
                    size='sm'
                    className='h-8 w-full rounded-full bg-[#2ac1bc] text-[10px] font-semibold text-white hover:bg-[#1ba7a1]'
                    onClick={() => navigate({ to: '/make-profile/customer' })}>
                    프로필 생성하기
                  </Button>
                ) : null}
              </div>

              {/* 판매자 */}
              <div className='flex flex-col items-center gap-2 rounded-2xl border border-[#dbe4ec] bg-white p-3'>
                <div className='flex size-10 items-center justify-center rounded-full bg-[#fff3e0] text-[#fb923c]'>
                  <Store className='size-5' />
                </div>
                <p className='text-[12px] font-semibold text-[#1b1b1b]'>판매자</p>
                {available.includes('SELLER') && my?.currentActiveProfileType !== 'SELLER' ? (
                  <Button
                    size='sm'
                    className='h-8 w-full rounded-full bg-[#2ac1bc] text-[10px] font-semibold text-white hover:bg-[#1ba7a1]'
                    onClick={async () => {
                      await switchMutation.mutateAsync({ data: { targetProfileType: 'SELLER' } as any });
                    }}>
                    전환
                  </Button>
                ) : !available.includes('SELLER') ? (
                  <Button
                    size='sm'
                    className='h-8 w-full rounded-full bg-[#2ac1bc] text-[10px] font-semibold text-white hover:bg-[#1ba7a1]'
                    onClick={() => navigate({ to: '/make-profile/seller' })}>
                    프로필 생성하기
                  </Button>
                ) : null}
              </div>

              {/* 라이더 */}
              <div className='flex flex-col items-center gap-2 rounded-2xl border border-[#dbe4ec] bg-white p-3'>
                <div className='flex size-10 items-center justify-center rounded-full bg-[#e5e7ff] text-[#6366f1]'>
                  <Bike className='size-5' />
                </div>
                <p className='text-[12px] font-semibold text-[#1b1b1b]'>라이더</p>
                {available.includes('RIDER') && my?.currentActiveProfileType !== 'RIDER' ? (
                  <Button
                    size='sm'
                    className='h-8 w-full rounded-full bg-[#2ac1bc] text-[10px] font-semibold text-white hover:bg-[#1ba7a1]'
                    onClick={async () => {
                      await switchMutation.mutateAsync({ data: { targetProfileType: 'RIDER' } as any });
                    }}>
                    전환
                  </Button>
                ) : !available.includes('RIDER') ? (
                  <Button
                    size='sm'
                    className='h-8 w-full rounded-full bg-[#2ac1bc] text-[10px] font-semibold text-white hover:bg-[#1ba7a1]'
                    onClick={() => navigate({ to: '/make-profile/rider' })}>
                    프로필 생성하기
                  </Button>
                ) : null}
              </div>
            </div>
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
          </CardContent>
        </Card>
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

        <Card className='border-none bg-white shadow-[0_20px_48px_-32px_rgba(15,23,42,0.28)]'>
          <CardContent className='space-y-3 px-4 py-4'>
            <div className='flex items-center justify-between rounded-2xl bg-[#f5f7f9] px-4 py-3'>
              <div>
                <p className='text-[12px] font-semibold text-[#6b7785]'>계정 아이디</p>
                <p className='text-[13px] font-semibold text-[#1b1b1b]'>{displayEmail}</p>
              </div>
            </div>
            <div className='flex items-center justify-between rounded-2xl bg-[#f5f7f9] px-4 py-3'>
              <div>
                <p className='text-[12px] font-semibold text-[#6b7785]'>비밀번호</p>
                <p className='text-[10px] font-semibold text-[#1b1b1b]'>
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
                      className='h-10 w-full rounded-full bg-[#1ba7a1] text-[13px] font-semibold text-white hover:bg-[#17928d] disabled:opacity-60 disabled:cursor-not-allowed'>
                      {changePasswordMutation.isPending ? '변경 중...' : '변경하기'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
