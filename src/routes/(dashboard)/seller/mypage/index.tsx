import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { SellerFooterNav } from '../_components/SellerFooterNav';
import { User, Store, Bike } from 'lucide-react';
import { useGetAvailableProfiles, useSwitchProfile, useGetMyInfo, useChangePassword } from '@/api/generated';
import type { ChangePasswordRequest } from '@/api/generated/model/changePasswordRequest';
import { toast } from 'sonner';
import useLogout from '@/routes/login/_hooks/useLogout';
import { useAuthStore } from '@/store/auth';
import { useUpdateStore, getGetStoreQueryKey, useGetStore } from '@/api/generated';
import { useQueryClient } from '@tanstack/react-query';
import { useKakaoLoader } from '@/lib/useKakaoLoader';
import { useStoreDetailsStore } from '@/store/storeDetails';

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
  const [addressOpen, setAddressOpen] = React.useState(false);
  const [searchKeyword, setSearchKeyword] = React.useState('');
  const [searching, setSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<
    Array<{ id: string; address: string; buildingName?: string; postalCode?: string; lat?: number; lng?: number }>
  >([]);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedPick, setSelectedPick] = React.useState<{
    id: string;
    address: string;
    buildingName?: string;
    postalCode?: string;
    lat?: number;
    lng?: number;
  } | null>(null);
  const [detailUnit, setDetailUnit] = React.useState('');
  const { ready: kakaoReady } = useKakaoLoader();
  const availableProfilesQuery = useGetAvailableProfiles();
  const available = ((availableProfilesQuery.data as any)?.data?.content?.availableProfiles ?? []) as string[];
  const switchMutation = useSwitchProfile({
    mutation: {
      onSuccess: (res) => {
        const content = (res as any)?.data?.content;
        let newAccessToken: string | undefined;
        try {
          const hdr = (res as any)?.headers?.authorization ?? (res as any)?.headers?.Authorization;
          newAccessToken =
            typeof hdr === 'string' && hdr.toLowerCase().startsWith('bearer ')
              ? hdr.slice(7)
              : typeof hdr === 'string'
                ? hdr
                : undefined;
        } catch {}
        const type = content?.currentProfileType ?? content?.currentActiveProfileType;
        const profileId = content?.currentProfileDetail?.profileId ?? content?.currentActiveProfileId;
        const storeId = content?.currentProfileDetail?.storeId ?? content?.storeId;
        useAuthStore.getState().setAuth({
          ...(newAccessToken ? { accessToken: newAccessToken } : {}),
          currentActiveProfileType: type,
          currentActiveProfileId: profileId,
          storeId,
        });
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
  const storeId = useAuthStore((s) => s.storeId);
  const qc = useQueryClient();
  const updateStoreMutation = useUpdateStore();
  const setSelectedStore = useStoreDetailsStore((s) => s.setSelectedStore);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const effectiveStoreId = Number.isFinite(storeId as any) ? (storeId as number) : undefined;
  const storeQuery = useGetStore(effectiveStoreId ?? 0, {
    query: { enabled: !!effectiveStoreId, staleTime: 10_000, refetchOnWindowFocus: false },
  } as any);

  // 내 정보 조회 및 표시값
  const myInfoQuery = useGetMyInfo();
  const my = (myInfoQuery.data as any)?.data?.content;
  const displayName =
    my?.currentProfileDetail?.nickname ?? my?.username ?? (my as any)?.name ?? FALLBACK_PROFILE.nickname;
  const addressText = (storeQuery.data as any)?.data?.content?.roadAddr ?? FALLBACK_PROFILE.address;

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
              className='h-9 rounded-full border-[#cbd8e2] px-4 text-[12px] font-semibold text-[#1b1b1b] hover:bg-[#f5f7f9]'
              onClick={() => setAddressOpen(true)}>
              주소 관리
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
      {/* 판매자 주소 관리 다이얼로그 */}
      <Dialog open={addressOpen} onOpenChange={setAddressOpen}>
        <DialogContent className='mx-auto w-[90%] max-w-[26rem] rounded-2xl border-0 p-0 shadow-2xl'>
          <DialogHeader className='px-5 pb-3 pt-4'>
            <DialogTitle className='text-[15px] font-semibold text-[#1b1b1b]'>상점 주소 관리</DialogTitle>
          </DialogHeader>
          <div className='space-y-3 px-5 pb-5'>
            <div className='rounded-2xl border border-[#bbe7e4] bg-[#f0fffd] p-3'>
              <Label className='mb-1 block text-[12px] font-semibold text-[#1b1b1b]'>주소 검색</Label>
              <div className='flex items-center gap-2'>
                <Input
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder='예) 서울시 중구 세종대로 110'
                  className='h-9 flex-1 text-[13px]'
                />
                <Button
                  type='button'
                  disabled={!kakaoReady || searching || !searchKeyword.trim()}
                  aria-busy={searching}
                  className='h-9 rounded-full bg-[#2ac1bc] px-3 text-[12px] font-semibold text-white hover:bg-[#1ba7a1]'
                  onClick={() => {
                    try {
                      setSearching(true);
                      const w: any = window;
                      if (!w?.kakao?.maps?.services) {
                        toast.error('지도를 초기화하는 중입니다. 잠시 후 다시 시도해 주세요.');
                        setSearching(false);
                        return;
                      }
                      const ps = new w.kakao.maps.services.Places();
                      ps.keywordSearch(
                        searchKeyword,
                        (data: any, status: any) => {
                          const ok = w.kakao.maps.services.Status.OK;
                          if (status === ok && data) {
                            const mapped = (data || []).map((item: any) => ({
                              id: item.id,
                              address: item.road_address_name || item.address_name,
                              buildingName: item.place_name,
                              postalCode: item.road_address?.zone_no,
                              lat: item.y ? Number(item.y) : undefined,
                              lng: item.x ? Number(item.x) : undefined,
                            }));
                            setSearchResults(mapped);
                          } else {
                            setSearchResults([]);
                          }
                          setSearching(false);
                        },
                        { page: 1, size: 10 }
                      );
                    } catch {
                      setSearching(false);
                    }
                  }}>
                  검색
                </Button>
              </div>
              <p className='mt-1 text-[11px] text-[#6b7785]'>카카오 지도 검색으로 좌표를 저장합니다.</p>
            </div>
            {searchResults.length > 0 ? (
              <ul className='max-h-60 space-y-2 overflow-y-auto rounded-2xl bg-white px-3 py-2 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)]'>
                {searchResults.map((item) => (
                  <li key={item.id}>
                    <button
                      type='button'
                      className='w-full rounded-xl px-3 py-2 text-left text-[13px] text-[#1b1b1b] transition-colors hover:bg-[#f5f7f9]'
                      onClick={() => {
                        setSelectedPick(item);
                        setDetailUnit('');
                        setDetailOpen(true);
                      }}>
                      <p className='font-semibold'>{item.address}</p>
                      {item.buildingName ? <p className='text-[12px] text-[#667085]'>{item.buildingName}</p> : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : searching ? (
              <p className='px-2 text-[12px] text-[#6b7785]'>주소를 검색 중입니다…</p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className='mx-auto w-[90%] max-w-[26rem] rounded-2xl border-0 p-0 shadow-2xl'>
          <DialogHeader className='px-5 pb-3 pt-4'>
            <DialogTitle className='text-[15px] font-semibold text-[#1b1b1b]'>상세 주소 입력</DialogTitle>
          </DialogHeader>
          {selectedPick ? (
            <div className='space-y-3 px-5 pb-5'>
              <div className='rounded-xl bg-white px-3 py-2 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)]'>
                <p className='text-[12px] text-[#6b7785]'>선택한 주소</p>
                <p className='text-[13px] font-semibold text-[#1b1b1b]'>{selectedPick.address}</p>
                {selectedPick.buildingName ? (
                  <p className='text-[11px] text-[#94a3b8]'>{selectedPick.buildingName}</p>
                ) : null}
              </div>
              <div className='space-y-2'>
                <Label className='text-[12px] font-semibold text-[#1b1b1b]'>상세 주소</Label>
                <Input
                  value={detailUnit}
                  onChange={(e) => setDetailUnit(e.target.value)}
                  placeholder='예) 101동 1203호'
                  className='h-9 text-[13px]'
                />
              </div>
              <div className='flex justify-end'>
                <Button
                  type='button'
                  className='h-9 rounded-full bg-[#2ac1bc] px-4 text-[12px] font-semibold text-white hover:bg-[#1ba7a1]'
                  disabled={updateStoreMutation.isPending}
                  aria-busy={updateStoreMutation.isPending}
                  onClick={() => {
                    if (!storeId || !selectedPick) return;
                    const roadAddr = `${selectedPick.address}${detailUnit.trim() ? ` ${detailUnit.trim()}` : ''}`;
                    const lat = selectedPick.lat ?? 0;
                    const lng = selectedPick.lng ?? 0;
                    updateStoreMutation.mutate(
                      { storeId, data: { roadAddr, lat, lng } as any },
                      {
                        onSuccess: () => {
                          toast.success('상점 주소가 업데이트되었어요.');
                          try {
                            qc.invalidateQueries({ queryKey: getGetStoreQueryKey(storeId) as any });
                          } catch {}
                          try {
                            setSelectedStore({ id: storeId, roadAddr, lat, lng });
                          } catch {}
                          setDetailOpen(false);
                          setAddressOpen(false);
                        },
                        onError: () => {
                          toast.error('주소 업데이트에 실패했어요. 잠시 후 다시 시도해 주세요.');
                        },
                      }
                    );
                  }}>
                  저장
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
