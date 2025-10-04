import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Filter, Search } from 'lucide-react';
import StoreFilterSheet, { type StoreFilterValue } from '@/components/StoreFilterSheet';

export const Route = createFileRoute('/(dashboard)/customer/category/$category/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { category } = Route.useParams();
  const categoryLabelMap: Record<string, string> = {
    'groceries': '식료품',
    'household': '생활용품',
    'dessert': '디저트',
    'pharmacy': '약국',
    'stationery': '문구',
    'florist': '꽃집',
    'laundry': '세탁',
    'petshop': '펫샵',
    'pet-supplies': '반려동물',
    'electronics': '전자기기',
    'bakery': '베이커리',
    'produce': '농산물',
    'seafood': '해산물',
    'flower-delivery': '꽃배달',
  };
  const categoryLabel = categoryLabelMap[category] ?? category;

  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<Partial<StoreFilterValue>>({});

  return (
    <div className='flex min-h-[100dvh] w-full flex-col bg-[#2ac1bc]'>
      <header className='px-4 pb-5 pt-9 text-white sm:px-6 sm:pt-10'>
        <div className='flex items-center justify-between'>
          <Button
            variant='ghost'
            size='icon'
            className='size-9 rounded-full border border-white/30 text-white hover:bg-white/10'
            onClick={() => window.history.back()}>
            <ArrowLeft className='size-4' aria-hidden />
            <span className='sr-only'>뒤로가기</span>
          </Button>
          <h1 className='text-[16px] font-extrabold'>{categoryLabel}</h1>
          <Button
            variant='ghost'
            size='icon'
            className='size-9 rounded-full border border-white/30 text-white hover:bg-white/10'
            onClick={() => navigate({ to: '/customer' })}>
            <Search className='size-4' aria-hidden />
            <span className='sr-only'>검색으로 이동</span>
          </Button>
        </div>
      </header>

      <main className='flex-1 rounded-t-[1.5rem] bg-[#f8f9fa] px-4 pb-6 pt-6 outline-[1.5px] outline-[#2ac1bc]/15 sm:rounded-t-[1.75rem] sm:px-6 sm:pb-7 sm:pt-7'>
        <div className='mb-3 flex items-center justify-between'>
          <h2 className='text-[15px] font-semibold text-[#1b1b1b]'>상점 리스트</h2>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setFilterOpen(true)}
            className='h-8 rounded-full border border-[#dbe4ec] px-3 text-[12px] font-semibold text-[#1b1b1b] hover:bg-[#f5f7f9]'>
            <Filter className='mr-1 size-3.5' /> 필터링
          </Button>
        </div>

        <div className='max-h-[calc(100dvh-220px)] space-y-3 overflow-y-auto sm:max-h-[calc(100dvh-240px)]'>
          {Array.from({ length: 12 }).map((_, idx) => (
            <Card
              key={idx}
              className='cursor-pointer border-none bg-white shadow-sm'
              onClick={() =>
                navigate({ to: '/customer/store/$storeId', params: { storeId: `${category}-${idx + 1}` } })
              }>
              <CardContent className='flex gap-3 px-4 py-3'>
                <div className='flex size-16 items-center justify-center rounded-2xl bg-[#e2f6f5] text-[#1f6e6b]'>
                  {categoryLabel} {idx + 1}
                </div>
                <div className='flex-1 space-y-1'>
                  <p className='text-[14px] font-semibold text-[#1b1b1b]'>
                    {categoryLabel} 전문점 {idx + 1}
                  </p>
                  <p className='text-[12px] text-[#6b7785]'>오늘만 2,000원 할인 · {(idx + 1) * 0.2}km</p>
                  <div className='text-[12px] text-[#1f6e6b]'>#빠른배달 #신선상품</div>
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
      </main>

      <StoreFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        value={filters}
        onApply={(v) => setFilters(v)}
        onReset={() => setFilters({})}
      />
    </div>
  );
}
