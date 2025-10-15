import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { EventSourcePolyfill } from 'event-source-polyfill';
import * as React from 'react';
import { RiderPageLayout } from './RiderPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useForm, Controller } from 'react-hook-form';
import { Clock, Navigation, Timer, CheckCircle2, Wallet } from 'lucide-react';
import {
  useUpdateDeliveryStatus,
  useGetDeliveryArea,
  useGetInProgressDeliveryInfinite,
  useGetTodayDeliveries,
  useDecideOrderDelivery,
} from '@/api/generated';
import { toast } from 'sonner';
import { useGetMyProfile1 } from '@/api/generated';
import { useRiderLocationSocket } from '@/lib/useRiderLocationSocket';

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
  const { control, watch, setValue } = useForm<RiderStatusForm>({ defaultValues: { isOnline: true } });
  const isOnline = watch('isOnline');
  const updateStatus = useUpdateDeliveryStatus();
  const areaQuery = useGetDeliveryArea({ query: { staleTime: 10_000, refetchOnWindowFocus: false } } as any);
  const riderArea = ((areaQuery.data as any)?.data?.content ?? '') as string;

  // 내 배달원 프로필 조회
  const riderProfileQuery = useGetMyProfile1({
    query: { staleTime: 10_000, refetchOnWindowFocus: false },
  } as any);
  const riderProfile = ((riderProfileQuery.data as any)?.data?.content ?? undefined) as
    | { nickname?: string; vehicleType?: string; profileImageUrl?: string }
    | undefined;

  // 프로필의 toggleStatus(ON/OFF)에 따라 토글 초기값 동기화
  React.useEffect(() => {
    const status = (riderProfile as any)?.toggleStatus as string | undefined;
    if (status === 'ON') setValue('isOnline', true, { shouldDirty: false });
    else if (status === 'OFF') setValue('isOnline', false, { shouldDirty: false });
  }, [riderProfile, setValue]);

  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const [sortBy, setSortBy] = React.useState<SortBy>('distance');

  // 실시간 위치 소켓 연결 (프로필 로드 후)
  const riderProfileId = (riderProfile as any)?.profileId as number | undefined;
  const { sendLocation } = useRiderLocationSocket({
    riderProfileId: riderProfileId ?? 0,
    autoConnect: Boolean(riderProfileId),
    endpoint: 'https://api.deliver-anything.shop/ws',
  });

  // 예시: 위치 전송 (ON 상태일 때만 15초마다)
  React.useEffect(() => {
    if (!isOnline || !riderProfileId) return;
    let watchId: number | null = null;
    const send = (pos: GeolocationPosition) => {
      sendLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, timestamp: Date.now() });
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(send);
      watchId = navigator.geolocation.watchPosition(send, undefined, { enableHighAccuracy: true, maximumAge: 5000 });
    }
    const t = setInterval(() => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(send);
    }, 15_000);
    return () => {
      if (watchId != null && navigator.geolocation?.clearWatch) navigator.geolocation.clearWatch(watchId);
      clearInterval(t);
    };
  }, [isOnline, riderProfileId, sendLocation]);

  // 진행 중 배달 조회 (1분 폴링)
  const inProgressQuery = useGetInProgressDeliveryInfinite<any>({
    query: {
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last: any) => last?.data?.content?.nextPageToken ?? undefined,
      refetchInterval: 60_000,
      refetchOnWindowFocus: false,
    },
  } as any);
  const inProgressItems = React.useMemo(() => {
    const pages = (inProgressQuery.data?.pages ?? []) as any[];
    return pages.flatMap((p) => ((p as any)?.data?.content?.content ?? []) as any[]);
  }, [inProgressQuery.data]);
  const ongoing = React.useMemo(() => {
    const it: any = inProgressItems?.[0];
    if (!it) return null;
    return {
      orderId: String(it?.orderId ?? it?.id ?? ''),
      store: it?.store?.name ?? it?.storeName ?? '상점',
      address: it?.address ?? it?.destinationAddress ?? '',
      remainingMinutes: Number(it?.etaMinutes ?? it?.remainingMinutes ?? 0),
    } as { orderId: string; store: string; address: string; remainingMinutes: number };
  }, [inProgressItems]);

  const [offers, setOffers] = React.useState<Offer[]>([]);

  const sortedOffers = React.useMemo(() => {
    const arr = [...offers];
    if (sortBy === 'distance') arr.sort((a, b) => a.distanceKm - b.distanceKm);
    if (sortBy === 'fee') arr.sort((a, b) => b.fee - a.fee);
    if (sortBy === 'newest') arr.sort((a, b) => b.createdAt - a.createdAt);
    return arr;
  }, [offers, sortBy]);

  const decideMutation = useDecideOrderDelivery({
    mutation: {
      onSuccess: () => {
        toast.success('처리되었습니다.');
      },
      onError: () => {
        toast.error('요청 처리에 실패했어요. 잠시 후 다시 시도해 주세요.');
      },
    },
  } as any);

  const acceptOffer = (id: string, etaMinutes: number) => {
    decideMutation.mutate({ data: { orderId: id, decisionStatus: 'RIDER_ASSIGNED', etaMinutes } } as any);
    setOffers((prev) => prev.filter((o) => o.id !== id));
  };
  const declineOffer = (id: string) => {
    decideMutation.mutate({ data: { orderId: id, decisionStatus: 'REJECTED', etaMinutes: 0 } } as any);
    setOffers((prev) => prev.filter((o) => o.id !== id));
  };

  // SSE 구독: 주변 배달 요청 실시간 반영 (EventSourcePolyfill로 헤더 포함)
  React.useEffect(() => {
    const profileId = (riderProfile as any)?.profileId as number | undefined;
    if (!profileId) return;
    try {
      // 토큰 및 디바이스 아이디 읽기
      const token = (() => {
        try {
          const raw = localStorage.getItem('auth');
          const parsed = raw ? JSON.parse(raw) : null;
          const state = parsed?.state ?? parsed;
          return state?.accessToken as string | undefined;
        } catch {
          return undefined;
        }
      })();
      const deviceId = (() => {
        try {
          return localStorage.getItem('device-id') ?? undefined;
        } catch {
          return undefined;
        }
      })();
      const es = new EventSourcePolyfill('https://api.deliver-anything.shop/api/v1/notifications/stream', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(deviceId ? { 'X-Device-ID': deviceId } : {}),
        },
        withCredentials: true,
        heartbeatTimeout: 60000,
      } as any);
      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data || '{}');
          const msg = data?.message as string | undefined;
          const payload = data?.payload as any;
          if (!msg) return;
          if (msg === 'RIDER_ACCEPTED_ORDER') {
            const od = payload?.orderDetailsDto ?? {};
            const id = String(od?.orderId ?? payload?.orderId ?? '');
            if (!id) return;
            const store = String(od?.storeName ?? '상점');
            const distanceKm = Number(od?.distance ?? 0);
            const fee = Number(od?.expectedCharge ?? od?.expectedFee ?? 0);
            const etaMinutes = Number(payload?.etaMinutes ?? 0);
            const createdAt = Date.now();
            setOffers((prev) => {
              const next = prev.filter((o) => o.id !== id);
              next.unshift({ id, store, distanceKm, fee, etaMinutes, createdAt });
              return next.slice(0, 100);
            });
          }
          if (msg === 'RIDER_DECISION') {
            const id = String(payload?.requestId ?? payload?.orderId ?? payload?.id ?? '');
            if (!id) return;
            setOffers((prev) => prev.filter((o) => o.id !== id));
          }
        } catch {}
      };
      return () => es.close();
    } catch {}
  }, [(riderProfile as any)?.profileId]);

  // 오늘의 배달 내역 요약
  const todayQuery = useGetTodayDeliveries({
    query: { refetchInterval: 60_000, refetchOnWindowFocus: false },
  } as any);
  const today = ((todayQuery.data as any)?.data?.content ?? undefined) as
    | { todayDeliveryCount?: number; todayEarningAmount?: number; avgDeliveryTime?: number }
    | undefined;
  const todayCompleted = Number(today?.todayDeliveryCount ?? 0);
  const todayEarnings = Number(today?.todayEarningAmount ?? 0);
  const avgMinutes = Number(today?.avgDeliveryTime ?? 0);

  return (
    <RiderPageLayout>
      <div className='space-y-4'>
        {/* 상단: 날짜/시간 + 상태 토글 + 오늘 지표 */}
        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>
                {riderProfile?.nickname ? `${riderProfile.nickname}님` : '오늘'}
              </CardTitle>
              <div className='text-[12px] text-[#6b7785]'>
                {formatTime(now)}
                {riderArea ? ` · ${riderArea}` : ''}
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-3 px-4 pb-4'>
            <div className='flex items-center justify-between rounded-2xl bg-[#f5f7f9] px-3 py-2.5'>
              <div className='flex items-center gap-2'>
                <span className='text-[12px] font-semibold text-[#1b1b1b]'>라이더 상태</span>
                <span className='text-[12px] text-[#6b7785]'>
                  {isOnline ? '온라인' : '오프라인'}
                  {riderProfile?.vehicleType ? ` · ${riderProfile.vehicleType}` : ''}
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <Label htmlFor='isOnline' className='text-[11px] text-[#6b7785]'>
                  OFF
                </Label>
                <Controller
                  control={control}
                  name='isOnline'
                  render={({ field }) => (
                    <Switch
                      id='isOnline'
                      checked={field.value}
                      onCheckedChange={(next) => {
                        const prev = field.value;
                        field.onChange(next);
                        updateStatus.mutate({ data: { riderStatus: next ? 'ON' : 'OFF' } } as any, {
                          onSuccess: () => {
                            toast.success(next ? '온라인으로 전환됐어요.' : '오프라인으로 전환됐어요.');
                            try {
                              riderProfileQuery.refetch();
                            } catch {}
                          },
                          onError: () => {
                            field.onChange(prev);
                            toast.error('상태 변경에 실패했어요. 다시 시도해 주세요.');
                          },
                        });
                      }}
                    />
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
                    {ongoing.remainingMinutes > 0 ? `${ongoing.remainingMinutes}분 남음` : '진행 중'}
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
                      onClick={() => acceptOffer(o.id, o.etaMinutes)}>
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
