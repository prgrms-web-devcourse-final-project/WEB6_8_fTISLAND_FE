import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { SettlementPeriod, SettlementSummary } from '../manage/_data/settlements';

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

  const filtered = React.useMemo(() => summaries.filter((summary) => summary.period === period), [summaries, period]);

  return (
    <section className='space-y-4'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <h2 className='text-[15px] font-semibold text-[#1b1b1b]'>정산 관리</h2>
          <p className='text-[12px] text-[#6b7785]'>기간을 선택해 정산 내역을 확인하세요.</p>
        </div>
        <div className='inline-flex items-center gap-1 rounded-full bg-[#e9f6f5] p-1 text-[12px] font-semibold text-[#1b1b1b]'>
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
        {filtered.length === 0 ? (
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
