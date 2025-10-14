import * as React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import {
  useGet,
  useCancel,
  getGetQueryKey,
  getGetInProgressOrdersInfiniteQueryKey,
  getGetCompletedOrdersInfiniteQueryKey,
} from '@/api/generated';
import { OrderResponseStatus } from '@/api/generated/model/orderResponseStatus';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const Route = createFileRoute('/(dashboard)/customer/orders/$orderId/')({
  validateSearch: (search: Record<string, unknown>) => {
    return { status: (search.status as string) || 'pending' } as { status: string };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { orderId } = Route.useParams();
  const { status: statusFromSearch } = Route.useSearch();
  const [status, setStatus] = React.useState<'pending' | 'accepted' | 'delivering' | 'completed'>(
    (statusFromSearch as any) === 'completed' ? 'completed' : 'pending'
  );
  const [riderAssigned, _setRiderAssigned] = React.useState(false);
  const [openCancel, setOpenCancel] = React.useState(false);
  const { register, handleSubmit, reset } = useForm<{ cancelReason: string }>({ defaultValues: { cancelReason: '' } });
  const numericOrderId = Number(orderId);
  const orderQuery = useGet(numericOrderId, { query: { enabled: Number.isFinite(numericOrderId) } } as any);
  const queryClient = useQueryClient();
  const cancelMutation = useCancel({
    mutation: {
      onSuccess: () => {
        toast.success('주문을 취소했어요');
        // 상세/목록 쿼리 무효화로 즉시 갱신
        if (Number.isFinite(numericOrderId)) {
          queryClient.invalidateQueries({ queryKey: getGetQueryKey(numericOrderId) as any });
        }
        queryClient.invalidateQueries({ queryKey: getGetInProgressOrdersInfiniteQueryKey() as any });
        queryClient.invalidateQueries({ queryKey: getGetCompletedOrdersInfiniteQueryKey(undefined) as any });
        setStatus('completed');
        setOpenCancel(false);
        reset({ cancelReason: '' });
      },
      onError: () => {
        toast.error('주문 취소에 실패했어요');
      },
    },
  } as any);

  React.useEffect(() => {
    if (orderQuery.isError) {
      toast.error('주문 상세를 불러오지 못했어요');
    }
  }, [orderQuery.isError]);

  const order = (orderQuery.data as any)?.data?.content ?? undefined;

  React.useEffect(() => {
    const s = order?.status as string | undefined;
    if (!s) return;
    if (
      [OrderResponseStatus.CREATED, OrderResponseStatus.PENDING, OrderResponseStatus.PAYMENT_FAILED].includes(
        (s as any) ?? ''
      )
    ) {
      setStatus('pending');
    } else if ([OrderResponseStatus.PREPARING].includes((s as any) ?? '')) {
      setStatus('accepted');
    } else if ([OrderResponseStatus.RIDER_ASSIGNED, OrderResponseStatus.DELIVERING].includes((s as any) ?? '')) {
      setStatus('delivering');
    } else if (
      [
        OrderResponseStatus.COMPLETED,
        OrderResponseStatus.CANCELED,
        OrderResponseStatus.REJECTED,
        OrderResponseStatus.CANCELLATION_REQUESTED,
      ].includes((s as any) ?? '')
    ) {
      setStatus('completed');
    }
    _setRiderAssigned([OrderResponseStatus.RIDER_ASSIGNED, OrderResponseStatus.DELIVERING].includes((s as any) ?? ''));
  }, [order?.status]);

  const storeName = (order?.storeName as string | undefined) ?? '가게';
  const menus = ((order?.orderItems as any[]) ?? [])
    .map((it) => {
      const n = it?.product?.name as string | undefined;
      const q = it?.quantity as number | undefined;
      return n ? (q ? `${n} x${q}` : n) : undefined;
    })
    .filter(Boolean) as string[];
  const orderAmount = (order?.storePrice as number | undefined) ?? 0;
  const deliveryFee = (order?.deliveryPrice as number | undefined) ?? 0;
  const totalAmount = (order?.totalPrice as number | undefined) ?? orderAmount + deliveryFee;
  const address = (order?.address as string | undefined) ?? '';
  const createdAt = (order?.createdAt as string | undefined) ?? '';
  const createdAtText = React.useMemo(() => {
    if (!createdAt) return '';
    const d = new Date(createdAt);
    const two = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`;
  }, [createdAt]);
  const orderNumber = (order?.merchantId as string | undefined) ?? String(order?.id ?? orderId);

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
          <h1 className='text-[16px] font-extrabold'>주문 상세</h1>
          <div className='size-9' aria-hidden />
        </div>
      </header>

      <main className='flex-1 space-y-4 overflow-y-auto rounded-t-[1.5rem] bg-[#f8f9fa] px-4 pb-6 pt-6 outline-[1.5px] outline-[#2ac1bc]/15 sm:rounded-t-[1.75rem] sm:px-6 sm:pb-7 sm:pt-7'>
        {status !== 'completed' ? (
          <Card className='border-none bg-white shadow-sm'>
            <CardContent className='space-y-3 px-4 py-4 sm:px-5'>
              {riderAssigned ? (
                <div className='h-40 rounded-2xl bg-[#e2f6f5] text-center text-[12px] text-[#1f6e6b]'>
                  지도(라이더 실시간 위치)
                </div>
              ) : (
                <div className='flex h-40 flex-col items-center justify-center gap-2 rounded-2xl bg-[#f5f7f9]'>
                  <div className='size-10 rounded-full bg-[#e2f6f5]' />
                  <p className='text-[13px] font-semibold text-[#1b1b1b]'>배정을 기다리고 있습니다.</p>
                  <p className='text-[12px] text-[#6b7785]'>잠시만 기다려 주세요.</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className='border-none bg-white shadow-sm'>
            <CardContent className='flex h-40 flex-col items-center justify-center gap-2 px-4 py-4 sm:px-5'>
              <div className='size-10 rounded-full bg-[#e2f6f5]' />
              <p className='text-[13px] font-semibold text-[#1b1b1b]'>배달이 완료되었습니다.</p>
              <p className='text-[12px] text-[#6b7785]'>이용해 주셔서 감사합니다.</p>
            </CardContent>
          </Card>
        )}

        {/* 주문 상태/취소 */}
        <Card className='border-none bg-white shadow-sm'>
          <CardContent className='flex items-center justify-between px-4 py-4 sm:px-5'>
            <div>
              <Label className='text-[12px] text-[#6b7785]'>현재 상태</Label>
              <p className='text-[14px] font-semibold text-[#1b1b1b]'>
                {status === 'pending'
                  ? '접수 대기'
                  : status === 'accepted'
                    ? '준비 중'
                    : status === 'delivering'
                      ? '배달 중'
                      : '완료'}
              </p>
            </div>
            {(() => {
              const raw = order?.status as string | undefined;
              const canCancel = [
                OrderResponseStatus.CREATED,
                OrderResponseStatus.PENDING,
                OrderResponseStatus.PAYMENT_FAILED,
              ].includes((raw as any) ?? '');
              return canCancel;
            })() ? (
              <Button
                variant='outline'
                className='h-9 rounded-full border-[#fbbf24] px-3 text-[12px] font-semibold text-[#92400e] hover:bg-[#fff7ed]'
                onClick={() => setOpenCancel(true)}
                disabled={cancelMutation.isPending}
                aria-busy={cancelMutation.isPending}>
                {cancelMutation.isPending ? '취소 중…' : '주문 취소'}
              </Button>
            ) : null}
          </CardContent>
        </Card>

        {/* 상점/메뉴 */}
        <Card className='border-none bg-white shadow-sm'>
          <CardContent className='space-y-2 px-4 py-4 sm:px-5'>
            <p className='text-[13px] font-semibold text-[#1b1b1b]'>{storeName}</p>
            <ul className='list-disc space-y-1 pl-4 text-[12px] text-[#6b7785]'>
              {menus.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* 배송지/정보 */}
        <Card className='border-none bg-white shadow-sm'>
          <CardContent className='space-y-2 px-4 py-4 text-[12px] text-[#1b1b1b] sm:px-5'>
            <div className='flex items-center justify-between'>
              <span className='text-[#6b7785]'>배달 주소</span>
              <span>{address}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-[#6b7785]'>주문 일시</span>
              <span>{createdAtText}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-[#6b7785]'>주문 번호</span>
              <span>{orderNumber}</span>
            </div>
          </CardContent>
        </Card>

        {/* 금액 요약 */}
        <Card className='border-none bg-white shadow-sm'>
          <CardContent className='space-y-2 px-4 py-4 text-[13px] text-[#1b1b1b] sm:px-5'>
            <div className='flex items-center justify-between'>
              <span>주문금액</span>
              <span>₩ {orderAmount.toLocaleString()}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span>배달비</span>
              <span>₩ {deliveryFee.toLocaleString()}</span>
            </div>
            <div className='flex items-center justify-between font-bold'>
              <span>총 결제금액</span>
              <span>₩ {totalAmount.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <div className='h-[calc(68px+env(safe-area-inset-bottom))]' />
      </main>

      <AlertDialog open={openCancel} onOpenChange={setOpenCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>주문을 취소하시겠습니까?</AlertDialogTitle>
          </AlertDialogHeader>
          <form
            onSubmit={handleSubmit(({ cancelReason }) => {
              if (!Number.isFinite(numericOrderId)) return;
              cancelMutation.mutate({ orderId: numericOrderId, data: { cancelReason } } as any);
            })}>
            <div className='space-y-2 px-1 pb-2 pt-1'>
              <Label className='text-[12px] text-[#6b7785]'>취소 사유</Label>
              <Input
                placeholder='취소 사유를 입력해 주세요 (최대 200자)'
                className='h-9 text-[13px]'
                maxLength={200}
                {...register('cancelReason', { required: true })}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel type='button'>닫기</AlertDialogCancel>
              <AlertDialogAction type='submit' className='bg-[#f43f5e] hover:bg-[#e11d48]'>
                취소하기
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
