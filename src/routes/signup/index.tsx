import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/signup/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { register, handleSubmit, watch } = useForm<{
    name: string;
    phone: string;
    phoneCode: string;
    email: string;
    password: string;
    confirm: string;
  }>({
    defaultValues: { name: '', phone: '', phoneCode: '', email: '', password: '', confirm: '' },
  });
  const submit = handleSubmit((values) => {
    console.log('signup submit', values);
  });
  const password = watch('password');

  return (
    <div className='flex min-h-[100dvh] w-full flex-col bg-[#2ac1bc]'>
      <div className='flex-1 rounded-t-[1.5rem] bg-[#f8f9fa] px-4 pb-6 pt-10 sm:rounded-t-[1.75rem] sm:px-6 sm:pb-8 sm:pt-12'>
        <div className='mb-6 text-center'>
          <h1 className='text-[24px] font-extrabold text-[#1b1b1b]'>뭐든배달 회원가입</h1>
          <p className='mt-1 text-[12px] text-[#6b7785]'>간단한 정보 입력으로 바로 시작해요</p>
        </div>

        <Card className='border-none bg-white shadow-sm'>
          <CardContent className='px-4 py-5 sm:px-6'>
            <form onSubmit={submit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='name' className='text-[12px] text-[#1b1b1b]'>
                  이름(닉네임)
                </Label>
                <div className='flex items-center gap-2'>
                  <Input
                    id='name'
                    placeholder='별명을 입력해 주세요'
                    className='h-10 flex-1 text-[13px]'
                    {...register('name')}
                  />
                  <Button
                    type='button'
                    variant='outline'
                    className='h-10 whitespace-nowrap rounded-full border-[#dbe4ec] bg-white text-[13px] font-semibold text-[#1b1b1b] hover:bg-[#f5f7f9]'>
                    중복확인
                  </Button>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='phone' className='text-[12px] text-[#1b1b1b]'>
                  휴대전화
                </Label>
                <div className='flex items-center gap-2'>
                  <Input
                    id='phone'
                    type='tel'
                    inputMode='numeric'
                    placeholder='숫자만 입력'
                    className='h-10 flex-1 text-[13px]'
                    {...register('phone')}
                  />
                  <Button
                    type='button'
                    className='h-10 whitespace-nowrap rounded-full bg-[#2ac1bc] text-[13px] font-semibold text-white hover:bg-[#1ba7a1]'>
                    인증하기
                  </Button>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='phoneCode' className='text-[12px] text-[#1b1b1b]'>
                  인증번호
                </Label>
                <Input
                  id='phoneCode'
                  inputMode='numeric'
                  placeholder='인증번호 6자리'
                  className='h-10 text-[13px]'
                  {...register('phoneCode')}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='email' className='text-[12px] text-[#1b1b1b]'>
                  아이디 (이메일)
                </Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='example@domain.com'
                  className='h-10 text-[13px]'
                  {...register('email')}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password' className='text-[12px] text-[#1b1b1b]'>
                  비밀번호
                </Label>
                <Input
                  id='password'
                  type='password'
                  placeholder='비밀번호를 입력해 주세요'
                  className='h-10 text-[13px]'
                  {...register('password')}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='confirm' className='text-[12px] text-[#1b1b1b]'>
                  비밀번호 확인
                </Label>
                <Input
                  id='confirm'
                  type='password'
                  placeholder='비밀번호를 다시 입력해 주세요'
                  className='h-10 text-[13px]'
                  {...register('confirm')}
                />
                {watch('confirm') && watch('confirm') !== password && (
                  <p className='text-[11px] text-red-500'>비밀번호가 일치하지 않습니다.</p>
                )}
              </div>

              <div className='space-y-2 pt-2'>
                <Button
                  type='submit'
                  className='h-10 w-full rounded-full bg-[#2ac1bc] text-[13px] font-semibold text-white hover:bg-[#1ba7a1]'>
                  회원가입
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => navigate({ to: '/login' })}
                  className='h-10 w-full rounded-full border-[#dbe4ec] bg-white text-[13px] font-semibold text-[#1b1b1b] hover:bg-[#f5f7f9]'>
                  로그인으로 돌아가기
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
