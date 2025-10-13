import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Menu, Search, Star } from 'lucide-react';
import { useGetStore, useSearchProductsInfinite } from '@/api/generated';
import type { SearchProductsParams } from '@/api/generated/model/searchProductsParams';

export const Route = createFileRoute('/(dashboard)/customer/store/$storeId/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { storeId } = Route.useParams();

  const numericStoreId = Number(storeId);
  const storeQuery = useGetStore(numericStoreId, {
    query: { enabled: Number.isFinite(numericStoreId), staleTime: 10_000, refetchOnWindowFocus: false },
  } as any);
  const store = (storeQuery.data as any)?.data?.content;

  const [searchText, setSearchText] = React.useState('');
  const params: SearchProductsParams = { request: { limit: 10, searchText: searchText || undefined } } as any;
  const productsQuery = useSearchProductsInfinite<any>(numericStoreId, params, {
    query: {
      enabled: Number.isFinite(numericStoreId),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage: any) => lastPage?.data?.content?.nextPageToken ?? undefined,
      refetchOnWindowFocus: false,
    },
  } as any);

  const products = React.useMemo(() => {
    const pages = (productsQuery.data?.pages ?? []) as any[];
    return pages.flatMap((p) => (p?.data?.content?.products ?? p?.data?.content?.content ?? []) as any[]);
  }, [productsQuery.data]);

  return (
    <div className='flex min-h-[100dvh] w-full flex-col bg-[#2ac1bc]'>
      <header className='relative h-[230px] w-full overflow-hidden'>
        {store?.imageUrl ? (
          <img
            src={store.imageUrl}
            alt={store?.name ?? '상점 이미지'}
            className='absolute inset-0 h-full w-full object-cover opacity-80'
          />
        ) : (
          <div className='absolute inset-0 bg-[url(https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=2070&auto=format&fit=crop)] bg-cover bg-center opacity-80' />
        )}
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
          <h1 className='text-[20px] font-extrabold'>{store?.name ?? `가게 이름 ${storeId}`}</h1>
          <p className='mt-1 inline-flex items-center gap-1 text-[12px]'>
            <Star className='size-3 text-[#FACC15]' aria-hidden />
            {typeof store?.rating === 'number' ? store.rating.toFixed(1) : 'NEW'}
          </p>
        </div>
      </header>

      <main className='flex-1 space-y-4 rounded-t-[1.5rem] bg-[#f8f9fa] px-4 pb-6 pt-4 outline-[1.5px] outline-[#2ac1bc]/15 sm:rounded-t-[1.75rem] sm:px-6 sm:pb-7 sm:pt-5'>
        <section className='-mt-2 sm:-mt-3 rounded-2xl bg-white px-4 pt-6 pb-4 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.28)] sm:px-5 sm:pt-7 sm:pb-5'>
          <div className='flex items-start justify-between'>
            <div className='space-y-1'>
              <h2 className='text-[18px] font-extrabold text-[#1b1b1b]'>상점 정보</h2>
              <p className='text-[12px] text-white/80'></p>
            </div>
          </div>

          <div className='mt-3 grid grid-cols-3 gap-2 text-center text-[12px] text-[#1b1b1b]'>
            <div className='rounded-xl bg-[#f5f7f9] px-3 py-2'>
              최소주문금액{' '}
              {store?.minOrderPrice ? new Intl.NumberFormat('ko-KR').format(store.minOrderPrice) + '원' : '정보 없음'}
            </div>
            <div className='rounded-xl bg-[#f5f7f9] px-3 py-2'>
              배달비
              <br />
              {store?.deliveryFeeText ?? '정보 없음'}
            </div>
            <div className='rounded-xl bg-[#f5f7f9] px-3 py-2'>
              리뷰
              <br />
              {store?.reviewCount ?? 0}개
            </div>
          </div>

          <div className='mt-3'>
            <div className='flex items-center gap-2 rounded-2xl border border-[#bbe7e4] bg-[#f0fffd] px-3 py-2.5'>
              <Search className='size-[18px] text-[#2ac1bc]' aria-hidden />
              <Input
                placeholder='이 상점의 상품 검색'
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className='h-9 flex-1 border-0 bg-transparent text-[13px] text-[#1b1b1b] placeholder:text-[#9aa5b1] focus-visible:ring-0'
              />
              <Button
                size='sm'
                onClick={() => productsQuery.refetch()}
                className='h-8 rounded-full bg-[#2ac1bc] px-4 text-[12px] font-semibold text-white hover:bg-[#1ba7a1]'>
                검색
              </Button>
            </div>
          </div>
        </section>

        <section className='space-y-3'>
          <div className='max-h-[calc(100dvh-420px)] space-y-3 overflow-y-auto sm:max-h-[calc(100dvh-440px)]'>
            {productsQuery.isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={`s-${i}`} className='border-none bg-white shadow-sm'>
                  <CardContent className='flex items-center gap-3 px-4 py-3'>
                    <div className='size-16 animate-pulse rounded-2xl bg-[#e2e8f0]' />
                    <div className='flex-1 space-y-2'>
                      <div className='h-4 w-44 animate-pulse rounded bg-[#e2e8f0]' />
                      <div className='h-3 w-64 animate-pulse rounded bg-[#e2e8f0]' />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : products.length === 0 ? (
              <Card className='border-none bg-white shadow-sm'>
                <CardContent className='px-4 py-6 text-center text-[13px] text-[#6b7785]'>상품이 없습니다.</CardContent>
              </Card>
            ) : (
              products.map((p: any) => (
                <Card
                  key={p?.productId ?? p?.id}
                  className='cursor-pointer border-none bg-white shadow-sm'
                  onClick={() =>
                    navigate({
                      to: '/customer/store/$storeId/product/$productId',
                      params: { storeId, productId: String(p?.productId ?? p?.id) },
                    })
                  }>
                  <CardContent className='flex items-center gap-3 px-4 py-3'>
                    {p?.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p?.name ?? '상품 이미지'}
                        className='size-16 rounded-2xl object-cover'
                      />
                    ) : (
                      <div className='size-16 rounded-2xl bg-[#e2f6f5]' />
                    )}
                    <div className='flex-1'>
                      <p className='text-[14px] font-semibold text-[#1b1b1b]'>{p?.name ?? '상품'}</p>
                      <p className='text-[12px] text-[#6b7785]'>
                        ₩ {new Intl.NumberFormat('ko-KR').format(Number(p?.price ?? 0))}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            {productsQuery.hasNextPage ? (
              <div className='flex justify-center pt-2'>
                <Button
                  variant='outline'
                  size='sm'
                  className='rounded-full'
                  onClick={() => productsQuery.fetchNextPage()}
                  disabled={productsQuery.isFetchingNextPage}>
                  {productsQuery.isFetchingNextPage ? '불러오는 중…' : '더 보기'}
                </Button>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
