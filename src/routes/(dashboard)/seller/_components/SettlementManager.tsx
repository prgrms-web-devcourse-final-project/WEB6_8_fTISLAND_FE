import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { SettlementPeriod, SettlementSummary } from '../manage/_data/settlements';
import { useGetDaySettlements, useGetWeekSettlements, useGetMonthSettlements } from '@/api/generated';

interface SettlementManagerProps {
  summaries: SettlementSummary[];
}

const PERIOD_OPTIONS: Array<{ label: string; value: SettlementPeriod }> = [
  { label: '일간', value: 'daily' },
  { label: '주간', value: 'weekly' },
  { label: '월간', value: 'monthly' },
];

export function SettlementManager({ summaries }: SettlementManagerProps) {
  const [period, setPeriod] = React.useState<SettlementPeriod>('daily');
  const storeId = 1; // TODO: URL/전역으로 교체
  const dayQuery = useGetDaySettlements(storeId, {
    query: { enabled: period === 'daily', staleTime: 10_000, refetchOnWindowFocus: false },
  });
  const weekQuery = useGetWeekSettlements(storeId, {
    query: { enabled: period === 'weekly', staleTime: 10_000, refetchOnWindowFocus: false },
  });
  const monthQuery = useGetMonthSettlements(storeId, {
    query: { enabled: period === 'monthly', staleTime: 10_000, refetchOnWindowFocus: false },
  });
  const dayItems = React.useMemo(() => {
    const list = ((dayQuery.data as any)?.data?.content ?? []) as Array<{
      startDate?: string;
      settledAmount?: number;
    }>;
    const fmt = (d?: string) => {
      if (!d) return '';
      try {
        const [y, m, dd] = d.split('-');
        return `${y}년-${m}월-${dd}일 정산 내역`;
      } catch {
        return `${d} 정산 내역`;
      }
    };
    return list.map((it) => ({
      id: it.startDate ?? '',
      title: fmt(it.startDate),
      settledAt: it.startDate ?? '',
      amount: Number(it.settledAmount ?? 0),
    }));
  }, [dayQuery.data]);

  const weekItems = React.useMemo(() => {
    const list = ((weekQuery.data as any)?.data?.content ?? []) as Array<{
      startDate?: string;
      settledAmount?: number;
    }>;
    const fmtRange = (d?: string) => {
      if (!d) return '';
      try {
        const base = new Date(d + 'T00:00:00');
        const end = new Date(base);
        end.setDate(base.getDate() + 6);
        const y = base.getFullYear();
        const m = String(base.getMonth() + 1).padStart(2, '0');
        const dd = String(base.getDate()).padStart(2, '0');
        const y2 = end.getFullYear();
        const m2 = String(end.getMonth() + 1).padStart(2, '0');
        const d2 = String(end.getDate()).padStart(2, '0');
        return `${y}년-${m}월-${dd}일 ~ ${y2}년-${m2}월-${d2}일 정산 내역`;
      } catch {
        return `${d} ~ (+6일) 정산 내역`;
      }
    };
    return list.map((it) => ({
      id: it.startDate ?? '',
      title: fmtRange(it.startDate),
      settledAt: it.startDate ?? '',
      amount: Number(it.settledAmount ?? 0),
    }));
  }, [weekQuery.data]);

  const monthItems = React.useMemo(() => {
    const list = ((monthQuery.data as any)?.data?.content ?? []) as Array<{
      startDate?: string;
      settledAmount?: number;
    }>;
    const fmtMonth = (d?: string) => {
      if (!d) return '';
      try {
        const parts = d.split('-');
        const mm = parts[1];
        return `${mm}월 월간 정산 내역`;
      } catch {
        return `${d} 월간 정산 내역`;
      }
    };
    return list.map((it) => ({
      id: it.startDate ?? '',
      title: fmtMonth(it.startDate),
      settledAt: it.startDate ?? '',
      amount: Number(it.settledAmount ?? 0),
    }));
  }, [monthQuery.data]);

  const filtered = React.useMemo(() => summaries.filter((summary) => summary.period === period), [summaries, period]);

  return (
    <section className='space-y-4'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <h2 className='text-[15px] font-semibold text-[#1b1b1b]'>정산 관리</h2>
          <p className='text-[12px] text-[#6b7785]'>기간을 선택해 정산 내역을 확인하세요.</p>
        </div>
        <div className='inline-flex items-center gap-1 rounded-full bg-[#e9f6f5] p-1 text-[11px] font-semibold text-[#1b1b1b]'>
          {PERIOD_OPTIONS.map(({ label, value }) => {
            const isActive = period === value;
            return (
              <button
                key={value}
                type='button'
                onClick={() => setPeriod(value)}
                className={
                  isActive
                    ? 'rounded-full bg-white px-3 py-1.5 text-[#1b1b1b] shadow-sm'
                    : 'rounded-full px-3 py-1.5 text-[#6b7785] transition-colors hover:text-[#1b1b1b]'
                }>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className='space-y-3'>
        {period === 'daily' ? (
          dayItems.length === 0 ? (
            <Card className='border-dashed border-[#cbd8e2] bg-[#f5f7f9] text-center text-[13px] text-[#6b7785]'>
              <CardContent className='py-10'>선택한 기간의 정산 내역이 없습니다.</CardContent>
            </Card>
          ) : (
            dayItems.map((summary) => <SettlementRow key={summary.id} summary={summary as any} />)
          )
        ) : period === 'weekly' ? (
          weekItems.length === 0 ? (
            <Card className='border-dashed border-[#cbd8e2] bg-[#f5f7f9] text-center text-[13px] text-[#6b7785]'>
              <CardContent className='py-10'>선택한 기간의 정산 내역이 없습니다.</CardContent>
            </Card>
          ) : (
            weekItems.map((summary) => <SettlementRow key={summary.id} summary={summary as any} />)
          )
        ) : period === 'monthly' ? (
          monthItems.length === 0 ? (
            <Card className='border-dashed border-[#cbd8e2] bg-[#f5f7f9] text-center text-[13px] text-[#6b7785]'>
              <CardContent className='py-10'>선택한 기간의 정산 내역이 없습니다.</CardContent>
            </Card>
          ) : (
            monthItems.map((summary) => <SettlementRow key={summary.id} summary={summary as any} />)
          )
        ) : filtered.length === 0 ? (
          <Card className='border-dashed border-[#cbd8e2] bg-[#f5f7f9] text-center text-[13px] text-[#6b7785]'>
            <CardContent className='py-10'>선택한 기간의 정산 내역이 없습니다.</CardContent>
          </Card>
        ) : (
          filtered.map((summary) => <SettlementRow key={summary.id} summary={summary} />)
        )}
      </div>
    </section>
  );
}

function SettlementRow({ summary }: { summary: SettlementSummary }) {
  return (
    <Card className='border-none bg-white shadow-[0_18px_52px_-30px_rgba(15,23,42,0.3)] hover:shadow-[0_22px_60px_-28px_rgba(15,23,42,0.45)]'>
      <CardContent className='flex items-center justify-between gap-3 px-4 py-4'>
        <div>
          <p className='text-[13px] font-semibold text-[#1b1b1b]'>{summary.title}</p>
          <p className='text-[11px] text-[#6b7785]'>{summary.settledAt}</p>
        </div>
        <div className='flex items-center gap-3'>
          <span className='text-[14px] font-semibold text-[#1f6e6b]'>₩ {summary.amount.toLocaleString()}</span>
          <Button
            asChild
            variant='ghost'
            size='icon'
            className='size-9 rounded-full border border-[#cbd8e2] text-[#1b1b1b] hover:bg-[#f8fafc]'>
            <Link
              to='/seller/manage/$settlementId/detail'
              params={{ settlementId: summary.id }}
              search={{ tab: 'settlement' }}>
              <ChevronRight className='size-4' aria-hidden />
              <span className='sr-only'>정산 내역 상세로 이동</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
