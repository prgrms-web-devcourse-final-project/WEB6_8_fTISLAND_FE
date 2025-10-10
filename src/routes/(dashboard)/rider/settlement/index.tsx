import * as React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { RiderPageLayout } from '../RiderPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const Route = createFileRoute('/(dashboard)/rider/settlement/')({
  component: RouteComponent,
});

type Period = 'daily' | 'weekly' | 'monthly';

type SettlementItem = {
  id: string;
  title: string; // 정산 내역 설명
  amount: number; // 정산 금액
  date: string; // YYYY-MM-DD
};

function RouteComponent() {
  const [period, setPeriod] = React.useState<Period>('daily');

  const allItems: Record<Period, SettlementItem[]> = {
    daily: [
      { id: 'd1', title: '2025-10-04 정산', amount: 18400, date: '2025-10-04' },
      { id: 'd2', title: '2025-10-03 정산', amount: 32400, date: '2025-10-03' },
      { id: 'd3', title: '2025-10-02 정산', amount: 21200, date: '2025-10-02' },
    ],
    weekly: [
      { id: 'w1', title: '2025-09 5주차 정산', amount: 142000, date: '2025-09-29' },
      { id: 'w2', title: '2025-09 4주차 정산', amount: 158400, date: '2025-09-22' },
    ],
    monthly: [
      { id: 'm1', title: '2025-09 월 정산', amount: 612000, date: '2025-09-30' },
      { id: 'm2', title: '2025-08 월 정산', amount: 584000, date: '2025-08-31' },
    ],
  };

  const completedTotal = 482; // 누적 배달 건수
  const weeklyIncome = 142000; // 이번 주 수익
  const monthlyIncome = 612000; // 이번 달 수익
  const pendingAmount = 38000; // 정산 대기 금액
  const allCompletedSettlement = 3456000; // 전체 기간 정산 완료 금액

  return (
    <RiderPageLayout>
      <div className='space-y-4'>
        {/* 요약 섹션 */}
        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>정산 요약</CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-2 gap-2 px-4 pb-4 sm:grid-cols-4'>
            <div className='rounded-2xl border border-[#dbe4ec] bg-white p-3 text-center'>
              <p className='text-[11px] text-[#6b7785]'>누적 배달</p>
              <p className='text-[16px] font-extrabold text-[#1b1b1b]'>{completedTotal}건</p>
            </div>
            <div className='rounded-2xl border border-[#dbe4ec] bg-white p-3 text-center'>
              <p className='text-[11px] text-[#6b7785]'>이번 주 수익</p>
              <p className='text-[16px] font-extrabold text-[#1b1b1b]'>₩ {weeklyIncome.toLocaleString()}</p>
            </div>
            <div className='rounded-2xl border border-[#dbe4ec] bg-white p-3 text-center'>
              <p className='text-[11px] text-[#6b7785]'>이번 달 수익</p>
              <p className='text-[16px] font-extrabold text-[#1b1b1b]'>₩ {monthlyIncome.toLocaleString()}</p>
            </div>
            <div className='rounded-2xl border border-[#dbe4ec] bg-white p-3 text-center'>
              <p className='text-[11px] text-[#6b7785]'>정산 대기</p>
              <p className='text-[16px] font-extrabold text-[#1b1b1b]'>₩ {pendingAmount.toLocaleString()}</p>
            </div>
            <div className='col-span-2 rounded-2xl border border-[#dbe4ec] bg-white p-3 text-center sm:col-span-4'>
              <p className='text-[11px] text-[#6b7785]'>전체 정산 완료</p>
              <p className='text-[16px] font-extrabold text-[#1b1b1b]'>₩ {allCompletedSettlement.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* 필터 + 리스트 */}
        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>정산 내역</CardTitle>
            </div>
          </CardHeader>
          <CardContent className='space-y-3 px-4 pb-4'>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className='w-full'>
              <TabsList className='grid w-full grid-cols-3 rounded-2xl bg-[#f5f7f9] p-1'>
                <TabsTrigger
                  value='daily'
                  className='rounded-xl text-[12px] data-[state=active]:bg-white data-[state=active]:shadow'>
                  일간
                </TabsTrigger>
                <TabsTrigger
                  value='weekly'
                  className='rounded-xl text-[12px] data-[state=active]:bg-white data-[state=active]:shadow'>
                  주간
                </TabsTrigger>
                <TabsTrigger
                  value='monthly'
                  className='rounded-xl text-[12px] data-[state=active]:bg-white data-[state=active]:shadow'>
                  월간
                </TabsTrigger>
              </TabsList>
              <TabsContent value='daily' className='mt-3 space-y-2'>
                <div className='max-h-[calc(100dvh-380px)] space-y-2 overflow-y-auto sm:max-h-[calc(100dvh-400px)]'>
                  {allItems.daily.map((item) => (
                    <div
                      key={item.id}
                      className='flex items-center justify-between rounded-2xl border border-[#e5e7eb] bg-white px-3 py-2'>
                      <div>
                        <p className='text-[12px] font-semibold text-[#1b1b1b]'>{item.title}</p>
                        <p className='text-[11px] text-[#6b7785]'>{item.date}</p>
                      </div>
                      <p className='text-[13px] font-extrabold text-[#1b1b1b]'>₩ {item.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value='weekly' className='mt-3 space-y-2'>
                <div className='max-h-[calc(100dvh-380px)] space-y-2 overflow-y-auto sm:max-h-[calc(100dvh-400px)]'>
                  {allItems.weekly.map((item) => (
                    <div
                      key={item.id}
                      className='flex items-center justify-between rounded-2xl border border-[#e5e7eb] bg-white px-3 py-2'>
                      <div>
                        <p className='text-[12px] font-semibold text-[#1b1b1b]'>{item.title}</p>
                        <p className='text-[11px] text-[#6b7785]'>{item.date}</p>
                      </div>
                      <p className='text-[13px] font-extrabold text-[#1b1b1b]'>₩ {item.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value='monthly' className='mt-3 space-y-2'>
                <div className='max-h-[calc(100dvh-380px)] space-y-2 overflow-y-auto sm:max-h-[calc(100dvh-400px)]'>
                  {allItems.monthly.map((item) => (
                    <div
                      key={item.id}
                      className='flex items-center justify-between rounded-2xl border border-[#e5e7eb] bg-white px-3 py-2'>
                      <div>
                        <p className='text-[12px] font-semibold text-[#1b1b1b]'>{item.title}</p>
                        <p className='text-[11px] text-[#6b7785]'>{item.date}</p>
                      </div>
                      <p className='text-[13px] font-extrabold text-[#1b1b1b]'>₩ {item.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </RiderPageLayout>
  );
}
