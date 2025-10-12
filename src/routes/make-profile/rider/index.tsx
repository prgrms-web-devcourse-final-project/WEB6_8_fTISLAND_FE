import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Camera, Clock4, IdCard, MapPin, Phone, ShieldCheck, Upload, Users, Search, Crosshair } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { usePresignedUpload } from '@/lib/usePresignedUpload';
import { GeneratePresignedUrlRequestDomain } from '@/api/generated/model/generatePresignedUrlRequestDomain';
import { useCreateProfile, useUpdateDeliveryArea } from '@/api/generated';
import { CreateProfileRequestProfileType } from '@/api/generated/model/createProfileRequestProfileType';
import { toast } from 'sonner';
import { useKakaoLoader } from '@/lib/useKakaoLoader';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export const Route = createFileRoute('/make-profile/rider/')({
  component: RouteComponent,
});

interface RiderProfileFormValues {
  nickname: string;
  vehicleType: 'MOTORCYCLE' | 'BICYCLE' | 'CAR' | '';
  vehicleNumber: string;
  licenseNumber: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  profileImage: FileList | undefined;
  profileImageUrl: string;
  serviceArea: string;
}

const PREP_STEPS = [
  { icon: MapPin, label: '배달 가능 지역을 미리 정리해 주세요.' },
  { icon: Clock4, label: '활동 가능 시간대를 입력해 주세요.' },
  { icon: Camera, label: '프로필 사진을 준비해 주세요.' },
  { icon: ShieldCheck, label: '면허 정보를 입력해 주세요.' },
];

function RouteComponent() {
  const profileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting, isValid },
  } = useForm<RiderProfileFormValues>({
    mode: 'onChange',
    defaultValues: {
      nickname: '',
      vehicleType: '',
      vehicleNumber: '',
      licenseNumber: '',
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      profileImage: undefined,
      profileImageUrl: '',
      serviceArea: '',
    },
  });

  const profileImageFile = watch('profileImage');
  const profileImageName = useMemo(() => profileImageFile?.[0]?.name ?? '', [profileImageFile]);

  const uploadMutation = usePresignedUpload();
  const navigate = useNavigate();
  const createProfileMutation = useCreateProfile();
  const updateAreaMutation = useUpdateDeliveryArea();

  const onSubmit = useCallback(
    async (data: RiderProfileFormValues) => {
      await createProfileMutation.mutateAsync({
        data: {
          profileType: CreateProfileRequestProfileType.RIDER,
          profileData: {
            nickname: data.nickname,
            vehicleType: data.vehicleType || undefined,
            vehicleNumber: data.vehicleNumber || undefined,
            licenseNumber: data.licenseNumber || undefined,
            bankName: data.bankName || undefined,
            accountNumber: data.accountNumber || undefined,
            accountHolder: data.accountHolder || undefined,
            profileImageUrl: data.profileImageUrl || undefined,
          },
        },
      });
      if (data.serviceArea?.trim()) {
        await updateAreaMutation.mutateAsync({ data: { deliveryArea: data.serviceArea.trim() } } as any);
      }
      toast.success('라이더 프로필이 생성되었습니다.');
      navigate({ to: '/rider' });
    },
    [createProfileMutation, updateAreaMutation, navigate]
  );

  // const onSaveDraft = useCallback((data: RiderProfileFormValues) => {
  //   console.log('rider profile draft', data);
  // }, []);

  const { ref: registerProfileImageRef, ...profileImageRegister } = register('profileImage');

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className='flex min-h-[100dvh] w-full flex-col bg-[#2ac1bc] shadow-[0_32px_80px_-40px_rgba(26,86,75,0.55)]'
      encType='multipart/form-data'>
      <header className='relative px-4 pb-6 pt-9 text-white sm:px-6 sm:pt-10'>
        <div className='absolute inset-x-5 bottom-0 h-[1px] bg-white/30 sm:inset-x-6' aria-hidden />
        <div className='flex items-center justify-between gap-2'>
          <span className='text-[10px] font-semibold uppercase tracking-[0.3em] sm:text-[11px] sm:tracking-[0.35em]'>
            rider profile
          </span>
        </div>
        <h1 className='mt-4 text-[1.75rem] font-extrabold leading-tight sm:mt-5 sm:text-3xl'>
          동네 생활을 잇는
          <br />
          믿음직한 라이더가 되어주세요
        </h1>
        <p className='mt-2.5 text-[13px] leading-relaxed text-white/80 sm:mt-3 sm:text-sm'>
          골목 심부름부터 신속 배달까지,
          <br />
          라이더 정보만 등록하면 바로 매칭을 시작할 수 있어요.
        </p>
        <div className='mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold text-white/90 sm:gap-2 sm:px-3 sm:text-[11px]'>
          <span className='inline-block size-1.5 rounded-full bg-[#ffe14a] sm:size-2' />
          라이더 검수는 영업일 기준 1일 이내 완료돼요
        </div>
      </header>

      <main className='flex-1 space-y-4 overflow-y-auto rounded-t-[1.5rem] bg-[#f8f9fa] px-4 pb-6 pt-6 outline outline-[1.5px] outline-[#2ac1bc]/15 sm:space-y-5 sm:rounded-t-[1.75rem] sm:px-6 sm:pb-7 sm:pt-7'>
        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='space-y-2 pb-2.5 sm:pb-3'>
            <CardTitle className='text-[15px] font-semibold text-[#2ac1bc] sm:text-base'>라이더 준비 체크</CardTitle>
            <CardDescription className='text-[12px] text-[#4a4a4a] sm:text-[13px]'>
              활동 전 아래 항목을 먼저 준비해 두면 승인 시간이 단축돼요.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-2.5 sm:space-y-3'>
            {PREP_STEPS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className='flex items-center gap-2.5 rounded-xl bg-[#f0fffd] px-3 py-2 text-[13px] text-[#1f6e6b] sm:gap-3 sm:py-2.5 sm:text-sm'>
                <span className='mt-0.5 flex size-7 items-center justify-center rounded-full bg-[#2ac1bc]/10 text-[#2ac1bc] sm:size-8'>
                  <Icon className='size-[15px] sm:size-4' strokeWidth={2} />
                </span>
                <span className='leading-snug'>{label}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='space-y-2 pb-2.5 sm:pb-3'>
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b] sm:text-lg'>프로필 기본 정보</CardTitle>
            <CardDescription className='text-[12px] text-[#5c5c5c] sm:text-sm'>
              고객과 안전하게 소통할 수 있도록 정확한 정보를 입력해 주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <FieldRow icon={Users} label='닉네임' error={errors.nickname?.message}>
              <div className='flex items-center gap-2'>
                <Input
                  placeholder='배달 시 사용될 이름을 입력해 주세요'
                  className='h-10 flex-1 rounded-xl border-[#dbe4ec] text-[13px] sm:h-11 sm:text-sm'
                  {...register('nickname', {
                    required: '닉네임을 입력해 주세요.',
                  })}
                />
              </div>
            </FieldRow>

            {/* <FieldRow icon={MapPin} label='배달 가능 주소' error={errors.serviceArea?.message}>
              <Input
                placeholder='예) 성북구 전체, 동선동·보문동'
                className='h-10 rounded-xl border-[#dbe4ec] text-[13px] sm:h-11 sm:text-sm'
                {...register('serviceArea', {
                  required: '배달 가능 지역을 입력해 주세요.',
                })}
              />
            </FieldRow> */}

            <FieldRow icon={Users} label='운송 수단' error={errors.vehicleType as any}>
              <Controller
                control={control}
                name='vehicleType'
                rules={{ required: '운송 수단을 선택해 주세요.' }}
                render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <SelectTrigger className='h-10 rounded-xl border-[#dbe4ec] text-[13px] sm:h-11 sm:text-sm'>
                      <SelectValue placeholder='운송 수단을 선택하세요' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='MOTORCYCLE'>오토바이</SelectItem>
                      <SelectItem value='BICYCLE'>자전거</SelectItem>
                      <SelectItem value='CAR'>자동차</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FieldRow>

            <FieldRow icon={Phone} label='연락 가능한 번호'>
              <Input
                placeholder='예) 010-1234-5678'
                className='h-10 rounded-xl border-[#dbe4ec] text-[13px] sm:h-11 sm:text-sm'
              />
            </FieldRow>

            <FieldRow icon={IdCard} label='차량 번호'>
              <Input
                placeholder='예) 12가3456'
                className='h-10 rounded-xl border-[#dbe4ec] text-[13px] sm:h-11 sm:text-sm'
                {...register('vehicleNumber')}
              />
            </FieldRow>

            <FieldRow icon={IdCard} label='면허 번호'>
              <Input
                placeholder='예) 21-123456-01'
                className='h-10 rounded-xl border-[#dbe4ec] text-[13px] sm:h-11 sm:text-sm'
                {...register('licenseNumber')}
              />
            </FieldRow>
          </CardContent>
        </Card>

        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='space-y-2 pb-2.5 sm:pb-3'>
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b] sm:text-lg'>프로필 사진</CardTitle>
            <CardDescription className='text-[12px] text-[#5c5c5c] sm:text-sm'>
              얼굴이 잘 보이는 사진을 등록하면 고객 신뢰도가 높아져요.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-2'>
            <Label className='flex items-center gap-2 text-[13px] font-semibold text-[#1b1b1b] sm:text-sm'>
              <Camera className='size-4 text-[#2ac1bc]' />
              프로필 사진 업로드
            </Label>
            <div className='flex items-center gap-3 rounded-2xl border border-dashed border-[#bbe7e4] bg-[#f0fffd] px-3.5 py-3.5 sm:px-4 sm:py-4'>
              <div className='flex size-12 items-center justify-center rounded-xl bg-white text-[#2ac1bc] shadow-sm sm:size-14'>
                <Upload className='size-[18px] sm:size-5' aria-hidden />
              </div>
              <div className='flex-1 space-y-1'>
                <p className='text-sm font-semibold text-[#1b1b1b]'>
                  얼굴이 정면으로 보이는
                  <br />
                  사진을 등록해 주세요
                </p>
                <p className='text-[12px] text-[#6b7785] sm:text-xs'>
                  PNG/JPG
                  <br />
                  10MB 이하 권장
                </p>
                {profileImageName ? (
                  <p className='text-[11px] text-[#1f6e6b] sm:text-xs'>선택한 파일: {profileImageName}</p>
                ) : null}
              </div>
              <Button
                type='button'
                variant='outline'
                className='h-9 rounded-full border-[#2ac1bc]/50 px-3 text-[12px] font-semibold text-[#2ac1bc] hover:bg-[#2ac1bc]/10 sm:px-4 sm:text-xs'
                onClick={() => profileInputRef.current?.click()}>
                파일 선택
              </Button>
              <input
                type='file'
                accept='image/*'
                className='hidden'
                {...profileImageRegister}
                ref={(node) => {
                  profileInputRef.current = node;
                  registerProfileImageRef(node);
                }}
                onChange={async (e) => {
                  // propagate to RHF
                  profileImageRegister.onChange?.(e);
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  try {
                    const { objectUrl } = await uploadMutation.mutateAsync({
                      file,
                      domain: GeneratePresignedUrlRequestDomain.USER_PROFILE,
                    });
                    setValue('profileImageUrl', objectUrl, { shouldDirty: true });
                    toast.success('이미지 업로드 완료');
                  } finally {
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <input type='hidden' {...register('profileImageUrl')} />
            </div>
            {watch('profileImageUrl') ? (
              <div className='pt-2'>
                <img
                  src={watch('profileImageUrl')}
                  alt='미리보기'
                  className='h-24 w-24 rounded-xl border border-[#e2e8f0] object-cover shadow-sm'
                />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='space-y-2 pb-2.5 sm:pb-3'>
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b] sm:text-lg'>배달 가능 주소</CardTitle>
            <CardDescription className='text-[12px] text-[#5c5c5c] sm:text-sm'>
              검색 또는 지도에서 중앙 핀 위치로 배달 가능 주소를 설정하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            <MakeRiderAreaSection
              value={watch('serviceArea')}
              onChange={(text) => setValue('serviceArea', text, { shouldDirty: true })}
              onApply={async (text) => {
                if (!text?.trim()) return;
                try {
                  await updateAreaMutation.mutateAsync({ data: { deliveryArea: text.trim() } } as any);
                  toast.success('배달 가능 지역이 적용되었습니다.');
                } catch (e: any) {
                  toast.error(e?.message ?? '배달 가능 지역 적용에 실패했습니다.');
                }
              }}
            />
          </CardContent>
        </Card>

        {/* <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='space-y-2 pb-2.5 sm:pb-3'>
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b] sm:text-lg'>활동 정보</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <FieldRow icon={CalendarClock} label='활동 가능 시간'>
              <div className='grid grid-cols-2 gap-3'>
                <Input
                  type='time'
                  className='h-10 rounded-xl border-[#dbe4ec] text-[13px] sm:h-11 sm:text-sm'
                  {...register('startTime')}
                />
                <Input
                  type='time'
                  className='h-10 rounded-xl border-[#dbe4ec] text-[13px] sm:h-11 sm:text-sm'
                  {...register('endTime')}
                />
              </div>
            </FieldRow>

            <FieldRow icon={Navigation} label='라이더 경험 기간'>
              <Input
                placeholder='경험 개월 수를 입력해 주세요 (예: 12)'
                className='h-10 rounded-xl border-[#dbe4ec] text-[13px] sm:h-11 sm:text-sm'
                {...register('experienceMonths')}
              />
            </FieldRow>
          </CardContent>
        </Card> */}

        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='space-y-2 pb-2.5 sm:pb-3'>
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b] sm:text-lg'>정산 계좌 정보</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <FieldRow icon={IdCard} label='은행명'>
              <Input
                placeholder='예) 국민은행'
                className='h-10 rounded-xl border-[#dbe4ec] text-[13px] sm:h-11 sm:text-sm'
                {...register('bankName')}
              />
            </FieldRow>
            <FieldRow icon={IdCard} label='계좌번호'>
              <Input
                placeholder='숫자만 입력'
                className='h-10 rounded-xl border-[#dbe4ec] text-[13px] sm:h-11 sm:text-sm'
                {...register('accountNumber')}
              />
            </FieldRow>
            <FieldRow icon={IdCard} label='예금주'>
              <Input
                placeholder='예) 김배달'
                className='h-10 rounded-xl border-[#dbe4ec] text-[13px] sm:h-11 sm:text-sm'
                {...register('accountHolder')}
              />
            </FieldRow>
          </CardContent>
        </Card>
      </main>

      <footer className='border-t border-white/20 bg-[#2ac1bc] px-6 py-5 text-center text-[11px] font-semibold text-white/80'>
        오늘도 동네와 사람을 잇는 라이더가 되어 보세요. 뭐든배달이 함께할게요!
        <div className='mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center'>
          <Button
            type='submit'
            disabled={isSubmitting || !isValid}
            className='h-10 w-full rounded-full bg-[#1ba7a1] text-[13px] font-semibold text-white hover:bg-[#17928d] disabled:cursor-not-allowed disabled:opacity-70 sm:h-11 sm:w-auto sm:px-8'>
            라이더 프로필 제출하기
          </Button>
        </div>
      </footer>
    </form>
  );
}

function MakeRiderAreaSection({
  value,
  onChange,
  onApply,
}: {
  value: string;
  onChange: (text: string) => void;
  onApply: (text: string) => Promise<void> | void;
}) {
  const { ready, ensure } = useKakaoLoader();
  const [mode, setMode] = useState<'search' | 'map'>('search');
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Array<{ id: string; address: string; buildingName?: string }>>([]);
  const [searching, setSearching] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapObjRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const [displayAddress, setDisplayAddress] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        if (mode !== 'map') return;
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
              const addr = road || jibun || '';
              setDisplayAddress(addr);
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
  }, [ensure, ready, mode]);

  const runSearch = React.useCallback(async () => {
    if (!keyword.trim()) return;
    setSearching(true);
    try {
      await ensure();
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
  }, [keyword, ensure]);

  return (
    <div className='space-y-3'>
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
                    onClick={async () => {
                      onChange(r.address);
                      await onApply(r.address);
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
              onClick={async () => {
                onChange(displayAddress);
                await onApply(displayAddress);
              }}>
              선택 완료
            </Button>
          </div>
        </>
      )}

      <Input
        placeholder='예) 성북구 전체, 동선동·보문동'
        value={value}
        readOnly
        className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
      />
    </div>
  );
}

type FieldRowProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  children: React.ReactNode;
  error?: string;
};

function FieldRow({ icon: Icon, label, children, error }: FieldRowProps) {
  return (
    <section className='space-y-2'>
      <Label className='flex items-center gap-2 text-[13px] font-semibold text-[#1b1b1b] sm:text-sm'>
        <Icon className='size-4 text-[#2ac1bc]' aria-hidden />
        {label}
      </Label>
      {children}
      {error ? <p className='text-[11px] text-[#f43f5e] sm:text-xs'>{error}</p> : null}
    </section>
  );
}
