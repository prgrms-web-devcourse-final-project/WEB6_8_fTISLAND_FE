import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createFileRoute } from '@tanstack/react-router';
import {
  Banknote,
  Building2,
  CalendarDays,
  FileSignature,
  IdCard,
  ImageIcon,
  MapPin,
  Phone,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/make-profile/seller/')({
  component: RouteComponent,
});

interface SellerProfileFormValues {
  bizNumber: string;
  openDate: Date | null;
  ownerName: string;
  storeNickname: string;
  storeAddress: string;
  storePhone: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  brandLogo: FileList | undefined;
}

const REQUIRED_STEPS = [
  { icon: Building2, label: '사업자 등록증과 상호 정보 준비' },
  { icon: CalendarDays, label: '개업일자 및 대표자 성명 확인' },
  { icon: Upload, label: '매장 로고·대표 이미지 업로드' },
  { icon: ShieldCheck, label: '정산 계좌와 인증 서류 입력' },
];

function formatKoreanDate(date: Date | null | undefined) {
  if (!date) {
    return null;
  }

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function renderRequiredLabel(label: string | React.ReactNode) {
  if (typeof label !== 'string') {
    return label;
  }

  const isRequired = label.trim().startsWith('*');
  if (!isRequired) {
    return label;
  }

  return (
    <span className='flex items-baseline gap-1'>
      <span className='text-[#ff6b6b]'>*</span>
      <span>{label.replace('*', '').trim()}</span>
    </span>
  );
}

function RouteComponent() {
  const brandLogoInputRef = useRef<HTMLInputElement | null>(null);
  const [openDatePopoverOpen, setOpenDatePopoverOpen] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SellerProfileFormValues>({
    defaultValues: {
      bizNumber: '',
      openDate: null,
      ownerName: '',
      storeNickname: '',
      storeAddress: '',
      storePhone: '',
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      brandLogo: undefined,
    },
  });

  const brandLogoFile = watch('brandLogo');
  const brandLogoName = useMemo(() => brandLogoFile?.[0]?.name ?? '', [brandLogoFile]);

  const onSubmit = useCallback((data: SellerProfileFormValues) => {
    console.log('seller profile submit', data);
  }, []);

  const onDraftSave = useCallback((data: SellerProfileFormValues) => {
    console.log('seller profile draft', data);
  }, []);

  const { ref: registerBrandLogoRef, ...brandLogoRegister } = register('brandLogo');

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className='flex min-h-[100dvh] w-full flex-col bg-[#2ac1bc] shadow-[0_32px_80px_-40px_rgba(26,86,75,0.55)]'
      encType='multipart/form-data'>
      <header className='relative px-4 pb-6 pt-9 text-white sm:px-6 sm:pt-10'>
        <div className='absolute inset-x-5 bottom-0 h-[1px] bg-white/30 sm:inset-x-6' aria-hidden />
        <div className='flex items-center justify-between gap-2'>
          <span className='text-[10px] font-semibold uppercase tracking-[0.3em] sm:text-[11px] sm:tracking-[0.35em]'>
            seller profile
          </span>
        </div>
        <h1 className='mt-4 text-[1.75rem] font-extrabold leading-tight sm:mt-5 sm:text-3xl'>안녕하세요 판매자님!</h1>
        <p className='mt-2.5 text-[13px] leading-relaxed text-white/80 sm:mt-3 sm:text-sm'>
          사업자 정보와 매장 소개, 정산 계좌까지
          <br />한 번에 입력하고 오늘부터 동네 고객을 만나보세요.
        </p>
        <div className='mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold text-white/90 sm:gap-2 sm:px-3 sm:text-[11px]'>
          <span className='inline-block size-1.5 rounded-full bg-[#ffe14a] sm:size-2' />
          검수는 영업시간 내 2시간 이내로 완료돼요
        </div>
      </header>

      <main className='flex-1 space-y-4 overflow-y-auto rounded-t-[1.5rem] bg-[#f8f9fa] px-4 pb-6 pt-6 outline outline-[1.5px] outline-[#2ac1bc]/15 sm:space-y-5 sm:rounded-t-[1.75rem] sm:px-6 sm:pb-7 sm:pt-7'>
        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='space-y-2 pb-2.5 sm:pb-3'>
            <CardTitle className='text-[15px] font-semibold text-[#2ac1bc] sm:text-base'>판매자 준비 체크</CardTitle>
            <CardDescription className='text-[12px] text-[#4a4a4a] sm:text-[13px]'>
              아래 항목을 미리 준비하면 등록이 훨씬 빨라져요.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-2.5 sm:space-y-3'>
            {REQUIRED_STEPS.map(({ icon: Icon, label }) => (
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
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b] sm:text-lg'>사업자 정보</CardTitle>
            <CardDescription className='text-[12px] text-[#5c5c5c] sm:text-sm'>
              공식 서류 기준으로 입력해 주세요. 필수 항목은 *로 표시돼요.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <FieldRow icon={IdCard} label={renderRequiredLabel('*사업자등록번호')} error={errors.bizNumber?.message}>
              <Input
                id='biz-number'
                placeholder='예) 123-45-67890'
                className='h-10 rounded-xl border-[#dbe4ec] text-[13px] sm:h-11 sm:text-sm'
                {...register('bizNumber', {
                  required: '사업자등록번호를 입력해 주세요.',
                })}
              />
            </FieldRow>
            <FieldRow icon={CalendarDays} label='*개업일자' error={errors.openDate?.message}>
              <Controller
                control={control}
                name='openDate'
                rules={{ required: '개업일자를 선택해 주세요.' }}
                render={({ field }) => {
                  const displayValue = formatKoreanDate(field.value) ?? '개업일자를 선택해 주세요';

                  return (
                    <Popover open={openDatePopoverOpen} onOpenChange={setOpenDatePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type='button'
                          variant='outline'
                          className={cn(
                            'h-10 w-full justify-between rounded-xl border-[#dbe4ec] bg-white text-left text-[13px] font-normal text-[#1b1b1b] hover:bg-[#f8fafc] sm:h-11 sm:text-sm',
                            !field.value && 'text-[#94a3b8]'
                          )}
                          onBlur={field.onBlur}
                          onClick={() => setOpenDatePopoverOpen(true)}>
                          <span>{displayValue}</span>
                          <CalendarDays className='size-4 text-[#2ac1bc]' aria-hidden />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className='w-auto rounded-2xl border border-[#e2e8f0] bg-white p-3 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.35)]'
                        align='start'>
                        <Calendar
                          mode='single'
                          selected={field.value ?? undefined}
                          onSelect={(date) => {
                            field.onChange(date ?? null);
                            setTimeout(() => setOpenDatePopoverOpen(false), 150);
                          }}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  );
                }}
              />
            </FieldRow>
            <FieldRow
              icon={FileSignature}
              label={renderRequiredLabel('*대표자 성명')}
              error={errors.ownerName?.message}>
              <Input
                id='owner-name'
                placeholder='대표자 성명을 입력해 주세요'
                className='h-10 rounded-xl border-[#dbe4ec] text-[13px] sm:h-11 sm:text-sm'
                {...register('ownerName', {
                  required: '대표자 성명을 입력해 주세요.',
                })}
              />
            </FieldRow>
          </CardContent>
        </Card>

        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='space-y-2 pb-2.5 sm:pb-3'>
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b] sm:text-lg'>매장 소개</CardTitle>
            <CardDescription className='text-[12px] text-[#5c5c5c] sm:text-sm'>
              고객이 신뢰할 수 있는 매장 정보를 보여 주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <section className='space-y-2'>
              <Label
                htmlFor='brand-logo'
                className='flex items-center gap-2 text-[13px] font-semibold text-[#1b1b1b] sm:text-sm'>
                <ImageIcon className='size-4 text-[#2ac1bc]' />
                상표 · 로고 이미지
              </Label>
              <div className='flex items-center gap-3 rounded-2xl border border-dashed border-[#bbe7e4] bg-[#f0fffd] px-3.5 py-3.5 sm:px-4 sm:py-4'>
                <div className='flex size-12 items-center justify-center rounded-xl bg-white text-[#2ac1bc] shadow-sm sm:size-14'>
                  <Upload className='size-[18px] sm:size-5' aria-hidden />
                </div>
                <div className='flex-1 space-y-1'>
                  <p className='text-sm font-semibold text-[#1b1b1b]'>매장 대표 이미지</p>
                  <p className='text-[12px] text-[#6b7785] sm:text-xs'>
                    PNG/JPG
                    <br />
                    10MB 이하 권장
                  </p>
                  {brandLogoName ? (
                    <p className='text-[11px] text-[#1f6e6b] sm:text-xs'>선택한 파일: {brandLogoName}</p>
                  ) : null}
                </div>
                <Button
                  type='button'
                  variant='outline'
                  className='h-9 rounded-full border-[#2ac1bc]/50 px-3 text-[12px] font-semibold text-[#2ac1bc] hover:bg-[#2ac1bc]/10 sm:px-4 sm:text-xs'
                  onClick={() => brandLogoInputRef.current?.click()}>
                  파일 선택
                </Button>
                <input
                  id='brand-logo'
                  type='file'
                  accept='image/*'
                  className='hidden'
                  {...brandLogoRegister}
                  ref={(node) => {
                    brandLogoInputRef.current = node;
                    registerBrandLogoRef(node);
                  }}
                />
              </div>
            </section>

            <FieldRow icon={ImageIcon} label='상점 닉네임' error={errors.storeNickname?.message}>
              <div className='flex items-center gap-2'>
                <Input
                  id='store-nickname'
                  placeholder='동네에서 불릴 이름을 입력해 주세요'
                  className='h-10 flex-1 rounded-xl border-[#dbe4ec] text-[13px] sm:h-11 sm:text-sm'
                  {...register('storeNickname', {
                    required: '상점 닉네임을 입력해 주세요.',
                  })}
                />
                <Button
                  variant='outline'
                  className='h-10 rounded-xl border-[#dbe4ec] px-3 text-[12px] font-semibold text-[#2ac1bc] hover:border-[#2ac1bc] hover:bg-[#2ac1bc]/10 sm:h-11 sm:px-4 sm:text-xs'>
                  중복 체크
                </Button>
              </div>
              <p className='mt-1 text-[12px] text-[#6b7785] sm:text-xs'>
                검색 시 노출되는 이름이니 가독성 있는 표현이 좋아요.
              </p>
            </FieldRow>
          </CardContent>
        </Card>

        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='space-y-2 pb-2.5 sm:pb-3'>
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b] sm:text-lg'>매장 연락 · 위치</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <FieldRow icon={MapPin} label='사업장 주소'>
              <Input
                id='store-address'
                placeholder='도로명 주소를 입력해 주세요'
                className='h-10 rounded-xl border-[#dbe4ec] text-[13px] sm:h-11 sm:text-sm'
                {...register('storeAddress')}
              />
            </FieldRow>
            <FieldRow icon={Phone} label={renderRequiredLabel('*사업장 전화번호')} error={errors.storePhone?.message}>
              <div className='flex items-center gap-2'>
                <Input
                  id='store-phone'
                  placeholder='예) 02-123-4567'
                  className='h-10 flex-1 rounded-xl border-[#dbe4ec] text-[13px] sm:h-11 sm:text-sm'
                  {...register('storePhone', {
                    required: '사업장 전화번호를 입력해 주세요.',
                    pattern: {
                      value: /^\d{2,4}-?\d{3,4}-?\d{4}$/,
                      message: '전화번호 형식을 확인해 주세요.',
                    },
                  })}
                />
                <Button
                  type='button'
                  variant='outline'
                  className='h-10 rounded-xl border-[#dbe4ec] px-3 text-[12px] font-semibold text-[#2ac1bc] hover:border-[#2ac1bc] hover:bg-[#2ac1bc]/10 sm:h-11 sm:px-4 sm:text-xs'>
                  인증하기
                </Button>
              </div>
            </FieldRow>
          </CardContent>
        </Card>

        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='space-y-2 pb-2.5 sm:pb-3'>
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b] sm:text-lg'>정산 계좌</CardTitle>
            <CardDescription className='text-[12px] text-[#5c5c5c] sm:text-sm'>
              은행, 계좌번호, 예금주 정보를 정확히 입력해 주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <FieldRow icon={Banknote} label='정산 계좌 정보'>
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                <Input
                  placeholder='은행명'
                  className='h-10 rounded-xl border-[#dbe4ec] text-[13px] sm:h-11 sm:text-sm'
                  {...register('bankName')}
                />
                <Input
                  placeholder='계좌번호'
                  className='h-10 rounded-xl border-[#dbe4ec] text-[13px] sm:h-11 sm:text-sm'
                  {...register('accountNumber')}
                />
                <Input
                  placeholder='예금주'
                  className='h-10 rounded-xl border-[#dbe4ec] text-[13px] sm:h-11 sm:text-sm sm:col-span-2'
                  {...register('accountHolder')}
                />
              </div>
            </FieldRow>
          </CardContent>
        </Card>
      </main>

      <footer className='border-t border-white/20 bg-[#2ac1bc] px-6 py-5 text-center text-[11px] font-semibold text-white/80'>
        오늘도 동네 상점과 고객을 잇는 첫걸음, 뭐든배달이 함께해요!
        <div className='mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center'>
          <Button
            type='submit'
            disabled={isSubmitting}
            className='h-10 w-full rounded-full bg-[#1ba7a1] text-[13px] font-semibold text-white hover:bg-[#17928d] disabled:cursor-not-allowed disabled:opacity-70 sm:h-11 sm:w-auto sm:px-8'>
            판매자 프로필 제출하기
          </Button>
        </div>
      </footer>
    </form>
  );
}

type FieldRowProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: React.ReactNode;
  children: React.ReactNode;
  error?: string;
};

function FieldRow({ icon: Icon, label, children, error }: FieldRowProps) {
  return (
    <section className='space-y-2'>
      <Label className='flex items-center gap-2 text-[13px] font-semibold text-[#1b1b1b] sm:text-sm'>
        <Icon className='size-4 text-[#2ac1bc]' aria-hidden />
        {renderRequiredLabel(label)}
      </Label>
      {children}
      {error ? <p className='text-[11px] text-[#f43f5e] sm:text-xs'>{error}</p> : null}
    </section>
  );
}
