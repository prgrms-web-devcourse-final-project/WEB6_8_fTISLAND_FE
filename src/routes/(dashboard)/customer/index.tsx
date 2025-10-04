import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Heart, Home, ListFilter, Search, ShoppingBag, Star, User } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { CustomerHeader } from './_components/CustomerHeader';
import { CustomerFooterNav } from './_components/CustomerFooterNav';
import StoreFilterSheet, { type StoreFilterValue } from '@/components/StoreFilterSheet';

export const Route = createFileRoute('/(dashboard)/customer/')({
  component: RouteComponent,
});

interface HomeSearchForm {
  keyword: string;
}

const CATEGORIES = [
  { label: '식료품', slug: 'groceries', color: 'bg-[#ECFFD9]', icon: ShoppingBag },
  { label: '생활용품', slug: 'household', color: 'bg-[#FFECD9]', icon: Home },
  { label: '디저트', slug: 'dessert', color: 'bg-[#E5F2FF]', icon: Star },
  { label: '약국', slug: 'pharmacy', color: 'bg-[#FFE5F4]', icon: Heart },
  { label: '문구', slug: 'stationery', color: 'bg-[#FFF7D9]', icon: User },
  { label: '꽃집', slug: 'florist', color: 'bg-[#F0E5FF]', icon: ShoppingBag },
  { label: '세탁', slug: 'laundry', color: 'bg-[#E3FFF7]', icon: Home },
  { label: '펫샵', slug: 'petshop', color: 'bg-[#FFEADF]', icon: Heart },
  { label: '전자기기', slug: 'electronics', color: 'bg-[#E5F2FF]', icon: Star },
  { label: '반려동물', slug: 'pet-supplies', color: 'bg-[#FFE5F4]', icon: Heart },
  { label: '베이커리', slug: 'bakery', color: 'bg-[#FFF7D9]', icon: User },
  { label: '농산물', slug: 'produce', color: 'bg-[#ECFFD9]', icon: ShoppingBag },
  { label: '해산물', slug: 'seafood', color: 'bg-[#E3FFF7]', icon: Home },
  { label: '꽃배달', slug: 'flower-delivery', color: 'bg-[#F0E5FF]', icon: ShoppingBag },
];

function RouteComponent() {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<HomeSearchForm>({
    defaultValues: { keyword: '' },
  });

  const handleSearch = handleSubmit(({ keyword }) => {
    console.log('search keyword', keyword);
  });

  const [showAllCategories, setShowAllCategories] = React.useState(false);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<Partial<StoreFilterValue>>({});

  return (
    <div className='flex min-h-[100dvh] w-full flex-col bg-[#2ac1bc] shadow-[0_32px_80px_-40px_rgba(26,86,75,0.55)]'>
      <CustomerHeader nickname='뭐든배달' address='서울시 성북구 돌곶이로 27' />

      <main className='flex-1 space-y-5 overflow-y-auto rounded-t-[1.5rem] bg-[#f8f9fa] px-4 pb-6 pt-6 outline-[1.5px] outline-[#2ac1bc]/15 sm:space-y-6 sm:rounded-t-[1.75rem] sm:px-6 sm:pb-7 sm:pt-7'>
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
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-5 gap-2'>
              {(showAllCategories ? CATEGORIES : CATEGORIES.slice(0, 9)).map(({ label, slug, color, icon: Icon }) => (
                <button
                  key={slug}
                  type='button'
                  onClick={() => navigate({ to: '/customer/category/$category', params: { category: slug } })}
                  className='flex flex-col items-center gap-1.5 rounded-2xl bg-white p-2 text-[11px] font-semibold text-[#1b1b1b] shadow-[0_12px_32px_-24px_rgba(15,23,42,0.35)] transition-colors hover:bg-[#f5f7f9]'>
                  <span className={`flex size-12 items-center justify-center rounded-full ${color}`}>
                    <Icon className='size-5 text-[#1f6e6b]' aria-hidden />
                  </span>
                  {label}
                </button>
              ))}
              {!showAllCategories && CATEGORIES.length > 10 && (
                <button
                  type='button'
                  onClick={() => setShowAllCategories(true)}
                  className='flex flex-col items-center gap-1.5 rounded-2xl bg-white p-2 text-[11px] font-semibold text-[#1b1b1b] shadow-[0_12px_32px_-24px_rgba(15,23,42,0.35)] transition-colors hover:bg-[#f5f7f9]'>
                  <span className='flex size-12 items-center justify-center rounded-full bg-[#F3F4F6]'>
                    <ListFilter className='size-5 text-[#1f6e6b]' aria-hidden />
                  </span>
                  더보기
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        <section className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h2 className='text-[15px] font-semibold text-[#1b1b1b]'>주변 상점</h2>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setFilterOpen(true)}
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
        <div className='h-[calc(68px+env(safe-area-inset-bottom))]' />
      </main>

      <StoreFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        value={filters}
        onApply={(v) => setFilters(v)}
        onReset={() => setFilters({})}
      />

      <div className='fixed inset-x-0 bottom-0 z-50'>
        <CustomerFooterNav
          items={[
            { label: '홈', icon: Home },
            { label: '검색', icon: Search },
            { label: '즐겨찾기', icon: Heart },
            { label: '주문내역', icon: ListFilter },
            { label: '마이뭐든', icon: User },
          ]}
          activeIndex={0}
          onClickItem={(idx) => {
            if (idx === 0) navigate({ to: '/customer' });
            if (idx === 1) navigate({ to: '/customer/search' });
            if (idx === 2) navigate({ to: '/customer/favorites' });
            if (idx === 3) navigate({ to: '/customer/orders' });
            if (idx === 4) navigate({ to: '/customer/mypage' });
          }}
        />
      </div>
    </div>
  );
}
