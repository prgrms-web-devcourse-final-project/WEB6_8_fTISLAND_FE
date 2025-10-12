import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Store, Bike, Search, Crosshair } from 'lucide-react';
import {
  useGetAvailableProfiles,
  useSwitchProfile,
  useGetMyProfile1,
  useUpdateMyProfile1,
  useGetDeliveryArea,
  useUpdateAccountInfo1,
  useUpdateDeliveryArea,
} from '@/api/generated';
import { usePresignedUpload } from '@/lib/usePresignedUpload';
import { RiderPageLayout } from '../RiderPageLayout';
import { useKakaoLoader } from '@/lib/useKakaoLoader';
import { toast } from 'sonner';
import useLogout from '@/routes/login/_hooks/useLogout';
import { useAuthStore } from '@/store/auth';

export const Route = createFileRoute('/(dashboard)/rider/mypage/')({
  component: RouteComponent,
});

const PROFILE = {
  nickname: '빠른 라이더',
  address: '서울 성북구 동소문로25길 12 1층',
};

function RouteComponent() {
  const navigate = useNavigate();
  const [password, setPassword] = React.useState('');
  const [passwordConfirm, setPasswordConfirm] = React.useState('');
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

  const riderQuery = useGetMyProfile1();
  const profile = ((riderQuery.data as any)?.data?.content ?? undefined) as
    | { nickname?: string; profileImageUrl?: string }
    | undefined;
  const uploadMutation = usePresignedUpload();
  const updateMutation = useUpdateMyProfile1({
    mutation: {
      onSuccess: () => {
        try {
          riderQuery.refetch();
        } catch {}
      },
    },
  });

  const [nickname, setNickname] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState<string>('');
  const [bankName, setBankName] = React.useState('');
  const [bankAccountNumber, setBankAccountNumber] = React.useState('');
  const [bankAccountHolderName, setBankAccountHolderName] = React.useState('');
  const areaQuery = useGetDeliveryArea({ query: { staleTime: 10_000, refetchOnWindowFocus: false } } as any);
  const riderArea = ((areaQuery.data as any)?.data?.content ?? '') as string;
  const [areaText, setAreaText] = React.useState('');
  React.useEffect(() => {
    setAreaText(riderArea || '');
  }, [riderArea]);
  const updateAreaMutation = useUpdateDeliveryArea(); // PUT /users/me/rider/area (텍스트)
  const updateAccountMutation = useUpdateAccountInfo1({
    mutation: {
      onSuccess: () => {
        // 성공 토스트는 usePresignedUpload 내 전역 토스트와 겹치지 않음
      },
    },
  });
  React.useEffect(() => {
    if (profile) {
      setNickname(profile.nickname ?? '');
      setImageUrl(profile.profileImageUrl ?? '');
      // 서버에 계좌 정보가 포함된다면 여기서 초기값 세팅(없으면 빈값 유지)
    }
  }, [profile]);

  return (
    <RiderPageLayout>
      <main className='flex-1 space-y-5 overflow-y-auto pb-6 pt-8 sm:px-6 sm:pb-7 sm:pt-10'>
        <section className='flex flex-col items-center gap-4 text-center'>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt='프로필'
              className='size-24 rounded-full border border-[#e2e8f0] object-cover shadow-[0_18px_40px_-32px_rgba(15,23,42,0.35)]'
            />
          ) : (
            <div className='relative flex size-24 items-center justify-center rounded-full bg-[#e0f7f5] text-[24px] font-extrabold text-[#1ba7a1] shadow-[0_18px_40px_-32px_rgba(15,23,42,0.35)]'>
              {nickname ? nickname.charAt(0) : PROFILE.nickname.charAt(0)}
            </div>
          )}
          <div className='space-y-1'>
            <h1 className='text-[20px] font-extrabold text-[#1b1b1b]'>{nickname || PROFILE.nickname}</h1>
            <div className='flex items-center justify-center gap-2'>
              <span className='rounded-full bg-[#2ac1bc]/10 px-2 py-0.5 text-[11px] font-semibold text-[#1f6e6b]'>
                라이더
              </span>
              <span className='text-[13px] text-[#6b7785]'>{riderArea || PROFILE.address}</span>
            </div>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              className='h-9 rounded-full border-[#cbd8e2] text-[12px] font-semibold text-[#1b1b1b] hover:bg-[#f5f7f9]'
              onClick={() => navigate({ to: '/manage-address' })}>
              주소 관리
            </Button>
            <label className='inline-flex h-9 cursor-pointer items-center justify-center rounded-full bg-[#1ba7a1] px-4 text-[12px] font-semibold text-white hover:bg-[#17928d]'>
              이미지 변경
              <input
                type='file'
                accept='image/*'
                className='hidden'
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const { objectUrl } = await uploadMutation.mutateAsync({ file, domain: 'USER_PROFILE' as any });
                    setImageUrl(objectUrl);
                  } finally {
                    e.currentTarget.value = '';
                  }
                }}
              />
            </label>
          </div>
        </section>

        <Card className='border-none bg-white shadow-[0_20px_48px_-32px_rgba(15,23,42,0.28)]'>
          <CardContent className='space-y-3 px-4 py-4'>
            <div className='flex items-center justify-between'>
              <p className='text-[13px] font-semibold text-[#1b1b1b]'>역할별 프로필</p>
            </div>
            <div className='space-y-2 rounded-2xl bg-[#f5f7f9] p-4'>
              <Label className='text-[12px] font-semibold text-[#6b7785]'>정산 계좌 정보</Label>
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
                <Input
                  placeholder='은행명'
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
                />
                <Input
                  placeholder='계좌번호 (숫자만)'
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ''))}
                  className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
                />
                <Input
                  placeholder='예금주'
                  value={bankAccountHolderName}
                  onChange={(e) => setBankAccountHolderName(e.target.value)}
                  className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
                />
              </div>
              <div className='flex justify-end pt-2'>
                <Button
                  variant='outline'
                  className='h-9 rounded-full border-[#cbd8e2] px-4 text-[12px] font-semibold'
                  onClick={() => {
                    updateAccountMutation.mutate({
                      data: {
                        bankName: bankName || undefined,
                        bankAccountNumber: bankAccountNumber || undefined,
                        bankAccountHolderName: bankAccountHolderName || undefined,
                      },
                    } as any);
                  }}>
                  계좌 정보 저장
                </Button>
              </div>
            </div>
            <div className='grid grid-cols-3 gap-2'>
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
                    className='h-8 w-full rounded-full bg-[#2ac1bc] text-[10px] font-semibold text-white hover:bg-[#1ba7a1]'
                    onClick={() => navigate({ to: '/make-profile/customer' })}>
                    프로필 생성하기
                  </Button>
                )}
              </div>

              {/* 판매자 */}
              <div className='flex flex-col items-center gap-2 rounded-2xl border border-[#dbe4ec] bg-white p-3'>
                <div className='flex size-10 items-center justify-center rounded-full bg-[#fff3e0] text-[#fb923c]'>
                  <Store className='size-5' />
                </div>
                <p className='text-[12px] font-semibold text-[#1b1b1b]'>판매자</p>
                {available.includes('SELLER') ? (
                  <Button
                    size='sm'
                    className='h-8 w-full rounded-full bg-[#2ac1bc] text-[10px] font-semibold text-white hover:bg-[#1ba7a1]'
                    onClick={async () => {
                      await switchMutation.mutateAsync({ data: { targetProfileType: 'SELLER' } as any });
                    }}>
                    전환
                  </Button>
                ) : (
                  <Button
                    size='sm'
                    className='h-8 w-full rounded-full bg-[#2ac1bc] text-[10px] font-semibold text-white hover:bg-[#1ba7a1]'
                    onClick={() => navigate({ to: '/make-profile/seller' })}>
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
                {/* 현재 페이지는 RIDER이므로 전환 버튼 숨김; RIDER 없으면 생성 버튼 */}
                {!available.includes('RIDER') ? (
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
            <div className='space-y-2 rounded-2xl bg-[#f5f7f9] p-4'>
              <Label className='text-[12px] font-semibold text-[#6b7785]'>닉네임</Label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
                placeholder='닉네임을 입력해 주세요'
              />
              <div className='flex justify-end pt-2'>
                <Button
                  className='h-9 rounded-full bg-[#1ba7a1] px-4 text-[12px] font-semibold text-white hover:bg-[#17928d]'
                  onClick={() => updateMutation.mutate({ data: { nickname, profileImageUrl: imageUrl } } as any)}>
                  저장
                </Button>
              </div>
            </div>
            <RiderAreaSection
              value={areaText}
              onChange={setAreaText}
              onSave={async (text) => {
                try {
                  await updateAreaMutation.mutateAsync({ data: { deliveryArea: text || '' } } as any);
                  toast.success('배달 가능 지역이 저장되었습니다.');
                  await areaQuery.refetch();
                } catch (e: any) {
                  toast.error(e?.message ?? '배달 가능 지역 저장에 실패했습니다.');
                }
              }}
            />
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
          </CardContent>
        </Card>
      </main>
    </RiderPageLayout>
  );
}

function RiderAreaSection({
  value,
  onChange,
  onSave,
}: {
  value: string;
  onChange: (next: string) => void;
  onSave: (text: string) => Promise<void> | void;
}) {
  const { ready, ensure } = useKakaoLoader();
  const [mode, setMode] = React.useState<'search' | 'map'>('search');
  const [keyword, setKeyword] = React.useState('');
  const [results, setResults] = React.useState<Array<{ id: string; address: string; buildingName?: string }>>([]);
  const [searching, setSearching] = React.useState(false);
  const mapRef = React.useRef<HTMLDivElement | null>(null);
  const mapObjRef = React.useRef<any>(null);
  const geocoderRef = React.useRef<any>(null);
  const [displayAddress, setDisplayAddress] = React.useState<string>('');

  const runSearch = React.useCallback(() => {
    if (!keyword.trim()) return;
    setSearching(true);
    try {
      const w: any = window;
      if (!w?.kakao?.maps?.services) {
        setSearching(false);
        return;
      }
      const ps = new w.kakao.maps.services.Places();
      ps.keywordSearch(keyword, (data: any, status: any) => {
        if (status === w.kakao.maps.services.Status.OK) {
          const mapped = (data || []).map((item: any) => ({
            id: item.id,
            address: item.road_address_name || item.address_name,
            buildingName: item.place_name,
          }));
          setResults(mapped);
        } else {
          setResults([]);
        }
        setSearching(false);
      });
    } catch {
      setSearching(false);
    }
  }, [keyword]);

  React.useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        await ensure();
        if (cancelled || !mapRef.current) return;
        const w: any = window;
        const kakao = w.kakao;
        const map = new kakao.maps.Map(mapRef.current, {
          center: new kakao.maps.LatLng(37.5665, 126.978),
          level: 3,
        });
        mapObjRef.current = map;
        const geocoder = (geocoderRef.current ||= new kakao.maps.services.Geocoder());
        const update = () => {
          const c = map.getCenter();
          geocoder.coord2Address(c.getLng(), c.getLat(), (res: any, status: any) => {
            if (status === kakao.maps.services.Status.OK && res && res.length > 0) {
              const item = res[0];
              const road = item.road_address?.address_name as string | undefined;
              const jibun = item.address?.address_name as string | undefined;
              setDisplayAddress(road || jibun || '');
            }
          });
        };
        kakao.maps.event.addListener(map, 'center_changed', () => setTimeout(update, 200));
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const loc = new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
              map.setCenter(loc);
              update();
            },
            () => update(),
            { enableHighAccuracy: true, timeout: 8000 }
          );
        } else {
          update();
        }
      } catch {}
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [ensure, ready]);

  return (
    <div className='space-y-2 rounded-2xl bg-[#f5f7f9] p-4'>
      <Label className='text-[12px] font-semibold text-[#6b7785]'>배달 가능 지역</Label>
      <div className='grid grid-cols-2 gap-2'>
        <Button
          type='button'
          variant={mode === 'search' ? 'default' : 'outline'}
          className={
            mode === 'search' ? 'h-9 rounded-full bg-[#2ac1bc] text-white hover:bg-[#1ba7a1]' : 'h-9 rounded-full'
          }
          onClick={() => setMode('search')}>
          <Search className='mr-1 size-4' /> 검색으로 찾기
        </Button>
        <Button
          type='button'
          variant={mode === 'map' ? 'default' : 'outline'}
          className={
            mode === 'map' ? 'h-9 rounded-full bg-[#2ac1bc] text-white hover:bg-[#1ba7a1]' : 'h-9 rounded-full'
          }
          onClick={() => setMode('map')}>
          <Crosshair className='mr-1 size-4' /> 현재 위치로 설정
        </Button>
      </div>

      {mode === 'search' ? (
        <>
          <div className='flex items-center gap-2 rounded-2xl border border-[#bbe7e4] bg-[#f0fffd] px-3 py-2.5'>
            <Search className='size-[18px] text-[#2ac1bc]' aria-hidden />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  runSearch();
                }
              }}
              placeholder='예) 서울시 중구 세종대로 110'
              className='h-9 flex-1 border-0 bg-transparent text-[13px] text-[#1b1b1b] outline-none placeholder:text-[#9aa5b1]'
            />
            <Button
              type='button'
              size='sm'
              className='h-8 rounded-full bg-[#2ac1bc] px-4 text-[12px] font-semibold text-white hover:bg-[#1ba7a1]'
              onClick={runSearch}
              disabled={searching}>
              검색
            </Button>
          </div>
          {results.length > 0 ? (
            <ul className='max-h-56 space-y-2 overflow-y-auto rounded-2xl bg-white px-3 py-2 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)]'>
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type='button'
                    className='w-full rounded-xl px-3 py-2 text-left text-[13px] text-[#1b1b1b] transition-colors hover:bg-[#f5f7f9]'
                    onClick={() => {
                      onChange(r.address);
                      onSave(r.address);
                    }}>
                    <p className='font-semibold'>{r.address}</p>
                    {r.buildingName ? <p className='text-[12px] text-[#667085]'>{r.buildingName}</p> : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <>
          <div className='relative h-56 rounded-2xl overflow-hidden'>
            <div ref={mapRef} className='absolute inset-0 bg-[#e2f6f5]' />
            <div className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full z-50'>
              <div className='text-2xl'>📍</div>
            </div>
          </div>
          <div className='rounded-xl bg-white px-3 py-2 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)]'>
            <p className='text-[12px] text-[#1b1b1b]'>도로명 주소</p>
            <p className='text-[13px] font-semibold text-[#1b1b1b]'>{displayAddress || '주소를 확인 중입니다…'}</p>
          </div>
          <div className='flex justify-end'>
            <Button
              type='button'
              className='h-9 rounded-full bg-[#2ac1bc] px-4 text-[12px] font-semibold text-white hover:bg-[#1ba7a1]'
              onClick={() => displayAddress && onSave(displayAddress)}>
              선택 완료
            </Button>
          </div>
        </>
      )}

      <div className='flex justify-end gap-2 pt-2'>
        <Button
          variant='outline'
          className='h-9 rounded-full border-[#cbd8e2] px-4 text-[12px] font-semibold'
          onClick={() => onSave(value || displayAddress || '')}>
          저장
        </Button>
      </div>
    </div>
  );
}
