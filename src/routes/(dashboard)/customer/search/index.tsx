import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Search, Star } from 'lucide-react';
import StoreFilterSheet, { type StoreFilterValue } from '@/components/StoreFilterSheet';
import { CustomerHeader } from '../_components/CustomerHeader';
import { useInfiniteQuery } from '@tanstack/react-query';
import { http } from '@/api/core';
import { useGetMyProfile2, useGetAddress } from '@/api/generated';
import AddressManage from '@/components/address/AddressManage';

export const Route = createFileRoute('/(dashboard)/customer/search/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = React.useState('');
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<Partial<StoreFilterValue>>({});
  const [addressOpen, setAddressOpen] = React.useState(false);

  // 프로필/주소
  const myProfileQuery = useGetMyProfile2();
  const profile = (myProfileQuery.data as any)?.data?.content;
  const nickname = profile?.nickname ?? profile?.user?.username ?? '뭐든배달';
  const profileImageUrl = profile?.profileImageUrl as string | undefined;
  const defaultAddressId = profile?.defaultAddressId as number | undefined;
  const addressQuery = useGetAddress(defaultAddressId ?? 0, { query: { enabled: !!defaultAddressId } } as any);
  const boundAddress = (addressQuery.data as any)?.data?.content?.address as string | undefined;
  const [address, setAddress] = React.useState<string>('주소를 등록해 주세요');
  React.useEffect(() => {
    if (boundAddress) setAddress(boundAddress);
  }, [boundAddress]);
  const addressLat = (addressQuery.data as any)?.data?.content?.latitude as number | undefined;
  const addressLng = (addressQuery.data as any)?.data?.content?.longitude as number | undefined;
  const lat = Number.isFinite(addressLat as any) ? (addressLat as number) : 37.5665;
  const lng = Number.isFinite(addressLng as any) ? (addressLng as number) : 126.978;

  // 검색 API
  const distanceKm = (filters as any)?.distanceKm ?? 3;
  const storesQuery = useInfiniteQuery({
    queryKey: ['search-stores-page', { lat, lng, distanceKm, keyword }],
    queryFn: async ({ pageParam, signal }) => {
      const params: any = { lat, lng, distanceKm, limit: 12 };
      if (keyword.trim()) params.searchText = keyword.trim();
      if (pageParam) params.nextPageToken = pageParam;
      return await http.get('/api/v1/search/stores', { params, signal });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: any) => lastPage?.data?.content?.nextPageToken ?? undefined,
    refetchOnWindowFocus: false,
  });
  const pages = (storesQuery.data as any)?.pages ?? [];
  const results = pages.flatMap((p: any) => p?.data?.content?.stores ?? []);

  return (
    <div className='flex min-h-[100dvh] w-full flex-col bg-[#2ac1bc]'>
      <CustomerHeader
        nickname={nickname}
        profileImageUrl={profileImageUrl}
        address={address}
        headlineLines={['원하는 가게를', '지금 바로 찾아보세요']}
        onClickAddress={() => setAddressOpen(true)}
      />

      <main className='flex-1 space-y-4 overflow-y-auto rounded-t-[1.5rem] bg-[#f8f9fa] px-4 pb-6 pt-6 outline-[1.5px] outline-[#2ac1bc]/15 sm:rounded-t-[1.75rem] sm:px-6 sm:pb-7 sm:pt-7'>
        <div className='px-1'>
          <h1 className='text-[15px] font-semibold text-[#1b1b1b]'>검색</h1>
        </div>
        <Card className='border-none bg-white shadow-sm'>
          <CardContent className='px-4 py-4 sm:px-5'>
            <div className='flex items-center gap-2 rounded-2xl border border-[#bbe7e4] bg-[#f0fffd] px-3 py-2.5'>
              <Search className='size-[18px] text-[#2ac1bc]' aria-hidden />
              <Input
                placeholder='상점 이름을 입력해 보세요'
                className='h-9 flex-1 border-0 bg-transparent text-[13px] text-[#1b1b1b] placeholder:text-[#9aa5b1] focus-visible:ring-0'
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') storesQuery.refetch();
                }}
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
          {results.map((s: any) => (
            <Card
              key={s.storeId}
              className='cursor-pointer border-none bg-white shadow-sm'
              onClick={() => navigate({ to: '/customer/store/$storeId', params: { storeId: String(s.storeId) } })}>
              <CardContent className='flex items-center gap-3 px-4 py-3'>
                <div className='flex size-16 items-center justify-center rounded-2xl bg-[#e2f6f5] text-[#1f6e6b]'>
                  <Star className='size-4 text-[#2ac1bc]' aria-hidden />
                </div>
                <div className='flex-1'>
                  <p className='text-[14px] font-semibold text-[#1b1b1b]'>{s.name}</p>
                  <p className='text-[12px] text-[#6b7785]'>{s.distanceText ?? ''}</p>
                </div>
                <Button
                  size='sm'
                  className='h-8 rounded-full bg-[#2ac1bc] px-3 text-[12px] font-semibold text-white hover:bg-[#1ba7a1]'>
                  상세보기
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

      <Dialog open={addressOpen} onOpenChange={setAddressOpen}>
        <DialogContent className='mx-auto w-[90%] max-w-[28rem] max-h-[85vh] overflow-hidden rounded-3xl border-0 p-0 shadow-2xl'>
          <AddressManage
            defaultOpen
            asDialog
            role='customer'
            onSave={async (v) => {
              if (v.selectedAddress?.address) setAddress(v.selectedAddress.address);
              try {
                await myProfileQuery.refetch();
                await addressQuery.refetch();
              } catch {}
            }}
            onClose={() => setAddressOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
