// React import removed (not used explicitly)
import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { useGetAllInfinite } from '@/api/generated';
import { OrderResponseStatus } from '@/api/generated/model/orderResponseStatus';
// import { toast } from 'sonner';

export const Route = createFileRoute('/(dashboard)/customer/orders/')({
  component: RouteComponent,
});

function OrderRow({
  item,
}: {
  item: {
    id: number | string;
    storeName?: string;
    menuText?: string;
    amount?: number;
    dateText?: string;
  };
}) {
  return (
    <Card className='border-none bg-white shadow-sm'>
      <CardContent className='flex items-start justify-between gap-3 px-4 py-3'>
        <div className='space-y-0.5'>
          <p className='text-[14px] font-semibold text-[#1b1b1b]'>{item.storeName ?? '가게'}</p>
          <p className='text-[12px] text-[#6b7785]'>{item.menuText ?? ''}</p>
          <p className='text-[12px] font-semibold text-[#1b1b1b]'>₩ {(item.amount ?? 0).toLocaleString()}</p>
          <p className='text-[11px] text-[#94a3b8]'>{item.dateText}</p>
        </div>
        <div className='flex flex-col items-end gap-2'>
          <Button className='h-8 rounded-full bg-[#2ac1bc] px-3 text-[12px] font-semibold text-white hover:bg-[#1ba7a1]'>
            상세보기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RouteComponent() {
  const ordersQuery = useGetAllInfinite(
    { size: 10 },
    {
      query: {
        getNextPageParam: (lastPage: any) => lastPage?.data?.content?.nextPageToken ?? undefined,
      },
    }
  );

  const pages = (ordersQuery.data as any)?.pages ?? [];
  const allOrders = pages.flatMap((p: any) => p?.data?.content?.content ?? []);

  const isOngoing = (s?: string) =>
    [
      OrderResponseStatus.CREATED,
      OrderResponseStatus.PENDING,
      OrderResponseStatus.PREPARING,
      OrderResponseStatus.RIDER_ASSIGNED,
      OrderResponseStatus.DELIVERING,
      OrderResponseStatus.CANCELLATION_REQUESTED,
    ].includes((s as any) ?? '');

  const isCompleted = (s?: string) =>
    [
      OrderResponseStatus.COMPLETED,
      OrderResponseStatus.CANCELED,
      OrderResponseStatus.REJECTED,
      OrderResponseStatus.PAYMENT_FAILED,
    ].includes((s as any) ?? '');

  const toRow = (o: any) => {
    const items = (o?.orderItems ?? []) as any[];
    const firstName = items?.[0]?.product?.name as string | undefined;
    const restCount = Math.max(0, (items?.length ?? 0) - 1);
    const menuText = firstName
      ? restCount > 0
        ? `${firstName} 외 ${restCount}건`
        : firstName
      : `주문 ${items?.length ?? 0}건`;
    const createdAt = o?.createdAt as string | undefined;
    const date = createdAt ? new Date(createdAt) : undefined;
    const two = (n: number) => String(n).padStart(2, '0');
    const dateText = date
      ? `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())} ${two(date.getHours())}:${two(date.getMinutes())}`
      : '';
    const status = o?.status as string | undefined;
    const statusText = isOngoing(status)
      ? status === OrderResponseStatus.DELIVERING
        ? '배달 중'
        : status === OrderResponseStatus.PREPARING
          ? '준비 중'
          : '진행 중'
      : isCompleted(status)
        ? '완료'
        : '';

    return {
      id: o?.id ?? '',
      storeName: o?.storeName ?? '가게',
      menuText,
      amount: o?.totalPrice ?? 0,
      dateText: `${dateText}${statusText ? ` · ${statusText}` : ''}`,
    };
  };

  const ongoingOrders = allOrders.filter((o: any) => isOngoing(o?.status)).map(toRow);
  const completedOrders = allOrders.filter((o: any) => isCompleted(o?.status)).map(toRow);
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
            {ongoingOrders.map((o: { id: number | string }) => (
              <a key={o.id} href={`/customer/orders/${o.id}`}>
                <OrderRow item={o} />
              </a>
            ))}
          </TabsContent>
          <TabsContent value='completed' className='mt-3 space-y-3'>
            {completedOrders.map((o: { id: number | string }) => (
              <a key={o.id} href={`/customer/orders/${o.id}`}>
                <OrderRow item={o} />
              </a>
            ))}
            {ordersQuery.hasNextPage ? (
              <div className='flex justify-center pt-2'>
                <Button
                  variant='outline'
                  size='sm'
                  className='rounded-full'
                  onClick={() => ordersQuery.fetchNextPage()}
                  disabled={ordersQuery.isFetchingNextPage}>
                  {ordersQuery.isFetchingNextPage ? '불러오는 중…' : '더 보기'}
                </Button>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
        <div className='h-[calc(68px+env(safe-area-inset-bottom))]' />
      </main>
    </div>
  );
}
