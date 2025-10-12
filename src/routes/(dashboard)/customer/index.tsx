import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Heart, Home, ListFilter, Search, ShoppingBag, Star, User } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { CustomerHeader } from './_components/CustomerHeader';
import { useGetMyProfile2, useGetAddress, useGetUnreadCount } from '@/api/generated';
import type { GetUnreadCountParams } from '@/api/generated/model/getUnreadCountParams';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AddressManage from '@/components/address/AddressManage';
import StoreFilterSheet, { type StoreFilterValue } from '@/components/StoreFilterSheet';
import { http } from '@/api/core';
import { useSearchStoresInfinite, useGetNotificationsInfinite, useMarkAsRead } from '@/api/generated';
import type { GetNotificationsParams } from '@/api/generated/model/getNotificationsParams';
import type { StoreSearchRequest } from '@/api/generated/model/storeSearchRequest';
import { useQueryClient } from '@tanstack/react-query';
import { getGetUnreadCountQueryKey, useSubscribe } from '@/api/generated';

export const Route = createFileRoute('/(dashboard)/customer/')({
  component: RouteComponent,
});

interface HomeSearchForm {
  keyword: string;
}

type StoreCategory = { id: number; name: string };
type ApiResponse<T> = { success: boolean; code: string; message: string; content: T };

const ICON_POOL = [ShoppingBag, Home, Star, Heart, User] as const;
const COLOR_POOL = [
  'bg-[#ECFFD9]',
  'bg-[#FFECD9]',
  'bg-[#E5F2FF]',
  'bg-[#FFE5F4]',
  'bg-[#FFF7D9]',
  'bg-[#F0E5FF]',
  'bg-[#E3FFF7]',
  'bg-[#FFEADF]',
] as const;

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
  const [addressOpen, setAddressOpen] = React.useState(false);
  const [address, setAddress] = React.useState<string>('서울시 성북구 돌곶이로 27');
  const myProfileQuery = useGetMyProfile2();
  const profile = (myProfileQuery.data as any)?.data?.content;
  const nickname = profile?.nickname ?? profile?.user?.username ?? '뭐든배달';
  const profileImageUrl = profile?.profileImageUrl as string | undefined;
  const defaultAddressId = profile?.defaultAddressId as number | undefined;
  const profileId = profile?.profileId as number | undefined;
  const addressQuery = useGetAddress(defaultAddressId ?? 0, { query: { enabled: !!defaultAddressId } } as any);
  const unreadQuery = useGetUnreadCount(
    { profileId: profileId ?? 0 } as GetUnreadCountParams,
    { query: { enabled: !!profileId, staleTime: 10_000, refetchOnWindowFocus: false } } as any
  );
  const unreadCount = Number((unreadQuery.data as any)?.data?.content?.count ?? 0);
  const boundAddress = (addressQuery.data as any)?.data?.content?.address as string | undefined;
  React.useEffect(() => {
    if (boundAddress) setAddress(boundAddress);
  }, [boundAddress]);

  const { data: categoryResp, isLoading: categoriesLoading } = useQuery({
    queryKey: ['store-categories'],
    queryFn: async () => await http.get<ApiResponse<StoreCategory[]>>('/api/v1/store-categories'),
  });
  const apiCategories = categoryResp?.content ?? [];

  // 주변 상점 목록: 기본 주소 좌표(정수) 사용, 없으면 서울시청 좌표(정수)
  const addressLat = (addressQuery.data as any)?.data?.content?.latitude as number | undefined;
  const addressLng = (addressQuery.data as any)?.data?.content?.longitude as number | undefined;
  const lat = Number.isFinite(addressLat) ? Math.trunc(addressLat as number) : Math.trunc(37.5665);
  const lng = Number.isFinite(addressLng) ? Math.trunc(addressLng as number) : Math.trunc(126.978);
  const storeReq: StoreSearchRequest = { lat, lng, distanceKm: 3, limit: 10 };
  const storesQuery = useSearchStoresInfinite(
    { request: storeReq } as any,
    {
      query: {
        getNextPageParam: (lastPage: any) =>
          lastPage?.data?.content?.nextPageToken ? lastPage.data.content.nextPageToken : undefined,
      },
    } as any
  );
  const storePages = (storesQuery.data as any)?.pages ?? [];
  const stores = storePages.flatMap((p: any) => p?.data?.content?.stores ?? []);

  // 알림 팝업 상태 & 필터
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [showRead, setShowRead] = React.useState<'all' | 'unread' | 'read'>('all');
  const markAsReadMutation = useMarkAsRead();
  const notificationsQuery = useGetNotificationsInfinite<any>(
    {
      profileId: profileId ?? 0,
      isRead: showRead === 'all' ? undefined : showRead === 'read',
    } as GetNotificationsParams,
    {
      query: {
        enabled: !!profileId && notificationsOpen,
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (last: any) => last?.data?.content?.nextPageToken ?? undefined,
        refetchOnWindowFocus: false,
      },
    }
  );
  const notificationItems = React.useMemo(() => {
    const pages = (notificationsQuery.data?.pages ?? []) as any[];
    return pages.flatMap((p) => (p?.data?.content?.content ?? []) as any[]);
  }, [notificationsQuery.data]);
  const qc = useQueryClient();

  // SSE 구독: 프로필 ID 기준 (X-Device-ID는 axios 인터셉터에서 자동 첨부)
  useSubscribe(
    { profileId: profileId ?? 0 } as any,
    {
      query: {
        enabled: !!profileId,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
        select: (res: any) => res,
        onSuccess: () => {},
        onError: () => {},
      },
    } as any
  );
  React.useEffect(() => {
    if (!profileId) return;
    // SSE 자체는 orval의 customInstance를 통해 열리고, 서버 푸시 후 캐시 무효화로 반영
    const invalidate = () => {
      try {
        qc.invalidateQueries({ queryKey: getGetUnreadCountQueryKey({ profileId }) });
        if (notificationsOpen) notificationsQuery.refetch();
      } catch {}
    };
    // 폴백: 일정 주기로 안전하게 갱신
    const i = setInterval(invalidate, 30_000);
    return () => clearInterval(i);
  }, [profileId, qc, notificationsOpen, notificationsQuery]);

  return (
    <div className='flex min-h-[100dvh] w-full flex-col bg-[#2ac1bc] shadow-[0_32px_80px_-40px_rgba(26,86,75,0.55)]'>
      <CustomerHeader
        nickname={nickname}
        profileImageUrl={profileImageUrl}
        address={address}
        unreadCount={unreadCount}
        onClickAddress={() => setAddressOpen(true)}
        onClickNotifications={() => setNotificationsOpen(true)}
      />

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
              {categoriesLoading &&
                Array.from({ length: 10 }).map((_, i) => (
                  <div key={`skeleton-${i}`} className='flex flex-col items-center gap-1.5 rounded-2xl p-2'>
                    <span className='flex size-12 animate-pulse items-center justify-center rounded-full bg-[#eef2f7]' />
                    <span className='h-3 w-12 animate-pulse rounded bg-[#eef2f7]' />
                  </div>
                ))}
              {!categoriesLoading &&
                (showAllCategories ? apiCategories : apiCategories.slice(0, 9)).map((cat, idx) => {
                  const Icon = ICON_POOL[idx % ICON_POOL.length];
                  const color = COLOR_POOL[idx % COLOR_POOL.length];
                  return (
                    <button
                      key={cat.id}
                      type='button'
                      onClick={() =>
                        navigate({
                          to: '/customer/category/$category',
                          params: { category: cat.name },
                        })
                      }
                      className='flex flex-col items-center gap-1.5 rounded-2xl bg-white p-2 text-[11px] font-semibold text-[#1b1b1b] shadow-[0_12px_32px_-24px_rgba(15,23,42,0.35)] transition-colors hover:bg-[#f5f7f9]'>
                      <span className={`flex size-12 items-center justify-center rounded-full ${color}`}>
                        <Icon className='size-5 text-[#1f6e6b]' aria-hidden />
                      </span>
                      {cat.name}
                    </button>
                  );
                })}
              {!showAllCategories && apiCategories.length > 10 && (
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
            {stores.map((s: any) => (
              <Card key={s.storeId} className='border-none bg-white shadow-sm'>
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

      <Dialog open={addressOpen} onOpenChange={setAddressOpen}>
        <DialogContent className='mx-auto w-[90%] max-w-[28rem] max-h-[85vh] overflow-hidden rounded-3xl border-0 p-0 shadow-2xl'>
          <AddressManage
            defaultOpen
            asDialog
            role='customer'
            onSave={(v) => {
              if (v.selectedAddress?.address) {
                setAddress(v.selectedAddress.address);
              }
            }}
            onClose={() => setAddressOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className='mx-auto w-[92%] max-w-[28rem] rounded-3xl border-0 p-0 shadow-2xl'>
          <DialogHeader className='px-5 pb-2 pt-4'>
            <DialogTitle className='text-[15px] font-semibold text-[#1b1b1b]'>알림</DialogTitle>
          </DialogHeader>
          <div className='space-y-3 px-5 pb-5'>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={() => notificationsQuery.refetch()}
                className='rounded-full border border-[#cbd8e2] px-3 py-1 text-[12px] font-semibold text-[#1b1b1b] hover:bg-[#f5f7f9]'>
                새로고침
              </button>
              <div className='ml-auto flex gap-1 rounded-full bg-[#f5f7f9] p-1 text-[12px] font-semibold'>
                {(
                  [
                    { key: 'all', label: '전체' },
                    { key: 'unread', label: '안읽음' },
                    { key: 'read', label: '읽음' },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    type='button'
                    onClick={() => setShowRead(key)}
                    className={
                      showRead === key
                        ? 'rounded-full bg-white px-3 py-1 text-[#1b1b1b]'
                        : 'rounded-full px-3 py-1 text-[#6b7785] hover:text-[#1b1b1b]'
                    }>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className='space-y-2'>
              {notificationItems.length === 0 ? (
                <Card className='border-none bg-white shadow-sm'>
                  <CardContent className='px-4 py-6 text-center text-[13px] text-[#6b7785]'>
                    알림이 없습니다.
                  </CardContent>
                </Card>
              ) : (
                notificationItems.map((n: any) => {
                  const isRead = !!n?.isRead;
                  return (
                    <button
                      key={n?.id}
                      type='button'
                      onClick={() => {
                        if (!isRead && n?.id) {
                          markAsReadMutation.mutate({ id: Number(n.id), params: { profileId: profileId! } } as any, {
                            onSuccess: () => {
                              try {
                                qc.invalidateQueries({
                                  queryKey: getGetUnreadCountQueryKey({ profileId: profileId! }),
                                });
                              } catch {}
                            },
                          });
                        }
                      }}
                      className={
                        'w-full rounded-2xl border border-[#e5e7eb] bg-white px-3 py-3 text-left text-[13px] ' +
                        (isRead ? 'opacity-60' : '')
                      }>
                      <p className='font-semibold text-[#1b1b1b]'>{n?.title ?? '알림'}</p>
                      {n?.message ? <p className='text-[#475569]'>{n.message}</p> : null}
                      <div className='pt-1 text-[11px] text-[#6b7785]'>
                        {n?.createdAt ? new Date(n.createdAt).toLocaleString('ko-KR') : ''}
                      </div>
                    </button>
                  );
                })
              )}
              {notificationsQuery.hasNextPage ? (
                <div className='flex justify-center pt-1'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='rounded-full'
                    onClick={() => notificationsQuery.fetchNextPage()}
                    disabled={notificationsQuery.isFetchingNextPage}>
                    {notificationsQuery.isFetchingNextPage ? '불러오는 중…' : '더 보기'}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
