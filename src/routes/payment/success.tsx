import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { usePay } from '@/api/generated';
import { toast } from 'sonner';

export const Route = createFileRoute('/payment/success')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      // Toss가 리다이렉트 시 쿼리에 넘긴 원본 식별자 그대로 사용
      merchantUid: (search.merchantUid as string) || (search.orderId as string) || (search.orig as string) || '',
      paymentKey: (search.paymentKey as string) || '',
      amount: (search.amount as string) || '',
    } as { merchantUid: string; paymentKey: string; amount: string };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { merchantUid, paymentKey, amount } = Route.useSearch();
  const payMutation = usePay({
    mutation: {
      onSuccess: (res: any) => {
        const content = (res as any)?.data?.content ?? (res as any)?.content;
        const numericId = Number(content?.id ?? content?.orderId);
        toast.success('결제가 완료되었습니다.');
        if (Number.isFinite(numericId)) {
          navigate({
            to: '/customer/orders/$orderId',
            params: { orderId: String(numericId) },
            search: { status: 'pending' },
          });
        } else {
          // 주문 번호가 없으면 홈으로 안내
          navigate({ to: '/customer' });
        }
      },
      onError: () => {
        toast.error('결제 확정에 실패했습니다.');
      },
    },
  } as any);

  React.useEffect(() => {
    if (!merchantUid || !paymentKey) return;
    // 결제 확정 시 서버 스펙에 맞게 필요한 필드(금액 등)를 같이 전달
    payMutation.mutate({ merchantUid, data: { paymentKey, amount: Number(amount) || undefined } } as any);
  }, [merchantUid, paymentKey, amount]);

  return (
    <div className='flex min-h-[100dvh] w-full flex-col items-center justify-center bg-[#f8f9fa] px-4'>
      <div className='text-[14px] font-semibold text-[#1b1b1b]'>결제 처리 중입니다...</div>
      <div className='mt-2 text-[12px] text-[#6b7785]'>잠시만 기다려 주세요.</div>
    </div>
  );
}
