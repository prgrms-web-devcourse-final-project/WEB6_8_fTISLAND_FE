import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Heart, Menu, Search, Star } from 'lucide-react';

export const Route = createFileRoute('/(dashboard)/customer/store/$storeId/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { storeId } = Route.useParams();
  const [favorite, setFavorite] = React.useState(false);

  return (
    <div className='flex min-h-[100dvh] w-full flex-col bg-[#2ac1bc]'>
      <header className='relative h-[230px] w-full overflow-hidden'>
        <div className='absolute inset-0 bg-[url(https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=2070&auto=format&fit=crop)] bg-cover bg-center opacity-80' />
        <div className='absolute inset-0 bg-black/30' />
        <div className='absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 to-transparent' aria-hidden />
        <div className='relative z-10 flex items-center justify-between px-4 pt-6 text-white sm:px-6 sm:pt-7'>
          <Button
            variant='ghost'
            size='icon'
            className='size-9 rounded-full border border-white/30 text-white hover:bg-white/10'
            onClick={() => window.history.back()}>
            <ArrowLeft className='size-4' aria-hidden />
            <span className='sr-only'>뒤로가기</span>
          </Button>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='icon'
              className='size-9 rounded-full border border-white/30 text-white hover:bg-white/10'>
              <Menu className='size-4' aria-hidden />
              <span className='sr-only'>메뉴</span>
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='size-9 rounded-full border border-white/30 text-white hover:bg-white/10'>
              <Search className='size-4' aria-hidden />
              <span className='sr-only'>검색</span>
            </Button>
          </div>
        </div>
        <div className='relative z-10 px-4 pb-5 pt-10 text-white sm:px-6'>
          <h1 className='text-[20px] font-extrabold'>가게 이름 {storeId}</h1>
          <p className='mt-1 inline-flex items-center gap-1 text-[12px]'>
            <Star className='size-3 text-[#FACC15]' aria-hidden /> 4.9 (1,234)
          </p>
        </div>
      </header>

      <main className='flex-1 space-y-4 rounded-t-[1.5rem] bg-[#f8f9fa] px-4 pb-6 pt-4 outline-[1.5px] outline-[#2ac1bc]/15 sm:rounded-t-[1.75rem] sm:px-6 sm:pb-7 sm:pt-5'>
        <section className='-mt-2 sm:-mt-3 rounded-2xl bg-white px-4 pt-6 pb-4 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.28)] sm:px-5 sm:pt-7 sm:pb-5'>
          <div className='flex items-start justify-between'>
            <div className='space-y-1'>
              <h2 className='text-[18px] font-extrabold text-[#1b1b1b]'>상점 정보</h2>
            </div>
            <Button
              type='button'
              variant='outline'
              onClick={() => setFavorite((v) => !v)}
              className={`h-9 rounded-full border ${favorite ? 'border-[#f43f5e] bg-[#fee2e2] text-[#b91c1c]' : 'border-[#dbe4ec] text-[#1b1b1b] hover:bg-[#f5f7f9]'}`}>
              <Heart className={`mr-1 size-4 ${favorite ? 'fill-[#f43f5e] text-[#f43f5e]' : ''}`} /> 즐겨찾기
            </Button>
          </div>

          <div className='mt-3 grid grid-cols-3 gap-2 text-center text-[12px] text-[#1b1b1b]'>
            <div className='rounded-xl bg-[#f5f7f9] px-3 py-2'>최소주문금액 15,000원</div>
            <div className='rounded-xl bg-[#f5f7f9] px-3 py-2'>
              배달비
              <br />
              0~3,000원
            </div>
            <div className='rounded-xl bg-[#f5f7f9] px-3 py-2'>
              리뷰
              <br />
              1,234개
            </div>
          </div>

          <div className='mt-3'>
            <div className='flex items-center gap-2 rounded-2xl border border-[#bbe7e4] bg-[#f0fffd] px-3 py-2.5'>
              <Search className='size-[18px] text-[#2ac1bc]' aria-hidden />
              <Input
                placeholder='이 상점의 상품 검색'
                className='h-9 flex-1 border-0 bg-transparent text-[13px] text-[#1b1b1b] placeholder:text-[#9aa5b1] focus-visible:ring-0'
              />
              <Button
                size='sm'
                className='h-8 rounded-full bg-[#2ac1bc] px-4 text-[12px] font-semibold text-white hover:bg-[#1ba7a1]'>
                검색
              </Button>
            </div>
          </div>
        </section>

        <section className='space-y-3'>
          <div className='max-h-[calc(100dvh-420px)] space-y-3 overflow-y-auto sm:max-h-[calc(100dvh-440px)]'>
            {Array.from({ length: 16 }).map((_, idx) => (
              <Card
                key={idx}
                className='cursor-pointer border-none bg-white shadow-sm'
                onClick={() =>
                  navigate({
                    to: '/customer/store/$storeId/product/$productId',
                    params: { storeId, productId: `${idx + 1}` },
                  })
                }>
                <CardContent className='flex items-center gap-3 px-4 py-3'>
                  <div className='size-16 rounded-2xl bg-[#e2f6f5]' />
                  <div className='flex-1'>
                    <p className='text-[14px] font-semibold text-[#1b1b1b]'>상품 {idx + 1}</p>
                    <p className='text-[12px] text-[#6b7785]'>신선한 상품을 지금 바로 받아보세요</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
