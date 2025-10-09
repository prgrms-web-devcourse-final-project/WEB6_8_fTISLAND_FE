import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createFileRoute } from '@tanstack/react-router';
import { MapPin, Truck } from 'lucide-react';
import { SellerHeader } from './_components/SellerHeader';
import { Switch } from '@/components/ui/switch';
import { SellerFooterNav } from './_components/SellerFooterNav';
import {
  getAcceptedOrders,
  getPendingOrders,
  useGetStore,
  getGetAcceptedOrdersInfiniteQueryKey,
  getGetPendingOrdersInfiniteQueryKey,
  useAcceptOrder,
  useRejectOrder,
  useGetAcceptedOrdersInfinite,
  useGetPendingOrdersInfinite,
  useToggleStoreStatus,
} from '@/api/generated';
import type { OrderResponseStatus } from '@/api/generated/model/orderResponseStatus';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useStoreDetailsStore } from '@/store/storeDetails';

export const Route = createFileRoute('/(dashboard)/seller/')({
  component: RouteComponent,
});

// 데모용 PENDING_ORDERS는 API 연동으로 대체되었습니다.

const ACTIVE_ORDERS = [
  {
    id: 'ORD-2025',
    menu: '소담 도시락',
    quantity: 2,
    request: '젓가락 2개만 주세요.',
    address: '성북구 동소문동 1가 23-7',
    status: '준비 중' as const,
  },
  {
    id: 'ORD-2024',
    menu: '오늘의 샐러드 박스',
    quantity: 1,
    request: '드레싱 따로 포장 부탁드려요.',
    address: '성북구 안암동 3가 55-2',
    status: '배달 중' as const,
  },
  {
    id: 'ORD-2022',
    menu: '따끈한 수제 떡볶이',
    quantity: 2,
    request: '',
    address: '종로구 창신동 202-11',
    status: '배정 완료' as const,
  },
];

type OrderTabKey = 'accept' | 'status';

const ORDER_TABS: Array<{ key: OrderTabKey; label: string }> = [
  { key: 'accept', label: '주문 수락' },
  { key: 'status', label: '주문 현황' },
];

// 서버 데이터로 대체 예정. 상점 진입 시 단건 조회로 바인딩
const SELLER_PROFILE = {
  nickname: '김사장',
  storeName: '',
  address: '',
  profileImageUrl: '',
};

function RouteComponent() {
  const [orderTab, setOrderTab] = React.useState<OrderTabKey>('accept');
  const [isOpen, setIsOpen] = React.useState(true);
  const storeId = useAuthStore((s) => s.currentActiveProfileId);
  const toggleStoreStatusMutation = useToggleStoreStatus();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // 임시 하드코딩: 개발/테스트 목적. 추후 URL or auth 기반으로 교체
  const effectiveStoreId = 1;
  const storeQuery = useGetStore(effectiveStoreId, {
    query: { enabled: !!effectiveStoreId, staleTime: 10_000, refetchOnWindowFocus: false },
  });

  const setSelectedStore = useStoreDetailsStore((s) => s.setSelectedStore);
  React.useEffect(() => {
    const content = (storeQuery.data as any)?.data?.content;
    if (content) {
      setSelectedStore({
        id: content.id,
        name: content.name,
        description: content.description,
        roadAddr: content.roadAddr,
        imageUrl: content.imageUrl,
        category: content.category,
      });
    }
  }, [storeQuery.data, setSelectedStore]);

  // 주문 수락 대기 목록 무한 스크롤 (클라이언트 슬라이싱: 10개씩)
  const pendingQuery = useGetPendingOrdersInfinite<any>(effectiveStoreId ?? 0, {
    query: {
      enabled: !!effectiveStoreId && orderTab === 'accept',
      initialPageParam: 0,
      queryFn: async ({ pageParam, signal }) => {
        const res = await getPendingOrders(effectiveStoreId!, signal);
        const raw: any = (res as any)?.data ?? res;
        const list: any[] = raw?.content ?? [];
        const start = Number(pageParam ?? 0);
        const end = start + 10;
        return { ...raw, content: list.slice(start, end), __total: list.length };
      },
      getNextPageParam: (lastPage: any, allPages: any[]) => {
        const total = Number(lastPage?.__total ?? lastPage?.content?.length ?? 0);
        const loaded = allPages.reduce((acc, p: any) => acc + (p?.content?.length ?? 0), 0);
        return loaded < total ? loaded : undefined;
      },
      staleTime: 10_000,
      refetchOnWindowFocus: false,
    },
  });

  React.useEffect(() => {
    if (pendingQuery.isError) toast.error('주문 목록을 불러오지 못했어요.');
  }, [pendingQuery.isError]);

  React.useEffect(() => {
    if (pendingQuery.isSuccess && (pendingQuery.data?.pages?.length ?? 0) <= 1) {
      toast.success('대기 주문을 불러왔어요.');
    }
  }, [pendingQuery.isSuccess]);

  // 주문 현황(수락된 주문) 무한 스크롤 (클라이언트 슬라이싱: 10개씩)
  const acceptedQuery = useGetAcceptedOrdersInfinite<any>(effectiveStoreId ?? 0, {
    query: {
      enabled: !!effectiveStoreId && orderTab === 'status',
      initialPageParam: 0,
      queryFn: async ({ pageParam, signal }) => {
        const res = await getAcceptedOrders(effectiveStoreId!, signal);
        const raw: any = (res as any)?.data ?? res;
        const list: any[] = raw?.content ?? [];
        const start = Number(pageParam ?? 0);
        const end = start + 10;
        return { ...raw, content: list.slice(start, end), __total: list.length };
      },
      getNextPageParam: (lastPage: any, allPages: any[]) => {
        const total = Number(lastPage?.__total ?? lastPage?.content?.length ?? 0);
        const loaded = allPages.reduce((acc, p: any) => acc + (p?.content?.length ?? 0), 0);
        return loaded < total ? loaded : undefined;
      },
      staleTime: 10_000,
      refetchOnWindowFocus: false,
    },
  });

  React.useEffect(() => {
    if (acceptedQuery.isError) toast.error('주문 현황을 불러오지 못했어요.');
  }, [acceptedQuery.isError]);

  React.useEffect(() => {
    if (acceptedQuery.isSuccess && (acceptedQuery.data?.pages?.length ?? 0) <= 1) {
      toast.success('진행 중인 주문을 불러왔어요.');
    }
  }, [acceptedQuery.isSuccess]);

  const formatAmount = React.useCallback((amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  }, []);

  return (
    <div className='flex min-h-[100dvh] w-full flex-col bg-[#2ac1bc] shadow-[0_32px_80px_-40px_rgba(26,86,75,0.55)]'>
      <SellerHeader
        nickname={SELLER_PROFILE.nickname}
        storeName={(storeQuery.data as any)?.data?.content?.name ?? SELLER_PROFILE.storeName}
        address={(storeQuery.data as any)?.data?.content?.roadAddr ?? SELLER_PROFILE.address}
        description={(storeQuery.data as any)?.data?.content?.description ?? ''}
        profileImageUrl={(storeQuery.data as any)?.data?.content?.imageUrl ?? SELLER_PROFILE.profileImageUrl}
        onSettingsClick={() => console.log('seller settings open')}
      />

      <main
        ref={scrollRef}
        className='flex-1 space-y-5 overflow-y-auto rounded-t-[1.5rem] bg-[#f8f9fa] px-4 pb-28 pt-6 outline-[#2ac1bc]/15 ring-1 ring-[#2ac1bc]/15 sm:space-y-6 sm:rounded-t-[1.75rem] sm:px-6 sm:pb-32 sm:pt-7'>
        <Card className='border-none bg-white shadow-sm'>
          <CardContent className='flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='inline-flex flex-1 items-center justify-between rounded-full bg-[#e9f6f5] p-1 text-[13px] font-semibold text-[#1b1b1b] sm:flex-none sm:text-sm'>
              <div className='flex items-center gap-1'>
                {ORDER_TABS.map(({ key, label }) => {
                  const isActive = key === orderTab;
                  return (
                    <button
                      key={key}
                      type='button'
                      onClick={() => setOrderTab(key)}
                      className={
                        isActive
                          ? 'rounded-full bg-white px-4 py-2 text-[#1b1b1b] shadow-sm'
                          : 'rounded-full px-4 py-2 text-[#6b7785] hover:text-[#1b1b1b]'
                      }>
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className='flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#1b1b1b] shadow-sm sm:text-sm'>
                <Switch
                  checked={isOpen}
                  onCheckedChange={(next) => {
                    const prev = isOpen;
                    setIsOpen(next);
                    if (!effectiveStoreId) {
                      setIsOpen(prev);
                      toast.error('상점 정보를 확인할 수 없어요. 다시 로그인해 주세요.');
                      return;
                    }
                    toggleStoreStatusMutation.mutate(
                      { storeId: effectiveStoreId },
                      {
                        onSuccess: () => {
                          toast.success(next ? '영업 상태로 전환됐어요.' : '휴업 상태로 전환됐어요.');
                        },
                        onError: () => {
                          setIsOpen(prev);
                          toast.error('상태 변경에 실패했어요. 잠시 후 다시 시도해 주세요.');
                        },
                      }
                    );
                  }}
                  disabled={toggleStoreStatusMutation.isPending}
                  aria-busy={toggleStoreStatusMutation.isPending}
                  className='data-[state=checked]:bg-[#1ba7a1] data-[state=unchecked]:bg-[#cbd8e2]'
                />
                <span className='flex flex-col leading-tight'>
                  <span>{isOpen ? '영업중' : '휴업중'}</span>
                  <span className='text-[11px] font-medium text-[#6b7785]'>
                    {isOpen ? '주문 접수 가능' : '주문 중지'}
                  </span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {orderTab === 'accept' ? (
          <PendingOrdersSection
            query={pendingQuery}
            scrollRef={scrollRef}
            formatAmount={formatAmount}
            storeId={effectiveStoreId}
          />
        ) : (
          <AcceptedOrdersSection query={acceptedQuery} scrollRef={scrollRef} />
        )}
      </main>

      <SellerFooterNav active='home' />
    </div>
  );
}

type ActiveStatus = (typeof ACTIVE_ORDERS)[number]['status'];

function StatusBadge({ status }: { status: ActiveStatus }) {
  const { label, className } = React.useMemo(() => {
    switch (status) {
      case '준비 중':
        return { label: '준비 중', className: 'bg-[#ffe8cc] text-[#ad7b00]' };
      case '배달 중':
        return { label: '배달 중', className: 'bg-[#cbeffd] text-[#0f5b78]' };
      case '배정 완료':
        return { label: '배정 완료', className: 'bg-[#d8ffe7] text-[#1f6e6b]' };
      default:
        return { label: status, className: 'bg-[#e2e8f0] text-[#475569]' };
    }
  }, [status]);

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${className}`}>
      {label}
    </span>
  );
}

function AcceptedOrdersSection({
  query,
  scrollRef,
}: {
  query: ReturnType<typeof useGetAcceptedOrdersInfinite<any>>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = query;
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const root = scrollRef.current;
    const el = sentinelRef.current;
    if (!root || !el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        });
      },
      { root, rootMargin: '120px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [scrollRef, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = React.useMemo(() => {
    const pages = (data?.pages ?? []) as any[];
    return pages.flatMap((p) => p?.content ?? []);
  }, [data]);

  if (isLoading) {
    return (
      <section aria-label='진행 중인 주문 목록' className='space-y-3'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className='border-none bg-white shadow-[0_16px_48px_-32px_rgba(15,23,42,0.35)]'>
            <CardContent className='space-y-4 px-4 py-4'>
              <div className='h-4 w-28 animate-pulse rounded bg-slate-200' />
              <div className='h-5 w-48 animate-pulse rounded bg-slate-200' />
              <div className='h-4 w-64 animate-pulse rounded bg-slate-200' />
            </CardContent>
          </Card>
        ))}
      </section>
    );
  }

  if (error) {
    return (
      <section aria-label='진행 중인 주문 목록' className='space-y-3'>
        <p className='text-[12px] text-[#ef4444]'>목록을 불러오지 못했어요.</p>
      </section>
    );
  }

  return (
    <section aria-label='진행 중인 주문 목록' className='space-y-3'>
      {items.length === 0 ? (
        <Card className='border-none bg-white shadow-[0_16px_48px_-32px_rgba(15,23,42,0.35)]'>
          <CardContent className='px-4 py-6 text-center text-[13px] text-[#6b7785]'>
            진행 중인 주문이 없어요.
          </CardContent>
        </Card>
      ) : (
        items.map((order: any) => {
          const orderId = order?.id ?? '-';
          const address = order?.address ?? '';
          const status: OrderResponseStatus | string = order?.status ?? 'PREPARING';
          const itemsArr = Array.isArray(order?.orderItems) ? order.orderItems : [];
          const firstName = itemsArr?.[0]?.product?.name ?? '주문 상품';
          const qty = itemsArr.reduce((n: number, it: any) => n + Number(it?.quantity ?? 0), 0);
          return (
            <Card key={orderId} className='border-none bg-white shadow-[0_16px_48px_-32px_rgba(15,23,42,0.35)]'>
              <CardContent className='space-y-4 px-4 py-4'>
                <header className='flex items-center justify-between text-[12px] font-semibold text-[#1f6e6b]'>
                  <span>ORD-{orderId}</span>
                  <AcceptedStatusBadge status={status as OrderResponseStatus} />
                </header>
                <div className='space-y-1 text-[#1b1b1b]'>
                  <p className='text-[14px] font-semibold sm:text-[15px]'>
                    {firstName}
                    <span className='pl-1 text-[12px] text-[#6b7785]'>×{qty}</span>
                  </p>
                  {order?.storeNote ? (
                    <p className='rounded-xl bg-[#f5f7f9] px-3 py-2 text-[12px] text-[#475569]'>{order.storeNote}</p>
                  ) : null}
                  <div className='flex items-start gap-2 text-[12px] text-[#475569] sm:text-[13px]'>
                    <MapPin className='mt-0.5 size-4 text-[#2ac1bc]' aria-hidden />
                    {address}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
      <div ref={sentinelRef} />
      {isFetchingNextPage ? <p className='py-2 text-center text-[12px] text-[#6b7785]'>더 불러오는 중…</p> : null}
    </section>
  );
}

function AcceptedStatusBadge({ status }: { status: OrderResponseStatus }) {
  const { label, className } = React.useMemo(() => {
    switch (status) {
      case 'PREPARING':
        return { label: '준비 중', className: 'bg-[#ffe8cc] text-[#ad7b00]' };
      case 'DELIVERING':
        return { label: '배달 중', className: 'bg-[#cbeffd] text-[#0f5b78]' };
      case 'RIDER_ASSIGNED':
        return { label: '배정 완료', className: 'bg-[#d8ffe7] text-[#1f6e6b]' };
      case 'COMPLETED':
        return { label: '배달 완료', className: 'bg-[#e2e8f0] text-[#475569]' };
      default:
        return { label: status, className: 'bg-[#e2e8f0] text-[#475569]' };
    }
  }, [status]);

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${className}`}>
      {label}
    </span>
  );
}

function PendingOrdersSection({
  query,
  scrollRef,
  formatAmount,
  storeId,
}: {
  query: ReturnType<typeof useGetPendingOrdersInfinite<any>>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  formatAmount: (v: number) => string;
  storeId: number;
}) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = query;
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const rejectMutation = useRejectOrder({
    mutation: {
      onSuccess: () => {
        try {
          queryClient.invalidateQueries({ queryKey: getGetPendingOrdersInfiniteQueryKey(storeId) });
          queryClient.invalidateQueries({ queryKey: getGetAcceptedOrdersInfiniteQueryKey(storeId) });
        } catch {}
        toast.success('주문을 거절했어요.');
      },
      onError: () => {
        toast.error('주문 거절에 실패했어요. 잠시 후 다시 시도해 주세요.');
      },
    },
  });

  React.useEffect(() => {
    const root = scrollRef.current;
    const el = sentinelRef.current;
    if (!root || !el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        });
      },
      { root, rootMargin: '120px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [scrollRef, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = React.useMemo(() => {
    const pages = (data?.pages ?? []) as any[];
    return pages.flatMap((p) => p?.content ?? []);
  }, [data]);

  if (isLoading) {
    return (
      <section aria-label='수락 대기 주문 목록' className='space-y-3'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className='border-none bg-white shadow-[0_16px_48px_-32px_rgba(15,23,42,0.35)]'>
            <CardContent className='space-y-4 px-4 py-4'>
              <div className='h-4 w-28 animate-pulse rounded bg-slate-200' />
              <div className='h-5 w-48 animate-pulse rounded bg-slate-200' />
              <div className='h-4 w-64 animate-pulse rounded bg-slate-200' />
            </CardContent>
          </Card>
        ))}
      </section>
    );
  }

  if (error) {
    return (
      <section aria-label='수락 대기 주문 목록' className='space-y-3'>
        <p className='text-[12px] text-[#ef4444]'>목록을 불러오지 못했어요.</p>
      </section>
    );
  }

  return (
    <section aria-label='수락 대기 주문 목록' className='space-y-3'>
      {items.length === 0 ? (
        <Card className='border-none bg-white shadow-[0_16px_48px_-32px_rgba(15,23,42,0.35)]'>
          <CardContent className='px-4 py-6 text-center text-[13px] text-[#6b7785]'>
            대기 중인 주문이 없어요.
          </CardContent>
        </Card>
      ) : (
        items.map((order: any) => {
          const orderId = order?.id ?? '-';
          const address = order?.address ?? '';
          const total = Number(order?.totalPrice ?? 0);
          const itemsArr = Array.isArray(order?.orderItems) ? order.orderItems : [];
          const firstName = itemsArr?.[0]?.product?.name ?? '주문 상품';
          const qty = itemsArr.reduce((n: number, it: any) => n + Number(it?.quantity ?? 0), 0);
          return (
            <Card key={orderId} className='border-none bg-white shadow-[0_16px_48px_-32px_rgba(15,23,42,0.35)]'>
              <CardContent className='space-y-4 px-4 py-4'>
                <header className='flex items-center justify-between text-[12px] font-semibold text-[#1f6e6b]'>
                  <span>ORD-{orderId}</span>
                  <span className='inline-flex items-center gap-1 rounded-full bg-[#2ac1bc]/10 px-2 py-0.5 text-[#1f6e6b]'>
                    <Truck className='size-3.5' aria-hidden />
                    즉시 배달 가능
                  </span>
                </header>
                <div className='space-y-2 text-[#1b1b1b]'>
                  <p className='text-[14px] font-semibold sm:text-[15px]'>
                    {firstName}
                    <span className='pl-1 text-[12px] text-[#6b7785]'>×{qty}</span>
                  </p>
                  {order?.storeNote ? (
                    <p className='rounded-xl bg-[#f5f7f9] px-3 py-2 text-[12px] text-[#475569]'>{order.storeNote}</p>
                  ) : null}
                  <div className='flex items-center gap-2 text-[12px] text-[#475569] sm:text-[13px]'>
                    <MapPin className='mt-0.5 size-4 text-[#2ac1bc]' aria-hidden />
                    {address}
                  </div>
                  <div className='flex flex-wrap items-center gap-2 text-[12px] text-[#1f6e6b] sm:text-[13px]'>
                    <span className='rounded-full bg-[#2ac1bc]/10 px-3 py-1 font-semibold'>결제 확인 필요</span>
                    <span className='rounded-full bg-[#ffe14a]/20 px-3 py-1 font-semibold text-[#ad7b00]'>
                      ₩ {formatAmount(total)}
                    </span>
                  </div>
                </div>
                <footer className='flex flex-col gap-2 text-[12px] sm:flex-row sm:justify-end'>
                  <Button
                    type='button'
                    variant='outline'
                    className='h-10 rounded-full border-[#f87171] px-4 font-semibold text-[#f87171] hover:bg-[#f87171]/10'
                    onClick={() => {
                      const oid = Number(orderId);
                      if (!storeId || !Number.isFinite(oid)) return;
                      rejectMutation.mutate({ storeId, orderId: oid });
                    }}
                    disabled={rejectMutation.isPending}
                    aria-busy={rejectMutation.isPending}>
                    주문 거절
                  </Button>
                  <AcceptOrderButton storeId={storeId} orderId={Number(orderId)} />
                </footer>
              </CardContent>
            </Card>
          );
        })
      )}
      <div ref={sentinelRef} />
      {isFetchingNextPage ? <p className='py-2 text-center text-[12px] text-[#6b7785]'>더 불러오는 중…</p> : null}
    </section>
  );
}

function AcceptOrderButton({ storeId, orderId }: { storeId?: number | null; orderId: number }) {
  const qc = useQueryClient();
  const acceptMutation = useAcceptOrder({
    mutation: {
      onSuccess: () => {
        try {
          if (storeId) {
            qc.invalidateQueries({ queryKey: getGetPendingOrdersInfiniteQueryKey(storeId) });
            qc.invalidateQueries({ queryKey: getGetAcceptedOrdersInfiniteQueryKey(storeId) });
          }
        } catch {}
        toast.success('주문을 수락했어요.');
      },
      onError: () => {
        toast.error('주문 수락에 실패했어요. 잠시 후 다시 시도해 주세요.');
      },
    },
  });

  return (
    <Button
      type='button'
      className='h-10 rounded-full bg-[#1ba7a1] px-4 font-semibold text-white hover:bg-[#17928d]'
      onClick={() => {
        if (!storeId || !Number.isFinite(orderId)) return;
        acceptMutation.mutate({ storeId, orderId });
      }}
      disabled={acceptMutation.isPending}
      aria-busy={acceptMutation.isPending}>
      주문 수락
    </Button>
  );
}
