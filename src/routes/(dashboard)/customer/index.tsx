import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createFileRoute } from '@tanstack/react-router';
import { Bell, Heart, Home, ListFilter, MapPin, Search, ShoppingBag, Star, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/(dashboard)/customer/')({
  component: RouteComponent,
});

interface HomeSearchForm {
  keyword: string;
}

const CATEGORIES = [
  { label: '식료품', color: 'bg-[#ECFFD9]', icon: ShoppingBag },
  { label: '생활용품', color: 'bg-[#FFECD9]', icon: Home },
  { label: '디저트', color: 'bg-[#E5F2FF]', icon: Star },
  { label: '약국', color: 'bg-[#FFE5F4]', icon: Heart },
  { label: '문구', color: 'bg-[#FFF7D9]', icon: User },
  { label: '꽃집', color: 'bg-[#F0E5FF]', icon: ShoppingBag },
  { label: '세탁', color: 'bg-[#E3FFF7]', icon: Home },
  { label: '펫샵', color: 'bg-[#FFEADF]', icon: Heart },
  { label: '더보기', color: 'bg-[#F3F4F6]', icon: ListFilter },
];

function RouteComponent() {
  const { register, handleSubmit } = useForm<HomeSearchForm>({
    defaultValues: { keyword: '' },
  });

  const handleSearch = handleSubmit(({ keyword }) => {
    console.log('search keyword', keyword);
  });

  return (
    <div className='flex min-h-[100dvh] w-full flex-col bg-[#2ac1bc] shadow-[0_32px_80px_-40px_rgba(26,86,75,0.55)]'>
      <header className='relative px-4 pb-6 pt-9 text-white sm:px-6 sm:pt-10'>
        <div className='flex items-start justify-between'>
          <div className='space-y-1'>
            <p className='text-[12px] font-semibold uppercase tracking-[0.3em]'>현재 위치</p>
            <button className='flex items-center gap-2 text-left text-sm font-semibold text-white'>
              서울시 성북구 돌곶이로 27
              <MapPin className='size-4 opacity-80' aria-hidden />
            </button>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='icon'
              className='size-9 rounded-full border border-white/30 text-white hover:bg-white/10'>
              <Bell className='size-4' aria-hidden />
              <span className='sr-only'>알림</span>
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='size-9 rounded-full border border-white/30 text-white hover:bg-white/10'>
              <ShoppingBag className='size-4' aria-hidden />
              <span className='sr-only'>장바구니</span>
            </Button>
          </div>
        </div>
        <p className='mt-5 text-[1.75rem] font-extrabold leading-tight sm:text-3xl'>
          동네 가게에서 필요한 걸
          <br />
          지금 바로 받아보세요
        </p>
      </header>

      <main className='flex-1 space-y-5 overflow-y-auto rounded-t-[1.5rem] bg-[#f8f9fa] px-4 pb-6 pt-6 outline outline-[1.5px] outline-[#2ac1bc]/15 sm:space-y-6 sm:rounded-t-[1.75rem] sm:px-6 sm:pb-7 sm:pt-7'>
        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>무엇을 찾고 계신가요?</CardTitle>
            <CardDescription className='text-[12px] text-[#6b7785]'>
              검색창에 원하는 품목이나 가게 이름을 입력해 보세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSearch}
              className='flex items-center gap-2 rounded-2xl border border-[#bbe7e4] bg-[#f0fffd] px-3 py-2.5'>
              <Search className='size-[18px] text-[#2ac1bc]' aria-hidden />
              <Input
                placeholder='예) 골목 반찬, 꽃다발, 약국'
                className='h-9 flex-1 border-0 bg-transparent text-[13px] text-[#1b1b1b] placeholder:text-[#9aa5b1] focus-visible:ring-0'
                {...register('keyword')}
              />
              <Button
                type='submit'
                size='sm'
                className='h-8 rounded-full bg-[#2ac1bc] px-4 text-[12px] font-semibold text-white hover:bg-[#1ba7a1]'>
                검색
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='flex flex-row items-center justify-between pb-3'>
            <div>
              <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>카테고리</CardTitle>
              <CardDescription className='text-[12px] text-[#6b7785]'>
                동네에서 자주 찾는 품목을 빠르게 만나보세요.
              </CardDescription>
            </div>
            <Button
              variant='ghost'
              size='sm'
              className='h-8 rounded-full border border-[#dbe4ec] px-3 text-[12px] font-semibold text-[#1b1b1b] hover:bg-[#f5f7f9]'>
              더보기
            </Button>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-3 gap-3'>
              {CATEGORIES.map(({ label, color, icon: Icon }) => (
                <button
                  key={label}
                  type='button'
                  className='flex flex-col items-center gap-2 rounded-2xl bg-white p-3 text-[12px] font-semibold text-[#1b1b1b] shadow-[0_12px_32px_-24px_rgba(15,23,42,0.35)] transition-colors hover:bg-[#f5f7f9]'>
                  <span className={`flex size-14 items-center justify-center rounded-full ${color}`}>
                    <Icon className='size-6 text-[#1f6e6b]' aria-hidden />
                  </span>
                  {label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <section className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h2 className='text-[15px] font-semibold text-[#1b1b1b]'>주변 상점</h2>
            <Button
              variant='ghost'
              size='sm'
              className='h-8 rounded-full border border-[#dbe4ec] px-3 text-[12px] font-semibold text-[#1b1b1b] hover:bg-[#f5f7f9]'>
              필터링
            </Button>
          </div>
          <div className='space-y-3'>
            {[1, 2, 3].map((item) => (
              <Card key={item} className='border-none bg-white shadow-sm'>
                <CardContent className='flex gap-3 px-4 py-3'>
                  <div className='flex size-16 items-center justify-center rounded-2xl bg-[#e2f6f5] text-[#1f6e6b]'>
                    가게 {item}
                  </div>
                  <div className='flex-1 space-y-1'>
                    <p className='text-[14px] font-semibold text-[#1b1b1b]'>골목 마트 {item}</p>
                    <p className='text-[12px] text-[#6b7785]'>오늘만 2,000원 할인 · 0.8km</p>
                    <div className='flex items-center gap-2 text-[12px] text-[#1f6e6b]'>
                      <span className='inline-flex items-center gap-1 rounded-full bg-[#2ac1bc]/10 px-2 py-0.5'>
                        <Star className='size-3 text-[#2ac1bc]' aria-hidden />
                        4.9
                      </span>
                      <span>#늦은밤배달 #신선식품</span>
                    </div>
                  </div>
                  <Button
                    size='sm'
                    className='h-8 rounded-full bg-[#2ac1bc] px-3 text-[12px] font-semibold text-white hover:bg-[#1ba7a1]'>
                    주문하기
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className='border-t border-white/20 bg-[#2ac1bc] px-4 py-4 text-white sm:px-6'>
        <nav className='flex items-center justify-between text-[12px] font-semibold'>
          <FooterNav label='홈' icon={Home} active />
          <FooterNav label='검색' icon={Search} />
          <FooterNav label='즐겨찾기' icon={Heart} />
          <FooterNav label='주문내역' icon={ListFilter} />
          <FooterNav label='마이뭐든' icon={User} />
        </nav>
      </footer>
    </div>
  );
}

interface FooterNavProps {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  active?: boolean;
}

function FooterNav({ label, icon: Icon, active = false }: FooterNavProps) {
  return (
    <button
      type='button'
      className={cn(
        'flex flex-col items-center gap-1 rounded-full px-3 py-1 text-white/80 transition-colors',
        active ? 'text-white' : 'hover:text-white'
      )}>
      <Icon className='size-5' aria-hidden />
      {label}
    </button>
  );
}
