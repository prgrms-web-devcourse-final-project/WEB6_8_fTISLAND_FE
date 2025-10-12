import * as React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { RiderPageLayout } from '../RiderPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetTotalDeliveriesInfinite, useGetSummary } from '@/api/generated';
import type { GetTotalDeliveriesParams } from '@/api/generated/model/getTotalDeliveriesParams';

export const Route = createFileRoute('/(dashboard)/rider/history/')({
  component: RouteComponent,
});

type DeliveryStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
type SettlementStatus = 'PENDING' | 'COMPLETED';

type HistoryItem = {
  id: string;
  store: string;
  customerAddress: string;
  orderId: string;
  deliveryStatus: DeliveryStatus;
  settlementStatus: SettlementStatus;
  fee: number;
  createdAt: number;
};

type SortBy = 'LATEST' | 'OLDEST';

function RouteComponent() {
  const [sortBy, setSortBy] = React.useState<SortBy>('LATEST');
  const DELIVERY_LABEL: Record<DeliveryStatus, string> = {
    IN_PROGRESS: '배달 중',
    COMPLETED: '배달 완료',
    CANCELED: '주문 취소',
  };
  const SETTLEMENT_LABEL: Record<SettlementStatus, string> = {
    PENDING: '정산 대기',
    COMPLETED: '정산 완료',
  };

  // 요약 데이터 바인딩
  const summaryQuery = useGetSummary({ query: { staleTime: 10_000, refetchOnWindowFocus: false } } as any);
  const summary = ((summaryQuery.data as any)?.data?.content ?? undefined) as
    | {
        weeklyTransactionCount?: number;
        weeklySettledAmount?: number;
        scheduledSettleAmount?: number;
      }
    | undefined;
  const weeklyCount = Number(summary?.weeklyTransactionCount ?? 0);
  const pendingAmount = Number(summary?.scheduledSettleAmount ?? 0);
  const weeklySettled = Number(summary?.weeklySettledAmount ?? 0);

  const deliveriesQuery = useGetTotalDeliveriesInfinite<any>(
    { filter: sortBy, size: 20 } as GetTotalDeliveriesParams,
    {
      query: {
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (last: any) => last?.data?.content?.nextPageToken ?? undefined,
        refetchOnWindowFocus: false,
      },
    } as any
  );
  const items: HistoryItem[] = React.useMemo(() => {
    const pages = (deliveriesQuery.data?.pages ?? []) as any[];
    const list = pages.flatMap((p) => ((p as any)?.data?.content?.content ?? []) as any[]);
    return list.map((it: any) => ({
      id: String(it?.id ?? it?.orderId ?? ''),
      store: it?.store?.name ?? it?.storeName ?? '상점',
      customerAddress: it?.address ?? it?.customerAddress ?? '',
      orderId: String(it?.orderId ?? it?.id ?? ''),
      deliveryStatus: (it?.status as any) ?? 'COMPLETED',
      settlementStatus: (it?.settlementStatus as any) ?? 'PENDING',
      fee: Number(it?.deliveryFee ?? it?.fee ?? 0),
      createdAt: new Date(it?.createdAt ?? it?.completedAt ?? Date.now()).getTime(),
    }));
  }, [deliveriesQuery.data]);

  const sorted = items; // 서버 정렬 사용

  return (
    <RiderPageLayout>
      <div className='space-y-4'>
        {/* 요약 카드 */}
        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>이번 주 요약</CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-3 gap-2 px-4 pb-4'>
            <div className='rounded-2xl border border-[#dbe4ec] bg-white p-3 text-center'>
              <p className='text-[11px] text-[#6b7785]'>배달 건수</p>
              <p className='text-[16px] font-extrabold text-[#1b1b1b]'>{weeklyCount}건</p>
            </div>
            <div className='rounded-2xl border border-[#dbe4ec] bg-white p-3 text-center'>
              <p className='text-[11px] text-[#6b7785]'>정산 대기</p>
              <p className='text-[16px] font-extrabold text-[#1b1b1b]'>₩ {pendingAmount.toLocaleString()}</p>
            </div>
            <div className='rounded-2xl border border-[#dbe4ec] bg-white p-3 text-center'>
              <p className='text-[11px] text-[#6b7785]'>정산 완료</p>
              <p className='text-[16px] font-extrabold text-[#1b1b1b]'>₩ {weeklySettled.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* 디바이더 */}
        <div className='h-2 rounded-2xl bg-[#eef2f7]' />

        {/* 정렬 + 리스트 */}
        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>배달 내역</CardTitle>
              <div className='flex items-center gap-1 rounded-2xl bg-[#f5f7f9] p-1'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setSortBy('LATEST')}
                  className={`h-8 rounded-xl px-3 text-[12px] font-semibold ${sortBy === 'LATEST' ? 'bg-white shadow' : ''}`}>
                  최신 순
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setSortBy('OLDEST')}
                  className={`h-8 rounded-xl px-3 text-[12px] font-semibold ${sortBy === 'OLDEST' ? 'bg-white shadow' : ''}`}>
                  오래된 순
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='max-h-[calc(100dvh-380px)] space-y-3 overflow-y-auto sm:max-h-[calc(100dvh-400px)]'>
              {sorted.map((h) => (
                <Card key={h.id} className='border-none bg-white shadow-sm'>
                  <CardContent className='space-y-2 px-4 py-3'>
                    <div className='flex items-center justify-between text-[13px]'>
                      <p className='font-semibold text-[#1b1b1b]'>{h.store}</p>
                      <p className='text-[#6b7785]'>#{h.orderId}</p>
                    </div>
                    <p className='text-[12px] text-[#6b7785]'>{h.customerAddress}</p>
                    <div className='text-[12px]'>
                      <div className='flex items-center gap-2'>
                        <Badge
                          variant={
                            h.deliveryStatus === 'IN_PROGRESS'
                              ? 'default'
                              : h.deliveryStatus === 'COMPLETED'
                                ? 'secondary'
                                : 'outline'
                          }>
                          배송: {DELIVERY_LABEL[h.deliveryStatus]}
                        </Badge>
                        <Badge variant={h.settlementStatus === 'PENDING' ? 'outline' : 'secondary'}>
                          정산: {SETTLEMENT_LABEL[h.settlementStatus]}
                        </Badge>
                      </div>
                      <div className='mt-1 text-right font-semibold text-[#1b1b1b]'>₩ {h.fee.toLocaleString()}</div>
                    </div>
                    <div className='flex justify-end'>
                      <a href={`/rider/orders/${h.orderId}`}>
                        <Button className='h-8 rounded-full bg-[#2ac1bc] px-3 text-[12px] font-semibold text-white hover:bg-[#1ba7a1]'>
                          상세 보기
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </RiderPageLayout>
  );
}
