import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/payment/fail')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      code: (search.code as string) || '',
      message: (search.message as string) || '결제가 취소되었거나 실패했습니다.',
      orderId: (search.orderId as string) || (search.merchantUid as string) || '',
    } as { code: string; message: string; orderId?: string };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { message, orderId } = Route.useSearch();

  return (
    <div className='flex min-h-[100dvh] w-full flex-col items-center justify-center bg-[#f8f9fa] px-4'>
      <div className='text-[14px] font-semibold text-[#1b1b1b]'>결제가 완료되지 않았습니다</div>
      <div className='mt-2 max-w-[24rem] text-center text-[12px] text-[#6b7785]'>{message}</div>
      <div className='mt-4 flex gap-2'>
        {orderId ? (
          <Button
            className='h-10 rounded-full bg-[#2ac1bc] px-4 text-[13px] text-white hover:bg-[#21a9a4]'
            onClick={() =>
              navigate({ to: '/(dashboard)/customer/orders/$orderId', params: { orderId: String(orderId) } })
            }>
            주문 상세 보기
          </Button>
        ) : null}
        <Button
          variant='outline'
          className='h-10 rounded-full border-[#dbe4ec] px-4 text-[13px] text-[#1b1b1b]'
          onClick={() => navigate({ to: '/(dashboard)/customer/' })}>
          홈으로 돌아가기
        </Button>
      </div>
    </div>
  );
}
