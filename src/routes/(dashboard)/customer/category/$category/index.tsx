import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Filter, Search, Star } from 'lucide-react';
import StoreFilterSheet, { type StoreFilterValue } from '@/components/StoreFilterSheet';
import { useQuery } from '@tanstack/react-query';
import { http } from '@/api/core';
import { useGetMyProfile2, useGetAddress, useSearchStoresInfinite } from '@/api/generated';
import type { StoreSearchRequest } from '@/api/generated/model/storeSearchRequest';

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

  // 카테고리 목록 조회 (id 매칭용)
  type StoreCategory = { id: number; name: string };
  type ApiResponse<T> = { success: boolean; code: string; message: string; content: T };
  const { data: categoryResp } = useQuery({
    queryKey: ['store-categories'],
    queryFn: async () => await http.get<ApiResponse<StoreCategory[]>>('/api/v1/store-categories'),
  });
  const apiCategories = categoryResp?.content ?? [];
  const selectedCategory = apiCategories.find((c) => c.name === category);
  const selectedCategoryId = selectedCategory?.id;

  // 기본 주소 좌표로 상점 검색
  const myProfileQuery = useGetMyProfile2();
  const profile = (myProfileQuery.data as any)?.data?.content;
  const defaultAddressId = profile?.defaultAddressId as number | undefined;
  const addressQuery = useGetAddress(defaultAddressId ?? 0, { query: { enabled: !!defaultAddressId } } as any);
  const latRaw = (addressQuery.data as any)?.data?.content?.latitude as number | undefined;
  const lngRaw = (addressQuery.data as any)?.data?.content?.longitude as number | undefined;
  const lat = Number.isFinite(latRaw) ? Math.trunc(latRaw as number) : Math.trunc(37.5665);
  const lng = Number.isFinite(lngRaw) ? Math.trunc(lngRaw as number) : Math.trunc(126.978);
  const req: StoreSearchRequest = { lat, lng, distanceKm: 3, limit: 12, categoryId: selectedCategoryId };
  const storesQuery = useSearchStoresInfinite(
    { request: req } as any,
    {
      query: {
        getNextPageParam: (lastPage: any) =>
          lastPage?.data?.content?.nextPageToken ? lastPage.data.content.nextPageToken : undefined,
        enabled: !!selectedCategoryId,
      },
    } as any
  );
  const pages = (storesQuery.data as any)?.pages ?? [];
  const stores = pages.flatMap((p: any) => p?.data?.content?.stores ?? []);

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
        {/* 카테고리 선택 섹션 */}
        <div className='mb-3 space-y-2'>
          <div className='text-[12px] font-semibold text-[#6b7785]'>카테고리 선택</div>
          <div className='no-scrollbar flex gap-2 overflow-x-auto'>
            {apiCategories.map((c) => {
              const active = c.name === category;
              return (
                <button
                  key={c.id}
                  type='button'
                  onClick={() => navigate({ to: '/customer/category/$category', params: { category: c.name } })}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                    active ? 'bg-[#2ac1bc] text-white' : 'bg-white text-[#1b1b1b] border border-[#dbe4ec]'
                  }`}>
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

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
          {stores.map((s: any) => (
            <Card
              key={s.storeId}
              className='cursor-pointer border-none bg-white shadow-sm'
              onClick={() => navigate({ to: '/customer/store/$storeId', params: { storeId: String(s.storeId) } })}>
              <CardContent className='flex gap-3 px-4 py-3'>
                <div className='flex size-16 items-center justify-center rounded-2xl bg-[#e2f6f5] text-[#1f6e6b]'>
                  {s.name?.slice(0, 2) ?? '가게'}
                </div>
                <div className='flex-1 space-y-1'>
                  <p className='text-[14px] font-semibold text-[#1b1b1b]'>{s.name}</p>
                  <p className='text-[12px] text-[#6b7785]'>{s.distanceText ?? ''}</p>
                  <div className='flex items-center gap-2 text-[12px] text-[#1f6e6b]'>
                    <span className='inline-flex items-center gap-1 rounded-full bg-[#2ac1bc]/10 px-2 py-0.5'>
                      <Star className='size-3 text-[#2ac1bc]' aria-hidden />
                      {s.rating ?? 'NEW'}
                    </span>
                    {s.tags?.length ? <span>#{s.tags.join(' #')}</span> : null}
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
          {storesQuery.hasNextPage ? (
            <div className='flex justify-center pt-2'>
              <Button
                variant='outline'
                size='sm'
                className='rounded-full'
                onClick={() => storesQuery.fetchNextPage()}
                disabled={storesQuery.isFetchingNextPage}>
                {storesQuery.isFetchingNextPage ? '불러오는 중…' : '더 보기'}
              </Button>
            </div>
          ) : null}
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
