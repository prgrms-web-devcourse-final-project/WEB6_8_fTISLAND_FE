import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createFileRoute } from '@tanstack/react-router';
import { Camera, Clock4, IdCard, MapPin, Phone, ShieldCheck, Upload, Users } from 'lucide-react';
import { useCallback, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';

export const Route = createFileRoute('/make-profile/rider/')({
  component: RouteComponent,
});

interface RiderProfileFormValues {
  nickname: string;
  serviceArea: string;
  phone: string;
  licenseNumber: string;
  startTime: string;
  endTime: string;
  experienceMonths: string;
  profileImage: FileList | undefined;
  agreeLocation: boolean;
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
    formState: { errors, isSubmitting },
  } = useForm<RiderProfileFormValues>({
    defaultValues: {
      nickname: '',
      serviceArea: '',
      phone: '',
      licenseNumber: '',
      startTime: '10:00',
      endTime: '22:00',
      experienceMonths: '',
      profileImage: undefined,
      agreeLocation: false,
    },
  });

  const profileImageFile = watch('profileImage');
  const profileImageName = useMemo(() => profileImageFile?.[0]?.name ?? '', [profileImageFile]);

  const onSubmit = useCallback((data: RiderProfileFormValues) => {
    console.log('rider profile submit', data);
  }, []);

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
                <Button
                  type='button'
                  variant='outline'
                  className='h-10 rounded-xl border-[#dbe4ec] px-3 text-[12px] font-semibold text-[#2ac1bc] hover:border-[#2ac1bc] hover:bg-[#2ac1bc]/10 sm:h-11 sm:px-4 sm:text-xs'>
                  중복 체크
                </Button>
              </div>
            </FieldRow>

            <FieldRow icon={MapPin} label='배달 가능 주소' error={errors.serviceArea?.message}>
              <Input
                placeholder='예) 성북구 전체, 동선동·보문동'
                className='h-10 rounded-xl border-[#dbe4ec] text-[13px] sm:h-11 sm:text-sm'
                {...register('serviceArea', {
                  required: '배달 가능 지역을 입력해 주세요.',
                })}
              />
            </FieldRow>

            <FieldRow icon={Phone} label='연락 가능한 번호' error={errors.phone?.message}>
              <Input
                placeholder='예) 010-1234-5678'
                className='h-10 rounded-xl border-[#dbe4ec] text-[13px] sm:h-11 sm:text-sm'
                {...register('phone', {
                  required: '연락처를 입력해 주세요.',
                  pattern: {
                    value: /^\d{2,3}-?\d{3,4}-?\d{4}$/,
                    message: '전화번호 형식을 확인해 주세요.',
                  },
                })}
              />
            </FieldRow>

            <FieldRow icon={IdCard} label='면허 번호 (선택)'>
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
              />
            </div>
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
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b] sm:text-lg'>위치 정보 이용 동의</CardTitle>
            <CardDescription className='text-[12px] text-[#5c5c5c] sm:text-sm'>
              실시간 매칭 및 배달 동선 안내를 위해
              <br />
              위치 정보 제공 동의가 필요해요.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            <label className='flex items-start gap-3 rounded-2xl bg-[#f0fffd] px-3.5 py-3 text-[13px] text-[#1b1b1b] sm:px-4 sm:text-sm'>
              <input
                type='checkbox'
                className='mt-1 size-4 rounded-md border-[#cbd8e2] accent-[#2ac1bc] sm:size-5'
                {...register('agreeLocation', {
                  required: '위치 정보 이용 동의가 필요해요.',
                })}
              />
              <span className='space-y-1'>
                <strong className='block text-[13px] font-semibold sm:text-sm'>위치 정보 이용 동의</strong>
                <span className='block text-[12px] text-[#6b7785] sm:text-xs'>
                  현재 위치 기반 주문 매칭과
                  <br />
                  실시간 배송 상태 안내에 사용돼요.
                </span>
              </span>
            </label>
            {errors.agreeLocation ? (
              <p className='text-[11px] text-[#f43f5e] sm:text-xs'>{errors.agreeLocation.message}</p>
            ) : null}
          </CardContent>
        </Card>
      </main>

      <footer className='border-t border-white/20 bg-[#2ac1bc] px-6 py-5 text-center text-[11px] font-semibold text-white/80'>
        오늘도 동네와 사람을 잇는 라이더가 되어 보세요. 뭐든배달이 함께할게요!
        <div className='mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center'>
          <Button
            type='submit'
            disabled={isSubmitting}
            className='h-10 w-full rounded-full bg-[#1ba7a1] text-[13px] font-semibold text-white hover:bg-[#17928d] disabled:cursor-not-allowed disabled:opacity-70 sm:h-11 sm:w-auto sm:px-8'>
            라이더 프로필 제출하기
          </Button>
        </div>
      </footer>
    </form>
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
