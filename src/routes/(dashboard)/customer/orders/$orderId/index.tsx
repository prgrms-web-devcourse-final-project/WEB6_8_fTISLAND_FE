import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { CustomerFooterNav } from '../../_components/CustomerFooterNav';
import { Heart, Home, ListFilter, Search, User } from 'lucide-react';
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
  const navigate = useNavigate();
  const { orderId } = Route.useParams();
  const { status: statusFromSearch } = Route.useSearch();
  const [status, setStatus] = React.useState<'pending' | 'accepted' | 'delivering' | 'completed'>(
    (statusFromSearch as any) === 'completed' ? 'completed' : 'pending'
  );
  const [riderAssigned, setRiderAssigned] = React.useState(false);
  const [openCancel, setOpenCancel] = React.useState(false);

  const storeName = '골목 마트';
  const menus = ['상품 1', '상품 2'];
  const orderAmount = 18900;
  const deliveryFee = 3000;
  const totalAmount = orderAmount + deliveryFee;

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
            {status === 'pending' ? (
              <Button
                variant='outline'
                className='h-9 rounded-full border-[#fbbf24] px-3 text-[12px] font-semibold text-[#92400e] hover:bg-[#fff7ed]'
                onClick={() => setOpenCancel(true)}>
                주문 취소
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
              <span>서울시 성북구 돌곶이로 27 101호</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-[#6b7785]'>주문 일시</span>
              <span>2025-10-04 18:12</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-[#6b7785]'>주문 번호</span>
              <span>{orderId.toUpperCase()}</span>
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

      <AlertDialog open={openCancel} onOpenChange={setOpenCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>주문을 취소하시겠습니까?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setStatus('completed');
                setOpenCancel(false);
              }}
              className='bg-[#f43f5e] hover:bg-[#e11d48]'>
              취소하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
