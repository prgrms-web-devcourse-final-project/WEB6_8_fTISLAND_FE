import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { CustomerFooterNav } from '../_components/CustomerFooterNav';
import { Heart, Home, ListFilter, Search, User } from 'lucide-react';

export const Route = createFileRoute('/(dashboard)/customer/orders/')({
  component: RouteComponent,
});

type OrderItem = {
  id: string;
  store: string;
  menu: string;
  amount: number;
  date: string;
  status: 'preparing' | 'delivering' | 'completed' | 'cancelled';
};

const sampleOngoing: OrderItem[] = [
  {
    id: 'o1',
    store: '골목 마트',
    menu: '상품 1 외 2건',
    amount: 18900,
    date: '2025-10-04 18:12',
    status: 'delivering',
  },
  { id: 'o2', store: '꽃집 토도', menu: '장미다발', amount: 25900, date: '2025-10-04 17:40', status: 'preparing' },
];

const sampleCompleted: OrderItem[] = [
  {
    id: 'c1',
    store: '동네 베이커리',
    menu: '크루아상 세트',
    amount: 12900,
    date: '2025-10-03 12:21',
    status: 'completed',
  },
  { id: 'c2', store: '약국 굿헬스', menu: '영양제', amount: 34900, date: '2025-10-02 20:05', status: 'completed' },
];

function OrderRow({ item }: { item: OrderItem }) {
  return (
    <Card className='border-none bg-white shadow-sm'>
      <CardContent className='flex items-start justify-between gap-3 px-4 py-3'>
        <div className='space-y-0.5'>
          <p className='text-[14px] font-semibold text-[#1b1b1b]'>{item.store}</p>
          <p className='text-[12px] text-[#6b7785]'>{item.menu}</p>
          <p className='text-[12px] font-semibold text-[#1b1b1b]'>₩ {item.amount.toLocaleString()}</p>
          <p className='text-[11px] text-[#94a3b8]'>
            {item.date} ·{' '}
            {item.status === 'delivering'
              ? '배달 중'
              : item.status === 'preparing'
                ? '준비 중'
                : item.status === 'completed'
                  ? '완료'
                  : '취소'}
          </p>
        </div>
        <div className='flex flex-col items-end gap-2'>
          <Button
            variant='outline'
            className='h-8 rounded-full border-[#dbe4ec] px-3 text-[12px] font-semibold text-[#1b1b1b] hover:bg-[#f5f7f9]'>
            실시간 위치 보기
          </Button>
          <Button className='h-8 rounded-full bg-[#2ac1bc] px-3 text-[12px] font-semibold text-white hover:bg-[#1ba7a1]'>
            상세보기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RouteComponent() {
  const navigate = useNavigate();
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
          <h1 className='text-[16px] font-extrabold'>주문 내역</h1>
          <div className='size-9' aria-hidden />
        </div>
      </header>

      <main className='flex-1 space-y-3 overflow-y-auto rounded-t-[1.5rem] bg-[#f8f9fa] px-4 pb-6 pt-6 outline-[1.5px] outline-[#2ac1bc]/15 sm:rounded-t-[1.75rem] sm:px-6 sm:pb-7 sm:pt-7'>
        <Tabs defaultValue='ongoing' className='w-full'>
          <TabsList className='grid w-full grid-cols-2 rounded-2xl bg-white p-1'>
            <TabsTrigger
              value='ongoing'
              className='rounded-xl text-[12px] text-[#1b1b1b] data-[state=active]:bg-[#2ac1bc] data-[state=active]:text-white data-[state=active]:shadow'>
              진행 중
            </TabsTrigger>
            <TabsTrigger
              value='completed'
              className='rounded-xl text-[12px] text-[#1b1b1b] data-[state=active]:bg-[#2ac1bc] data-[state=active]:text-white data-[state=active]:shadow'>
              완료
            </TabsTrigger>
          </TabsList>
          <TabsContent value='ongoing' className='mt-3 space-y-3'>
            {sampleOngoing.map((o) => (
              <a key={o.id} href={`/customer/orders/${o.id}?status=${o.status}`}>
                <OrderRow item={o} />
              </a>
            ))}
          </TabsContent>
          <TabsContent value='completed' className='mt-3 space-y-3'>
            {sampleCompleted.map((o) => (
              <a key={o.id} href={`/customer/orders/${o.id}?status=completed`}>
                <OrderRow item={o} />
              </a>
            ))}
          </TabsContent>
        </Tabs>
        <div className='h-[calc(68px+env(safe-area-inset-bottom))]' />
      </main>

      <div className='fixed inset-x-0 bottom-0 z-50'>
        <CustomerFooterNav
          items={[
            { label: '홈', icon: Home },
            { label: '검색', icon: Search },
            { label: '즐겨찾기', icon: Heart },
            { label: '주문내역', icon: ListFilter },
            { label: '마이뭐든', icon: User },
          ]}
          activeIndex={3}
          onClickItem={(idx) => {
            if (idx === 0) navigate({ to: '/customer' });
            if (idx === 3) navigate({ to: '/customer/orders' });
          }}
        />
      </div>
    </div>
  );
}
