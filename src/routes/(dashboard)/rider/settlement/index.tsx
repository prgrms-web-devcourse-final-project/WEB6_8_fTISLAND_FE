import * as React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { RiderPageLayout } from '../RiderPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from 'lucide-react';
import {
  useGetSummary,
  useGetDaySettlements1,
  useGetWeekSettlements1,
  useGetMonthSettlements1,
  useGetPeriodSettlements1,
} from '@/api/generated';
import type { GetPeriodSettlements1Params } from '@/api/generated/model/getPeriodSettlements1Params';

export const Route = createFileRoute('/(dashboard)/rider/settlement/')({
  component: RouteComponent,
});

type Period = 'daily' | 'weekly' | 'monthly';

function RouteComponent() {
  const [period, setPeriod] = React.useState<Period>('daily');

  const summaryQuery = useGetSummary({ query: { staleTime: 10_000, refetchOnWindowFocus: false } } as any);
  const summary = ((summaryQuery.data as any)?.data?.content ?? undefined) as
    | {
        totalTransactionCount?: number;
        weeklyTransactionCount?: number;
        weeklySettledAmount?: number;
        monthlySettledAmount?: number;
        totalSettledAmount?: number;
        scheduledSettleAmount?: number;
      }
    | undefined;

  const completedTotal = Number(summary?.totalTransactionCount ?? 0);
  const weeklyIncome = Number(summary?.weeklySettledAmount ?? 0);
  const monthlyIncome = Number(summary?.monthlySettledAmount ?? 0);
  const pendingAmount = Number(summary?.scheduledSettleAmount ?? 0);
  const allCompletedSettlement = Number(summary?.totalSettledAmount ?? 0);

  // 정산 내역 - 각 탭 활성 시에만 호출
  const dayQuery = useGetDaySettlements1({
    query: { enabled: period === 'daily', refetchOnWindowFocus: false },
  } as any);
  const weekQuery = useGetWeekSettlements1({
    query: { enabled: period === 'weekly', refetchOnWindowFocus: false },
  } as any);
  const monthQuery = useGetMonthSettlements1({
    query: { enabled: period === 'monthly', refetchOnWindowFocus: false },
  } as any);

  const dayItems = ((dayQuery.data as any)?.data?.content?.content ?? []) as any[];
  const weekItems = ((weekQuery.data as any)?.data?.content?.content ?? []) as any[];
  const monthItems = ((monthQuery.data as any)?.data?.content?.content ?? []) as any[];

  // 기간 조회 상태
  const [startDate, setStartDate] = React.useState<string>('');
  const [endDate, setEndDate] = React.useState<string>('');
  const [periodDialogOpen, setPeriodDialogOpen] = React.useState(false);
  const [tempStart, setTempStart] = React.useState<string>('');
  const [tempEnd, setTempEnd] = React.useState<string>('');
  const periodQuery = useGetPeriodSettlements1(
    { startDate, endDate } as GetPeriodSettlements1Params,
    {
      query: { enabled: Boolean(startDate && endDate), refetchOnWindowFocus: false },
    } as any
  );
  const periodItems = ((periodQuery.data as any)?.data?.content?.content ?? []) as any[];

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
        <Dialog open={periodDialogOpen} onOpenChange={setPeriodDialogOpen}>
          <DialogContent className='max-w-sm rounded-3xl border-none bg-white p-6 shadow-[0_28px_72px_-28px_rgba(15,23,42,0.45)]'>
            <DialogHeader>
              <DialogTitle className='text-[16px] font-semibold text-[#1b1b1b]'>정산 기간 설정</DialogTitle>
            </DialogHeader>
            <div className='space-y-3'>
              <div className='grid grid-cols-2 gap-2'>
                <div className='space-y-1'>
                  <p className='text-[12px] font-semibold text-[#6b7785]'>시작일</p>
                  <Input
                    type='date'
                    value={tempStart}
                    onChange={(e) => setTempStart(e.target.value)}
                    className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
                  />
                </div>
                <div className='space-y-1'>
                  <p className='text-[12px] font-semibold text-[#6b7785]'>종료일</p>
                  <Input
                    type='date'
                    value={tempEnd}
                    onChange={(e) => setTempEnd(e.target.value)}
                    className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
                  />
                </div>
              </div>
              <p className='text-[11px] text-[#6b7785]'>기간 탭에서 조회 결과가 표시됩니다.</p>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setPeriodDialogOpen(false)} className='h-9 rounded-full'>
                취소
              </Button>
              <Button
                className='h-9 rounded-full bg-[#1ba7a1] text-white'
                onClick={() => {
                  setStartDate(tempStart);
                  setEndDate(tempEnd);
                  setPeriodDialogOpen(false);
                }}>
                적용
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 필터 + 리스트 */}
        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>정산 내역</CardTitle>
              <Button
                variant='outline'
                size='sm'
                className='h-8 rounded-full border-[#cbd8e2] px-3 text-[12px] font-semibold text-[#1b1b1b]'
                onClick={() => {
                  setTempStart(startDate);
                  setTempEnd(endDate);
                  setPeriodDialogOpen(true);
                }}>
                <Calendar className='mr-1 size-3.5' /> 기간 설정
              </Button>
            </div>
          </CardHeader>
          <CardContent className='space-y-3 px-4 pb-4'>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className='w-full'>
              <TabsList className='grid w-full grid-cols-4 rounded-2xl bg-[#f5f7f9] p-1'>
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
                <TabsTrigger
                  value='period'
                  className='rounded-xl text-[12px] data-[state=active]:bg-white data-[state=active]:shadow'>
                  기간
                </TabsTrigger>
              </TabsList>
              <TabsContent value='daily' className='mt-3 space-y-2'>
                <div className='max-h-[calc(100dvh-380px)] space-y-2 overflow-y-auto sm:max-h-[calc(100dvh-400px)]'>
                  {dayQuery.isLoading
                    ? Array.from({ length: 3 }).map((_, i) => <div key={i} className='h-14 rounded-2xl bg-[#eef2f7]' />)
                    : dayItems.map((it: any) => {
                        const title = it?.title ?? it?.label ?? '정산';
                        const date = it?.date ?? it?.settlementDate ?? '';
                        const amount = Number(it?.amount ?? it?.settledAmount ?? 0);
                        return (
                          <div
                            key={String(it?.id ?? title + date)}
                            className='flex items-center justify-between rounded-2xl border border-[#e5e7eb] bg-white px-3 py-2'>
                            <div>
                              <p className='text-[12px] font-semibold text-[#1b1b1b]'>{title}</p>
                              <p className='text-[11px] text-[#6b7785]'>{date}</p>
                            </div>
                            <p className='text-[13px] font-extrabold text-[#1b1b1b]'>₩ {amount.toLocaleString()}</p>
                          </div>
                        );
                      })}
                </div>
              </TabsContent>
              <TabsContent value='weekly' className='mt-3 space-y-2'>
                <div className='max-h-[calc(100dvh-380px)] space-y-2 overflow-y-auto sm:max-h-[calc(100dvh-400px)]'>
                  {weekQuery.isLoading
                    ? Array.from({ length: 3 }).map((_, i) => <div key={i} className='h-14 rounded-2xl bg-[#eef2f7]' />)
                    : weekItems.map((it: any) => {
                        const title = it?.title ?? it?.label ?? '정산';
                        const date = it?.date ?? it?.week ?? '';
                        const amount = Number(it?.amount ?? it?.settledAmount ?? 0);
                        return (
                          <div
                            key={String(it?.id ?? title + date)}
                            className='flex items-center justify-between rounded-2xl border border-[#e5e7eb] bg-white px-3 py-2'>
                            <div>
                              <p className='text-[12px] font-semibold text-[#1b1b1b]'>{title}</p>
                              <p className='text-[11px] text-[#6b7785]'>{date}</p>
                            </div>
                            <p className='text-[13px] font-extrabold text-[#1b1b1b]'>₩ {amount.toLocaleString()}</p>
                          </div>
                        );
                      })}
                </div>
              </TabsContent>
              <TabsContent value='monthly' className='mt-3 space-y-2'>
                <div className='max-h-[calc(100dvh-380px)] space-y-2 overflow-y-auto sm:max-h-[calc(100dvh-400px)]'>
                  {monthQuery.isLoading
                    ? Array.from({ length: 3 }).map((_, i) => <div key={i} className='h-14 rounded-2xl bg-[#eef2f7]' />)
                    : monthItems.map((it: any) => {
                        const title = it?.title ?? it?.label ?? '정산';
                        const date = it?.date ?? it?.month ?? '';
                        const amount = Number(it?.amount ?? it?.settledAmount ?? 0);
                        return (
                          <div
                            key={String(it?.id ?? title + date)}
                            className='flex items-center justify-between rounded-2xl border border-[#e5e7eb] bg-white px-3 py-2'>
                            <div>
                              <p className='text-[12px] font-semibold text-[#1b1b1b]'>{title}</p>
                              <p className='text-[11px] text-[#6b7785]'>{date}</p>
                            </div>
                            <p className='text-[13px] font-extrabold text-[#1b1b1b]'>₩ {amount.toLocaleString()}</p>
                          </div>
                        );
                      })}
                </div>
              </TabsContent>
              <TabsContent value='period' className='mt-3 space-y-2'>
                <div className='max-h-[calc(100dvh-380px)] space-y-2 overflow-y-auto sm:max-h-[calc(100dvh-400px)]'>
                  {!(startDate && endDate) ? (
                    <div className='rounded-2xl border border-dashed border-[#dbe4ec] bg-white px-3 py-6 text-center text-[12px] text-[#6b7785]'>
                      조회할 기간을 상단에서 선택해 주세요.
                    </div>
                  ) : periodQuery.isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <div key={i} className='h-14 rounded-2xl bg-[#eef2f7]' />)
                  ) : (
                    periodItems.map((it: any) => {
                      const title = it?.title ?? it?.label ?? '정산';
                      const date = it?.date ?? it?.settlementDate ?? '';
                      const amount = Number(it?.amount ?? it?.settledAmount ?? 0);
                      return (
                        <div
                          key={String(it?.id ?? title + date)}
                          className='flex items-center justify-between rounded-2xl border border-[#e5e7eb] bg-white px-3 py-2'>
                          <div>
                            <p className='text-[12px] font-semibold text-[#1b1b1b]'>{title}</p>
                            <p className='text-[11px] text-[#6b7785]'>{date}</p>
                          </div>
                          <p className='text-[13px] font-extrabold text-[#1b1b1b]'>₩ {amount.toLocaleString()}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </RiderPageLayout>
  );
}
