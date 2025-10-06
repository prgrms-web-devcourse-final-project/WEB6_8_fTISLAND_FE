import * as React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { RiderPageLayout } from '../../RiderPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/(dashboard)/rider/orders/$orderId/detail')({
  component: RouteComponent,
});

function RouteComponent() {
  const { orderId } = Route.useParams();

  // 스태틱 예시 데이터
  const order = {
    store: '골목 마트',
    orderedAt: '2025-10-04 18:12',
    eta: '2025-10-04 18:40',
    status: 'IN_PROGRESS',
    items: [
      { name: '상품 1', qty: 2, unit: 4500 },
      { name: '상품 2', qty: 1, unit: 9900 },
    ],
    notes: {
      product: '깨지기 쉬움, 세워서 보관',
      customer: '초인종 누르지 말고 전화 주세요',
    },
    fees: {
      delivery: 3000,
    },
  };

  const subtotal = order.items.reduce((sum, it) => sum + it.qty * it.unit, 0);
  const total = subtotal + order.fees.delivery;

  return (
    <RiderPageLayout>
      <div className='space-y-4'>
        {/* 헤더 */}
        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>상세 주문 정보 · #{orderId}</CardTitle>
          </CardHeader>
        </Card>

        {/* 주문 요약 */}
        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>주문 요약</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 px-4 pb-4 text-[13px]'>
            <div className='flex items-center justify-between'>
              <span className='text-[#6b7785]'>주문 번호</span>
              <span className='font-extrabold'>#{orderId}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-[#6b7785]'>상점</span>
              <span className='font-semibold'>{order.store}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-[#6b7785]'>주문 시각</span>
              <span className='font-semibold'>{order.orderedAt}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-[#6b7785]'>예상 완료</span>
              <span className='font-semibold'>{order.eta}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-[#6b7785]'>상태</span>
              <span className='rounded-full bg-[#2ac1bc]/10 px-2 py-0.5 text-[12px] font-semibold text-[#1f6e6b]'>
                {order.status}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 상품 리스트 */}
        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>상품</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 px-4 pb-4'>
            <div className='grid grid-cols-4 gap-2 text-[12px] text-[#6b7785]'>
              <div>상품명</div>
              <div className='text-center'>수량</div>
              <div className='text-right'>단가</div>
              <div className='text-right'>소계</div>
            </div>
            {order.items.map((it, idx) => (
              <div key={idx} className='grid grid-cols-4 gap-2 text-[13px]'>
                <div className='truncate'>{it.name}</div>
                <div className='text-center'>{it.qty}</div>
                <div className='text-right'>₩ {it.unit.toLocaleString()}</div>
                <div className='text-right font-semibold'>₩ {(it.qty * it.unit).toLocaleString()}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 특이사항 / 고객요청 */}
        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>요청/특이사항</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 px-4 pb-4 text-[12px]'>
            <div>
              <p className='text-[#6b7785]'>상품 특이사항</p>
              <p className='rounded-2xl bg-[#f5f7f9] p-3 text-[#1b1b1b]'>{order.notes.product}</p>
            </div>
            <div>
              <p className='text-[#6b7785]'>고객 요청사항</p>
              <p className='rounded-2xl bg-[#f5f7f9] p-3 text-[#1b1b1b]'>{order.notes.customer}</p>
            </div>
          </CardContent>
        </Card>

        {/* 결제 요약 */}
        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>결제 요약</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 px-4 pb-4 text-[13px]'>
            <div className='flex items-center justify-between'>
              <span className='text-[#6b7785]'>상품 총액</span>
              <span className='font-semibold'>₩ {subtotal.toLocaleString()}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-[#6b7785]'>배달비</span>
              <span className='font-semibold'>₩ {order.fees.delivery.toLocaleString()}</span>
            </div>
            <div className='flex items-center justify-between border-t border-dashed border-[#e5e7eb] pt-2'>
              <span className='text-[#6b7785]'>최종 결제 금액</span>
              <span className='text-[16px] font-extrabold text-[#1b1b1b]'>₩ {total.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </RiderPageLayout>
  );
}
