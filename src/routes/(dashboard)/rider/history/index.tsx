import * as React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { RiderPageLayout } from '../RiderPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

type SortBy = 'newest' | 'oldest';

function RouteComponent() {
  const [sortBy, setSortBy] = React.useState<SortBy>('newest');
  const DELIVERY_LABEL: Record<DeliveryStatus, string> = {
    IN_PROGRESS: '배달 중',
    COMPLETED: '배달 완료',
    CANCELED: '주문 취소',
  };
  const SETTLEMENT_LABEL: Record<SettlementStatus, string> = {
    PENDING: '정산 대기',
    COMPLETED: '정산 완료',
  };

  const weeklyCount = 18;
  const pendingAmount = 42000;
  const weeklySettled = 196000;

  const [items] = React.useState<HistoryItem[]>([
    {
      id: 'h1',
      store: '골목 마트',
      customerAddress: '서울 성북구 돌곶이로 27 101호',
      orderId: 'ORD-1201',
      deliveryStatus: 'COMPLETED',
      settlementStatus: 'COMPLETED',
      fee: 3200,
      createdAt: Date.now() - 1000 * 60 * 30,
    },
    {
      id: 'h2',
      store: '꽃집 토도',
      customerAddress: '서울 성북구 동소문로25길 12 1층',
      orderId: 'ORD-1188',
      deliveryStatus: 'IN_PROGRESS',
      settlementStatus: 'PENDING',
      fee: 3800,
      createdAt: Date.now() - 1000 * 60 * 120,
    },
    {
      id: 'h3',
      store: '동네 베이커리',
      customerAddress: '서울 성북구 장위로 10',
      orderId: 'ORD-1166',
      deliveryStatus: 'CANCELED',
      settlementStatus: 'PENDING',
      fee: 0,
      createdAt: Date.now() - 1000 * 60 * 300,
    },
  ]);

  const sorted = React.useMemo(() => {
    const arr = [...items];
    if (sortBy === 'newest') arr.sort((a, b) => b.createdAt - a.createdAt);
    else arr.sort((a, b) => a.createdAt - b.createdAt);
    return arr;
  }, [items, sortBy]);

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
                  onClick={() => setSortBy('newest')}
                  className={`h-8 rounded-xl px-3 text-[12px] font-semibold ${sortBy === 'newest' ? 'bg-white shadow' : ''}`}>
                  최신 순
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setSortBy('oldest')}
                  className={`h-8 rounded-xl px-3 text-[12px] font-semibold ${sortBy === 'oldest' ? 'bg-white shadow' : ''}`}>
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
