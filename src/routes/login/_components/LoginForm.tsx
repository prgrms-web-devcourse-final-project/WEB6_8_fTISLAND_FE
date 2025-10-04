import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSubmit?: (values: LoginFormValues) => void;
  onSignup?: () => void;
}

export function LoginForm({ onSubmit, onSignup }: LoginFormProps) {
  const { register, handleSubmit } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit((values) => {
    onSubmit?.(values);
  });

  return (
    <div className='flex min-h-[100dvh] w-full flex-col bg-[#2ac1bc]'>
      <div className='flex-1 rounded-t-[1.5rem] bg-[#f8f9fa] px-4 pb-6 pt-10 sm:rounded-t-[1.75rem] sm:px-6 sm:pb-8 sm:pt-12'>
        <div className='mb-6 text-center'>
          <h1 className='text-[24px] font-extrabold text-[#1b1b1b]'>뭐든배달 로그인</h1>
          <p className='mt-1 text-[12px] text-[#6b7785]'>계정에 로그인하고 동네 배달을 시작해요</p>
        </div>

        <Card className='border-none bg-white shadow-sm'>
          <CardContent className='px-4 py-5 sm:px-6'>
            <form onSubmit={submit} className='space-y-4'>
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

              <div className='space-y-2 pt-2'>
                <Button
                  type='submit'
                  className='h-10 w-full rounded-full bg-[#2ac1bc] text-[13px] font-semibold text-white hover:bg-[#1ba7a1]'>
                  로그인
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={onSignup}
                  className='h-10 w-full rounded-full border-[#dbe4ec] bg-white text-[13px] font-semibold text-[#1b1b1b] hover:bg-[#f5f7f9]'>
                  회원가입
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className='mt-5 space-y-2'>
          <Button className='h-10 w-full rounded-full bg-[#eaeaea] text-[13px] font-semibold text-[#1b1b1b]'>
            구글로 계속하기
          </Button>
          <Button className='h-10 w-full rounded-full bg-[#FEE500] text-[13px] font-semibold text-[#1b1b1b]'>
            카카오로 계속하기
          </Button>
          <Button className='h-10 w-full rounded-full bg-[#03C75A] text-[13px] font-semibold text-white'>
            네이버로 계속하기
          </Button>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
