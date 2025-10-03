import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createFileRoute } from '@tanstack/react-router';
import { MapPin, Truck } from 'lucide-react';
import { SellerHeader } from './_components/SellerHeader';
import { Switch } from '@/components/ui/switch';
import { SellerFooterNav } from './_components/SellerFooterNav';

export const Route = createFileRoute('/(dashboard)/seller/')({
  component: RouteComponent,
});

const PENDING_ORDERS = [
  {
    id: 'ORD-2031',
    menu: '동네 반찬 세트',
    quantity: 2,
    request: '국은 조금 적게 담아주세요.',
    address: '성북구 보문로 34길 12 (302호)',
    payment: '카드 결제 (사전 승인)',
    amount: 18500,
  },
  {
    id: 'ORD-2030',
    menu: '네모네모 카스테라',
    quantity: 1,
    request: '생일 초 2개 함께 주세요.',
    address: '동대문구 제기동 112-3',
    payment: '현장 결제 (현금)',
    amount: 9800,
  },
  {
    id: 'ORD-2029',
    menu: '골목 야식 한상',
    quantity: 3,
    request: '',
    address: '종로구 숭인동 45-9',
    payment: '카드 결제 (사전 승인)',
    amount: 31200,
  },
];

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

const SELLER_PROFILE = {
  nickname: '김사장',
  storeName: '우리동네 뭐든상회',
  address: '서울 성북구 동소문로 25길 12',
  profileImageUrl: '',
};

function RouteComponent() {
  const [orderTab, setOrderTab] = React.useState<OrderTabKey>('accept');
  const [isOpen, setIsOpen] = React.useState(true);

  const formatAmount = React.useCallback((amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  }, []);

  return (
    <div className='flex min-h-[100dvh] w-full flex-col bg-[#2ac1bc] shadow-[0_32px_80px_-40px_rgba(26,86,75,0.55)]'>
      <SellerHeader
        nickname={SELLER_PROFILE.nickname}
        storeName={SELLER_PROFILE.storeName}
        address={SELLER_PROFILE.address}
        profileImageUrl={SELLER_PROFILE.profileImageUrl}
        onSettingsClick={() => console.log('seller settings open')}
      />

      <main className='flex-1 space-y-5 overflow-y-auto rounded-t-[1.5rem] bg-[#f8f9fa] px-4 pb-28 pt-6 outline outline-[1.5px] outline-[#2ac1bc]/15 sm:space-y-6 sm:rounded-t-[1.75rem] sm:px-6 sm:pb-32 sm:pt-7'>
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
                  onCheckedChange={setIsOpen}
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
          <section aria-label='수락 대기 주문 목록' className='space-y-3'>
            {PENDING_ORDERS.map((order) => (
              <Card key={order.id} className='border-none bg-white shadow-[0_16px_48px_-32px_rgba(15,23,42,0.35)]'>
                <CardContent className='space-y-4 px-4 py-4'>
                  <header className='flex items-center justify-between text-[12px] font-semibold text-[#1f6e6b]'>
                    <span>{order.id}</span>
                    <span className='inline-flex items-center gap-1 rounded-full bg-[#2ac1bc]/10 px-2 py-0.5 text-[#1f6e6b]'>
                      <Truck className='size-3.5' aria-hidden />
                      즉시 배달 가능
                    </span>
                  </header>
                  <div className='space-y-2 text-[#1b1b1b]'>
                    <p className='text-[14px] font-semibold sm:text-[15px]'>
                      {order.menu}
                      <span className='pl-1 text-[12px] text-[#6b7785]'>×{order.quantity}</span>
                    </p>
                    {order.request ? (
                      <p className='rounded-xl bg-[#f5f7f9] px-3 py-2 text-[12px] text-[#475569]'>{order.request}</p>
                    ) : null}
                    <div className='flex items-center gap-2 text-[12px] text-[#475569] sm:text-[13px]'>
                      <MapPin className='mt-0.5 size-4 text-[#2ac1bc]' aria-hidden />
                      {order.address}
                    </div>
                    <div className='flex flex-wrap items-center gap-2 text-[12px] text-[#1f6e6b] sm:text-[13px]'>
                      <span className='rounded-full bg-[#2ac1bc]/10 px-3 py-1 font-semibold'>{order.payment}</span>
                      <span className='rounded-full bg-[#ffe14a]/20 px-3 py-1 font-semibold text-[#ad7b00]'>
                        ₩ {formatAmount(order.amount)}
                      </span>
                    </div>
                  </div>
                  <footer className='flex flex-col gap-2 text-[12px] sm:flex-row sm:justify-end'>
                    <Button
                      type='button'
                      variant='outline'
                      className='h-10 rounded-full border-[#f87171] px-4 font-semibold text-[#f87171] hover:bg-[#f87171]/10'>
                      주문 거절
                    </Button>
                    <Button
                      type='button'
                      className='h-10 rounded-full bg-[#1ba7a1] px-4 font-semibold text-white hover:bg-[#17928d]'>
                      주문 수락
                    </Button>
                  </footer>
                </CardContent>
              </Card>
            ))}
          </section>
        ) : (
          <section aria-label='진행 중인 주문 목록' className='space-y-3'>
            {ACTIVE_ORDERS.map((order) => (
              <Card key={order.id} className='border-none bg-white shadow-[0_16px_48px_-32px_rgba(15,23,42,0.35)]'>
                <CardContent className='space-y-4 px-4 py-4'>
                  <header className='flex items-center justify-between text-[12px] font-semibold text-[#1f6e6b]'>
                    <span>{order.id}</span>
                    <StatusBadge status={order.status} />
                  </header>
                  <div className='space-y-1 text-[#1b1b1b]'>
                    <p className='text-[14px] font-semibold sm:text-[15px]'>
                      {order.menu}
                      <span className='pl-1 text-[12px] text-[#6b7785]'>×{order.quantity}</span>
                    </p>
                    {order.request ? (
                      <p className='rounded-xl bg-[#f5f7f9] px-3 py-2 text-[12px] text-[#475569]'>{order.request}</p>
                    ) : null}
                    <div className='flex items-start gap-2 text-[12px] text-[#475569] sm:text-[13px]'>
                      <MapPin className='mt-0.5 size-4 text-[#2ac1bc]' aria-hidden />
                      {order.address}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
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
