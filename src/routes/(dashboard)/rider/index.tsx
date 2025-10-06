import { createFileRoute, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { RiderPageLayout } from './RiderPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useForm, Controller } from 'react-hook-form';
import { Clock, Navigation, Timer, CheckCircle2, Wallet } from 'lucide-react';

export const Route = createFileRoute('/(dashboard)/rider/')({
  component: RouteComponent,
});

type SortBy = 'distance' | 'fee' | 'newest';

type Offer = {
  id: string;
  store: string;
  distanceKm: number; // 상점→고객 거리
  fee: number; // 예상 배달료
  etaMinutes: number; // 예상 배달 시간
  createdAt: number; // 정렬용 timestamp
};

interface RiderStatusForm {
  isOnline: boolean;
}

function formatTime(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
}

function RouteComponent() {
  const navigate = useNavigate();
  const { control, watch } = useForm<RiderStatusForm>({ defaultValues: { isOnline: true } });
  const isOnline = watch('isOnline');

  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const [sortBy, setSortBy] = React.useState<SortBy>('distance');

  const [ongoing] = React.useState<null | {
    orderId: string;
    store: string;
    address: string;
    remainingMinutes: number;
  }>({ orderId: 'ORD-1024', store: '골목 마트', address: '서울 성북구 동소문로25길 12 1층', remainingMinutes: 7 });

  const [offers, setOffers] = React.useState<Offer[]>([
    {
      id: 'REQ-1',
      store: '꽃집 토도',
      distanceKm: 1.2,
      fee: 3800,
      etaMinutes: 12,
      createdAt: Date.now() - 1000 * 60 * 2,
    },
    {
      id: 'REQ-2',
      store: '동네 베이커리',
      distanceKm: 0.6,
      fee: 3200,
      etaMinutes: 9,
      createdAt: Date.now() - 1000 * 60 * 5,
    },
    {
      id: 'REQ-3',
      store: '약국 굿헬스',
      distanceKm: 2.0,
      fee: 4200,
      etaMinutes: 16,
      createdAt: Date.now() - 1000 * 60 * 1,
    },
  ]);

  const sortedOffers = React.useMemo(() => {
    const arr = [...offers];
    if (sortBy === 'distance') arr.sort((a, b) => a.distanceKm - b.distanceKm);
    if (sortBy === 'fee') arr.sort((a, b) => b.fee - a.fee);
    if (sortBy === 'newest') arr.sort((a, b) => b.createdAt - a.createdAt);
    return arr;
  }, [offers, sortBy]);

  const acceptOffer = (id: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== id));
  };
  const declineOffer = (id: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== id));
  };

  const todayCompleted = 6;
  const todayEarnings = 28400;
  const avgMinutes = 14;

  return (
    <RiderPageLayout>
      <div className='space-y-4'>
        {/* 상단: 날짜/시간 + 상태 토글 + 오늘 지표 */}
        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>오늘</CardTitle>
              <div className='text-[12px] text-[#6b7785]'>{formatTime(now)}</div>
            </div>
          </CardHeader>
          <CardContent className='space-y-3 px-4 pb-4'>
            <div className='flex items-center justify-between rounded-2xl bg-[#f5f7f9] px-3 py-2.5'>
              <div className='flex items-center gap-2'>
                <span className='text-[12px] font-semibold text-[#1b1b1b]'>라이더 상태</span>
                <span className='text-[12px] text-[#6b7785]'>{isOnline ? '온라인' : '오프라인'}</span>
              </div>
              <div className='flex items-center gap-2'>
                <Label htmlFor='isOnline' className='text-[11px] text-[#6b7785]'>
                  OFF
                </Label>
                <Controller
                  control={control}
                  name='isOnline'
                  render={({ field }) => (
                    <Switch id='isOnline' checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label htmlFor='isOnline' className='text-[11px] text-[#1b1b1b]'>
                  ON
                </Label>
              </div>
            </div>
            <div className='grid grid-cols-3 gap-1'>
              <div className='flex items-center gap-1 rounded-xl border border-[#dbe4ec] bg-white p-2'>
                <span className='flex size-5 items-center justify-center rounded-full bg-[#2ac1bc]/10 text-[#1f6e6b]'>
                  <CheckCircle2 className='size-2.5 text-[#2ac1bc]' aria-hidden />
                </span>
                <div className='leading-tight'>
                  <p className='text-[9px] text-[#6b7785]'>완료</p>
                  <p className='text-[13px] font-extrabold text-[#1b1b1b]'>
                    {todayCompleted}
                    <span className='ml-0.5 align-middle text-[9px] font-semibold text-[#6b7785]'>건</span>
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-1 rounded-xl border border-[#dbe4ec] bg-white p-2'>
                <span className='flex size-5 items-center justify-center rounded-full bg-[#2ac1bc]/10 text-[#1f6e6b]'>
                  <Wallet className='size-2.5 text-[#2ac1bc]' aria-hidden />
                </span>
                <div className='leading-tight'>
                  <p className='text-[9px] text-[#6b7785]'>수익</p>
                  <p className='text-[13px] font-extrabold text-[#1b1b1b]'>₩ {todayEarnings.toLocaleString()}</p>
                </div>
              </div>
              <div className='flex items-center gap-1 rounded-xl border border-[#dbe4ec] bg-white p-2'>
                <span className='flex size-5 items-center justify-center rounded-full bg-[#2ac1bc]/10 text-[#1f6e6b]'>
                  <Timer className='size-2.5 text-[#2ac1bc]' aria-hidden />
                </span>
                <div className='leading-tight'>
                  <p className='text-[9px] text-[#6b7785]'>평균 시간</p>
                  <p className='text-[13px] font-extrabold text-[#1b1b1b]'>
                    {avgMinutes}
                    <span className='ml-0.5 align-middle text-[9px] font-semibold text-[#6b7785]'>분</span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 진행 중 배달 */}
        {ongoing ? (
          <Card
            className='cursor-pointer border-none bg-white shadow-sm'
            onClick={() => navigate({ to: '/rider/orders/$orderId', params: { orderId: ongoing.orderId } })}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>진행 중 배달</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 px-4 pb-4'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <p className='text-[13px] font-semibold text-[#1b1b1b]'>주문번호 {ongoing.orderId}</p>
                  <p className='text-[12px] text-[#6b7785]'>
                    {ongoing.store} · {ongoing.address}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='inline-flex items-center gap-1 rounded-full bg-[#2ac1bc]/10 px-2 py-0.5 text-[12px] font-semibold text-[#1f6e6b]'>
                    <Clock className='size-3 text-[#2ac1bc]' aria-hidden />
                    {ongoing.remainingMinutes}분 남음
                  </p>
                </div>
              </div>
              <div className='flex justify-end'>
                <Button className='h-8 rounded-full bg-[#2ac1bc] px-3 text-[12px] font-semibold text-white hover:bg-[#1ba7a1]'>
                  경로 보기
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* 섹션 구분 디바이더 */}
        <div className='h-2 rounded-2xl bg-[#eef2f7]' />

        {/* 배달 요청 리스트 + 소팅 */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h2 className='text-[15px] font-semibold text-[#1b1b1b]'>주변 배달 요청</h2>
            <div className='flex items-center gap-1 rounded-2xl bg-white p-1 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.35)]'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setSortBy('distance')}
                className={`h-8 rounded-xl px-3 text-[12px] font-semibold ${sortBy === 'distance' ? 'bg-[#2ac1bc] text-white' : 'text-[#1b1b1b]'}`}>
                가까운 순
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setSortBy('fee')}
                className={`h-8 rounded-xl px-3 text-[12px] font-semibold ${sortBy === 'fee' ? 'bg-[#2ac1bc] text-white' : 'text-[#1b1b1b]'}`}>
                배달비 순
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setSortBy('newest')}
                className={`h-8 rounded-xl px-3 text-[12px] font-semibold ${sortBy === 'newest' ? 'bg-[#2ac1bc] text-white' : 'text-[#1b1b1b]'}`}>
                최신 순
              </Button>
            </div>
          </div>

          <div className='max-h-[calc(100dvh-380px)] space-y-3 overflow-y-auto sm:max-h-[calc(100dvh-400px)]'>
            {sortedOffers.map((o) => (
              <Card key={o.id} className='border-none bg-white shadow-sm'>
                <CardContent className='flex items-center justify-between gap-3 px-4 py-3'>
                  <div className='space-y-1'>
                    <p className='text-[14px] font-semibold text-[#1b1b1b]'>{o.store}</p>
                    <div className='flex flex-wrap items-center gap-2 text-[12px]'>
                      <span className='text-[#6b7785]'>거리 {o.distanceKm.toFixed(1)}km</span>
                      <span className='text-[#6b7785]'>예상 배달료 ₩ {o.fee.toLocaleString()}</span>
                      <span className='inline-flex items-center gap-1 rounded-full bg-[#2ac1bc]/10 px-2 py-0.5 text-[#1f6e6b]'>
                        <Navigation className='size-3 text-[#2ac1bc]' aria-hidden /> {o.etaMinutes}분
                      </span>
                    </div>
                  </div>
                  <div className='flex shrink-0 items-center gap-2'>
                    <Button
                      variant='outline'
                      className='h-8 rounded-full border-[#fbbf24] px-3 text-[12px] font-semibold text-[#92400e] hover:bg-[#fff7ed]'
                      onClick={() => declineOffer(o.id)}>
                      거절
                    </Button>
                    <Button
                      className='h-8 rounded-full bg-[#2ac1bc] px-3 text-[12px] font-semibold text-white hover:bg-[#1ba7a1]'
                      onClick={() => acceptOffer(o.id)}>
                      수락
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </RiderPageLayout>
  );
}
