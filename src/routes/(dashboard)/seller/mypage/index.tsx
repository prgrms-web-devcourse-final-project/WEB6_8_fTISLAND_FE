import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { SellerFooterNav } from '../_components/SellerFooterNav';
import { User, Store, Bike } from 'lucide-react';
import useLogout from '@/routes/login/_hooks/useLogout';
import { useAuthStore } from '@/store/auth';

// footer items are rendered by SellerFooterNav directly

export const Route = createFileRoute('/(dashboard)/seller/mypage/')({
  component: RouteComponent,
});

const STORE_PROFILE = {
  nickname: '골목 안 소담상회',
  address: '서울 성북구 동소문로25길 12 1층',
  ownerName: '김사장',
  phone: '010-1234-5678',
};

function RouteComponent() {
  const navigate = useNavigate();
  const [password, setPassword] = React.useState('');
  const [passwordConfirm, setPasswordConfirm] = React.useState('');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false);
  const [keyboardOffset, setKeyboardOffset] = React.useState(0);
  const [roleProfiles] = React.useState<{
    seller?: { nickname: string };
    customer?: { nickname: string } | null;
    rider?: { nickname: string } | null;
  }>({
    seller: { nickname: STORE_PROFILE.ownerName },
    customer: null,
    rider: null,
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
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  return (
    <div className='flex min-h-[100dvh] w-full flex-col bg-[#f8f9fa] text-[#1b1b1b]'>
      <main className='flex-1 space-y-5 overflow-y-auto px-4 pb-28 pt-8 sm:px-6 sm:pb-32 sm:pt-10'>
        <section className='flex flex-col items-center gap-4 text-center'>
          <div className='relative flex size-24 items-center justify-center rounded-full bg-[#e0f7f5] text-[24px] font-extrabold text-[#1ba7a1] shadow-[0_18px_40px_-32px_rgba(15,23,42,0.35)]'>
            {STORE_PROFILE.ownerName.charAt(0)}
          </div>
          <div className='space-y-1'>
            <h1 className='text-[20px] font-extrabold text-[#1b1b1b]'>{STORE_PROFILE.nickname}</h1>
            <p className='text-[13px] text-[#6b7785]'>{STORE_PROFILE.address}</p>
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
              {roleProfiles.seller ? (
                <p className='text-[12px] text-[#6b7785]'>{roleProfiles.seller.nickname}</p>
              ) : (
                <Button
                  size='sm'
                  className='h-8 w-full rounded-full bg-[#1ba7a1] text-[10px] font-semibold text-white hover:bg-[#17928d]'
                  onClick={() => navigate({ to: '/make-profile/seller' })}>
                  프로필 생성하기
                </Button>
              )}
            </div>

            {/* 소비자 */}
            <div className='flex flex-col items-center gap-2 rounded-2xl border border-[#dbe4ec] bg-white p-3'>
              <div className='flex size-10 items-center justify-center rounded-full bg-[#e0f7f5] text-[#1ba7a1]'>
                <User className='size-5' />
              </div>
              <p className='text-[12px] font-semibold text-[#1b1b1b]'>소비자</p>
              {roleProfiles.customer ? (
                <p className='text-[12px] text-[#6b7785]'>{roleProfiles.customer.nickname}</p>
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
              {roleProfiles.rider ? (
                <p className='text-[12px] text-[#6b7785]'>{roleProfiles.rider.nickname}</p>
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
                <p className='text-[13px] font-semibold text-[#1b1b1b]'>{STORE_PROFILE.phone}</p>
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
                    setPassword('');
                    setPasswordConfirm('');
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
                      <Label htmlFor='new-password' className='text-[12px] font-semibold text-[#1b1b1b]'>
                        변경할 비밀번호
                      </Label>
                      <Input
                        id='new-password'
                        type='password'
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className='h-10 rounded-xl border-[#dbe4ec] text-[13px]'
                        placeholder='새 비밀번호를 입력해 주세요'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='confirm-password' className='text-[12px] font-semibold text-[#1b1b1b]'>
                        비밀번호 확인
                      </Label>
                      <Input
                        id='confirm-password'
                        type='password'
                        value={passwordConfirm}
                        onChange={(event) => setPasswordConfirm(event.target.value)}
                        className='h-10 rounded-xl border-[#dbe4ec] text-[13px]'
                        placeholder='비밀번호를 다시 입력해 주세요'
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button className='h-10 w-full rounded-full bg-[#1ba7a1] text-[13px] font-semibold text-white hover:bg-[#17928d]'>
                      변경하기
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
      </main>
      <SellerFooterNav active='my' />
    </div>
  );
}
