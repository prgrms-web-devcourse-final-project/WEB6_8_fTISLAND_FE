import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Star } from 'lucide-react';
import StoreFilterSheet, { type StoreFilterValue } from '@/components/StoreFilterSheet';
import { CustomerHeader } from '../_components/CustomerHeader';

export const Route = createFileRoute('/(dashboard)/customer/favorites/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = React.useState('');
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<Partial<StoreFilterValue>>({});

  const stores = Array.from({ length: 8 }).map((_, i) => ({ id: `fav-${i + 1}`, name: `즐겨찾기 상점 ${i + 1}` }));
  const filtered = stores.filter((s) => s.name.includes(keyword));

  return (
    <div className='flex min-h-[100dvh] w-full flex-col bg-[#2ac1bc]'>
      <CustomerHeader
        nickname='뭐든배달'
        address='서울시 성북구 돌곶이로 27'
        headlineLines={['즐겨찾기 가게에서', '지금 바로 주문해요']}
      />

      <main className='flex-1 space-y-4 overflow-y-auto rounded-t-[1.5rem] bg-[#f8f9fa] px-4 pb-6 pt-6 outline-[1.5px] outline-[#2ac1bc]/15 sm:rounded-t-[1.75rem] sm:px-6 sm:pb-7 sm:pt-7'>
        <div className='px-1'>
          <h1 className='text-[15px] font-semibold text-[#1b1b1b]'>즐겨찾기</h1>
        </div>
        <Card className='border-none bg-white shadow-sm'>
          <CardContent className='px-4 py-4 sm:px-5'>
            <div className='flex items-center gap-2 rounded-2xl border border-[#bbe7e4] bg-[#f0fffd] px-3 py-2.5'>
              <Search className='size-[18px] text-[#2ac1bc]' aria-hidden />
              <Input
                placeholder='즐겨찾기 상점을 검색해 보세요'
                className='h-9 flex-1 border-0 bg-transparent text-[13px] text-[#1b1b1b] placeholder:text-[#9aa5b1] focus-visible:ring-0'
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setFilterOpen(true)}
                className='h-8 rounded-full border border-[#dbe4ec] px-3 text-[12px] font-semibold text-[#1b1b1b] hover:bg-[#f5f7f9]'>
                필터링
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className='max-h-[calc(100dvh-320px)] space-y-3 overflow-y-auto sm:max-h-[calc(100dvh-340px)]'>
          {filtered.map((s) => (
            <Card
              key={s.id}
              className='cursor-pointer border-none bg-white shadow-sm'
              onClick={() => navigate({ to: '/customer/store/$storeId', params: { storeId: s.id } })}>
              <CardContent className='flex items-center gap-3 px-4 py-3'>
                <div className='flex size-16 items-center justify-center rounded-2xl bg-[#e2f6f5] text-[#1f6e6b]'>
                  <Star className='size-4 text-[#2ac1bc]' aria-hidden />
                </div>
                <div className='flex-1'>
                  <p className='text-[14px] font-semibold text-[#1b1b1b]'>{s.name}</p>
                  <p className='text-[12px] text-[#6b7785]'>단골 상점으로 등록됨</p>
                </div>
                <Button
                  size='sm'
                  className='h-8 rounded-full bg-[#2ac1bc] px-3 text-[12px] font-semibold text-white hover:bg-[#1ba7a1]'>
                  보러가기
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
