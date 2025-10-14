import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { usePay } from '@/api/generated';
import { toast } from 'sonner';

export const Route = createFileRoute('/payment/success')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      orderId: (search.orderId as string) || (search.merchantUid as string) || (search.orig as string) || '',
      paymentKey: (search.paymentKey as string) || '',
      amount: (search.amount as string) || '',
    } as { orderId: string; paymentKey: string; amount: string };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { orderId, paymentKey, amount } = Route.useSearch();
  const payMutation = usePay({
    mutation: {
      onSuccess: (res: any) => {
        const content = (res as any)?.data?.content ?? (res as any)?.content;
        const id = content?.id ?? content?.orderId ?? orderId;
        toast.success('결제가 완료되었습니다.');
        navigate({
          to: '/customer/orders/$orderId',
          params: { orderId: String(id ?? orderId) },
          search: { status: 'pending' },
        });
      },
      onError: () => {
        toast.error('결제 확정에 실패했습니다.');
      },
    },
  } as any);

  React.useEffect(() => {
    if (!orderId || !paymentKey) return;
    // 결제 확정 시 서버 스펙에 맞게 필요한 필드(금액 등)를 같이 전달
    payMutation.mutate({ merchantUid: orderId, data: { paymentKey, amount: Number(amount) || undefined } } as any);
  }, [orderId, paymentKey, amount]);

  return (
    <div className='flex min-h-[100dvh] w-full flex-col items-center justify-center bg-[#f8f9fa] px-4'>
      <div className='text-[14px] font-semibold text-[#1b1b1b]'>결제 처리 중입니다...</div>
      <div className='mt-2 text-[12px] text-[#6b7785]'>잠시만 기다려 주세요.</div>
    </div>
  );
}
