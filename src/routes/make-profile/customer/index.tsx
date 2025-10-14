import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { createFileRoute } from '@tanstack/react-router';
import { Camera } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import AddressManage from '@/components/address/AddressManage';
import { useForm, Controller } from 'react-hook-form';
import { useCreateProfile } from '@/api/generated';
import { CreateProfileRequestProfileType } from '@/api/generated/model/createProfileRequestProfileType';
import { toast } from 'sonner';
import { usePresignedUpload } from '@/lib/usePresignedUpload';
import { GeneratePresignedUrlRequestDomain } from '@/api/generated/model/generatePresignedUrlRequestDomain';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/store/auth';

export const Route = createFileRoute('/make-profile/customer/')({
  component: RouteComponent,
});

interface CustomerProfileFormValues {
  nickname: string;
  phone: string;
  profileImageUrl: string;
  agreeLocation: boolean;
}

function RouteComponent() {
  const [openAddress, setOpenAddress] = React.useState(false);
  const [, setAddress] = React.useState<{ base?: string; detail?: string } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    control,
  } = useForm<CustomerProfileFormValues>({
    mode: 'onChange',
    defaultValues: { nickname: '', phone: '', profileImageUrl: '', agreeLocation: false },
  });
  const createProfileMutation = useCreateProfile({
    mutation: {
      onSuccess: (res) => {
        const content = (res as any)?.data?.content ?? (res as any)?.content;
        const profileId = content?.profileId ?? content?.currentActiveProfileId;
        try {
          useAuthStore.getState().setAuth({
            currentActiveProfileType: 'CUSTOMER',
            currentActiveProfileId: profileId,
          });
        } catch {}
        toast.success('소비자 프로필이 생성되었습니다.');
        navigate({ to: '/customer' });
      },
    },
  });
  const uploadMutation = usePresignedUpload();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const uploadedUrl = watch('profileImageUrl');
  const onSubmit = React.useCallback(
    async (values: CustomerProfileFormValues) => {
      await createProfileMutation.mutateAsync({
        data: {
          profileType: CreateProfileRequestProfileType.CUSTOMER,
          profileData: {
            nickname: values.nickname,
            customerPhoneNumber: values.phone,
            profileImageUrl: values.profileImageUrl || undefined,
          },
        },
      });
    },
    [createProfileMutation]
  );
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className='flex min-h-[100dvh] w-full flex-col bg-[#2ac1bc] shadow-[0_32px_80px_-40px_rgba(26,86,75,0.55)]'>
      <header className='relative px-4 pb-6 pt-9 text-white sm:px-6 sm:pt-10'>
        <div className='absolute inset-x-5 bottom-0 h-[1px] bg-white/30 sm:inset-x-6' aria-hidden />
        <div className='flex items-center justify-between gap-2'>
          <span className='text-[10px] font-semibold uppercase tracking-[0.3em] sm:text-[11px] sm:tracking-[0.35em]'>
            소비자 프로필
          </span>
        </div>
        <h1 className='mt-4 text-[1.75rem] font-extrabold leading-tight sm:mt-5 sm:text-3xl'>
          우리동네 배송을
          <br />더 빠르게 받아보세요
        </h1>
        <p className='mt-2.5 text-[13px] leading-relaxed text-white/80 sm:mt-3 sm:text-sm'>
          기본 정보를 등록해 두면 단골 상점 주문과
          <br />
          골목 심부름까지 한 번에 이어져요.
        </p>
      </header>

      <main className='flex-1 space-y-4 overflow-y-auto rounded-t-[1.5rem] bg-[#f8f9fa] px-4 pb-6 pt-6 outline-[1.5px] outline-[#2ac1bc]/15 sm:space-y-5 sm:rounded-t-[1.75rem] sm:px-6 sm:pb-7 sm:pt-7'>
        <Card className='border-none bg-white shadow-lg shadow-[#0f172a]/5'>
          <CardHeader className='space-y-2.5 pb-2.5 sm:space-y-3 sm:pb-2'>
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b] sm:text-lg'>기본 정보</CardTitle>
            <CardDescription className='text-[13px] text-[#5c5c5c] sm:text-sm'>
              배송 기사님이 쉽게 알아볼 수 있도록
              <br />
              나의 정보를 입력해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-5 sm:space-y-6'>
            <section className='space-y-3'>
              <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2ac1bc] sm:text-xs sm:tracking-[0.2em]'>
                프로필 사진
              </p>
              <div className='flex items-center gap-3.5 rounded-2xl border border-dashed border-[#c8f0ee] bg-[#f0fffd] px-3.5 py-3.5 sm:gap-4 sm:px-4 sm:py-4'>
                {uploadedUrl ? (
                  <img
                    src={uploadedUrl}
                    alt='프로필 미리보기'
                    className='size-12 rounded-full border border-[#e2e8f0] object-cover shadow-sm sm:size-14'
                  />
                ) : (
                  <div className='flex size-12 items-center justify-center rounded-full bg-white text-[#2ac1bc] shadow-sm sm:size-14'>
                    <Camera className='size-[20px] sm:size-6' aria-hidden />
                  </div>
                )}
                <div className='flex-1 space-y-1'>
                  <p className='text-sm font-semibold text-[#1b1b1b]'>프로필 사진</p>
                  <p className='text-[9px] text-[#6b7785] sm:text-xs'>
                    사진이 없으면
                    <br />
                    기본 이미지가 적용돼요.
                  </p>
                </div>
                <Button
                  variant='outline'
                  type='button'
                  disabled={uploadMutation.isPending}
                  className='h-9 rounded-full border-[#2ac1bc]/50 px-3 text-[12px] font-semibold text-[#2ac1bc] hover:bg-[#2ac1bc]/10 disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:text-xs'
                  onClick={() => fileInputRef.current?.click()}>
                  사진 업로드
                </Button>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const { objectUrl } = await uploadMutation.mutateAsync({
                        file,
                        domain: GeneratePresignedUrlRequestDomain.USER_PROFILE,
                      });
                      setValue('profileImageUrl', objectUrl, { shouldDirty: true });
                      toast.success('이미지 업로드 완료');
                    } catch {
                    } finally {
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <input type='hidden' {...register('profileImageUrl')} />
              </div>
            </section>

            <section className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='nickname'>닉네임</Label>
                <div className='flex items-center gap-2'>
                  <Input
                    id='nickname'
                    placeholder='닉네임'
                    className='h-10 rounded-xl border-[#dbe4ec] bg-white text-[13px] placeholder:text-[#94a3b8] sm:h-11 sm:text-sm'
                    {...register('nickname', { required: '닉네임을 입력해 주세요.' })}
                  />
                  {/* <Button
                    variant='outline'
                    className='h-10 rounded-xl border-[#dbe4ec] px-3 text-[12px] font-semibold text-[#2ac1bc] hover:border-[#2ac1bc] hover:bg-[#2ac1bc]/10 sm:h-11 sm:px-4 sm:text-xs'>
                    중복 체크
                  </Button> */}
                </div>
                {errors.nickname ? (
                  <p className='text-[11px] text-[#f43f5e] sm:text-xs'>{errors.nickname.message}</p>
                ) : null}
                <p className='text-[12px] text-[#6b7785] sm:text-xs'>배달 기사님이 확인하기 쉬운 이름이면 더 좋아요.</p>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='phone'>전화번호</Label>
                <Input
                  id='phone'
                  placeholder='예) 010-1234-5678'
                  className='h-10 rounded-xl border-[#dbe4ec] bg-white text-[13px] placeholder:text-[#94a3b8] sm:h-11 sm:text-sm'
                  {...register('phone', {
                    required: '전화번호를 입력해 주세요.',
                    pattern: { value: /^\d{2,3}-?\d{3,4}-?\d{4}$/, message: '전화번호 형식을 확인해 주세요.' },
                  })}
                />
                {errors.phone ? <p className='text-[11px] text-[#f43f5e] sm:text-xs'>{errors.phone.message}</p> : null}
              </div>

              {/* <div className='space-y-2'>
                <Label htmlFor='address'>기본 배송지</Label>
                <div className='flex items-center gap-2'>
                  <Input
                    id='address'
                    readOnly
                    value={address.base ?? ''}
                    placeholder='예) 서울시 성북구 돌곶이로 27'
                    className='h-10 flex-1 rounded-xl border-[#dbe4ec] bg-white text-[13px] placeholder:text-[#94a3b8] sm:h-11 sm:text-sm'
                  />
                  <Button
                    variant='outline'
                    className='h-10 rounded-xl border-[#dbe4ec] px-3 text-[12px] font-semibold text-[#2ac1bc] hover:border-[#2ac1bc] hover:bg-[#2ac1bc]/10 sm:h-11 sm:px-4 sm:text-xs'
                    onClick={() => setOpenAddress(true)}>
                    주소 검색
                  </Button>
                </div>
                <Input
                  placeholder='상세 주소를 입력해 주세요 (예: 101동 1203호)'
                  value={address.detail ?? ''}
                  onChange={(e) => setAddress((p) => ({ ...p, detail: e.target.value }))}
                  className='h-10 rounded-xl border-[#dbe4ec] bg-white text-[13px] placeholder:text-[#94a3b8] sm:h-11 sm:text-sm'
                />
                <p className='text-[12px] text-[#6b7785] sm:text-xs'>
                  주로 받는 주소를 등록해 두면 주문이 훨씬 빨라요.
                </p>
              </div> */}
            </section>

            <section className='space-y-3'>
              <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2ac1bc] sm:text-xs sm:tracking-[0.2em]'>
                이용 동의
              </p>
              <div className='flex items-start gap-3 rounded-2xl bg-[#f9fbff] px-3.5 py-3 sm:px-4'>
                <Controller
                  control={control}
                  name='agreeLocation'
                  rules={{ validate: (v) => v || '위치 정보 이용 동의가 필요해요.' }}
                  render={({ field }) => (
                    <Checkbox
                      id='location-consent'
                      className='mt-1 size-4 rounded-md border-[#cbd8e2] accent-[#2ac1bc] sm:size-5'
                      checked={!!field.value}
                      onCheckedChange={(v) => field.onChange(!!v)}
                    />
                  )}
                />
                <div className='space-y-1'>
                  <Label htmlFor='location-consent' className='text-[13px] font-semibold text-[#1b1b1b] sm:text-sm'>
                    위치 정보 이용 동의
                  </Label>
                  <p className='text-[12px] text-[#6b7785] sm:text-xs'>
                    가까운 상점 추천과 실시간 배송 안내에 사용돼요.
                  </p>
                </div>
              </div>
              {errors.agreeLocation ? (
                <p className='text-[11px] text-[#f43f5e] sm:text-xs'>{String(errors.agreeLocation.message)}</p>
              ) : null}
            </section>
          </CardContent>
          <CardFooter className='flex flex-col gap-3 pt-0'>
            <Button
              type='submit'
              disabled={createProfileMutation.isPending || !isValid}
              className='h-10 w-full rounded-full bg-[#2ac1bc] text-sm font-semibold text-white hover:bg-[#1ba7a1] disabled:cursor-not-allowed disabled:opacity-70 sm:h-12'>
              소비자 프로필 만들기
            </Button>
            <p className='text-center text-[12px] text-[#6b7785] sm:text-xs'>
              필수 정보만 입력해도 바로 동네 상점 주문을 시작할 수 있어요.
            </p>
          </CardFooter>
        </Card>

        <div className='rounded-2xl bg-white/70 px-3.5 py-3 text-center text-[12px] text-[#6b7785] shadow-inner sm:px-4 sm:text-xs'>
          프로필은 설정에서 언제든 수정할 수 있어요.
        </div>
      </main>

      <Dialog open={openAddress} onOpenChange={setOpenAddress}>
        <DialogContent className='mx-auto w-[90%] max-w-[28rem] max-h-[85vh] overflow-hidden rounded-3xl border-0 p-0 shadow-2xl'>
          <AddressManage
            defaultOpen
            asDialog
            role='customer'
            onSave={(v) => {
              setAddress({ base: v.selectedAddress?.address, detail: v.unitNumber ?? '' });
            }}
            onClose={() => setOpenAddress(false)}
          />
        </DialogContent>
      </Dialog>

      <footer className='border-t border-white/20 bg-[#2ac1bc] px-6 py-5 text-center text-[11px] font-semibold text-white/80'>
        오늘도 동네 부탁, 뭐든배달과 함께해요!
      </footer>
    </form>
  );
}
