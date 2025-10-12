import * as React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { RiderPageLayout } from '../../RiderPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useGetInProgressDetailDelivery, useUpdateStatus } from '@/api/generated';
import { toast } from 'sonner';

export const Route = createFileRoute('/(dashboard)/rider/orders/$orderId/')({
  component: RouteComponent,
});

type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

function RouteComponent() {
  const { orderId } = Route.useParams();
  const [status, setStatus] = React.useState<OrderStatus>('IN_PROGRESS');
  const deliveryId = Number(orderId);
  const detailQuery = useGetInProgressDetailDelivery(deliveryId, {
    query: { enabled: Number.isFinite(deliveryId), refetchInterval: 60_000, refetchOnWindowFocus: false },
  } as any);
  const detail = ((detailQuery.data as any)?.data?.content ?? undefined) as any;
  const store = {
    name: detail?.store?.name ?? '상점',
    address: detail?.store?.address ?? detail?.storeAddress ?? '',
    phone: detail?.store?.phone ?? detail?.storePhone ?? '',
  };
  const customer = {
    nickname: detail?.customer?.nickname ?? detail?.customerName ?? '고객',
    address: detail?.customer?.address ?? detail?.customerAddress ?? '',
    phone: detail?.customer?.phone ?? detail?.customerPhone ?? '',
  };
  const rider = { lat: Number(detail?.riderLat ?? 37.5895), lng: Number(detail?.riderLng ?? 127.0167) };
  const storePos = { lat: Number(detail?.storeLat ?? 37.5912), lng: Number(detail?.storeLng ?? 127.0193) };
  const customerPos = { lat: Number(detail?.customerLat ?? 37.5868), lng: Number(detail?.customerLng ?? 127.0142) };
  const eta = {
    remainingMinutes: Number(detail?.etaRemainingMinutes ?? 0),
    estimateMinutes: Number(detail?.etaTotalMinutes ?? 0),
  };
  const customerRequest = detail?.customerRequest ?? '요청 사항이 없습니다.';

  const updateStatusMutation = useUpdateStatus({
    mutation: {
      onSuccess: async () => {
        toast.success('배달 상태가 변경되었습니다.');
        await detailQuery.refetch();
      },
      onError: (e: any) => {
        toast.error(e?.message ?? '배달 상태 변경에 실패했습니다.');
      },
    },
  } as any);

  const handleChangeStatus = (next: OrderStatus) => {
    setStatus(next);
    if (!Number.isFinite(deliveryId)) return;
    updateStatusMutation.mutate({ deliveryId, params: { nextStatus: next } } as any);
  };

  return (
    <RiderPageLayout>
      <div className='space-y-4'>
        {/* 상단: 주문 번호/상점/주문자/상태 변경 */}
        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>주문 정보</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 px-4 pb-4 text-[13px] text-[#1b1b1b]'>
            <div className='flex items-center justify-between'>
              <span className='text-[#6b7785]'>주문 번호</span>
              <span className='font-extrabold'>#{orderId}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-[#6b7785]'>상점</span>
              <span className='font-semibold'>{store.name}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-[#6b7785]'>주문자</span>
              <span className='font-semibold'>{customer.nickname}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-[#6b7785]'>상태</span>
              <Select value={status} onValueChange={(v) => handleChangeStatus(v as OrderStatus)}>
                <SelectTrigger className='h-8 w-[140px] rounded-xl border-[#dbe4ec] text-[12px]'>
                  <SelectValue placeholder='상태 선택' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='PENDING'>픽업 대기 - PENDING</SelectItem>
                  <SelectItem value='IN_PROGRESS'>배달 중 - IN_PROGRESS</SelectItem>
                  <SelectItem value='COMPLETED'>완료 - COMPLETED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 상점/소비자 정보 */}
        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>주소 및 연락처</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 px-4 pb-4 text-[12px]'>
            <div className='space-y-1'>
              <Label className='text-[#6b7785]'>상점 주소</Label>
              <p className='font-semibold text-[#1b1b1b]'>{store.address}</p>
              <p className='text-[#6b7785]'>연락처 {store.phone}</p>
            </div>
            <div className='space-y-1'>
              <Label className='text-[#6b7785]'>소비자 주소</Label>
              <p className='font-semibold text-[#1b1b1b]'>{customer.address}</p>
              <p className='text-[#6b7785]'>연락처 {customer.phone}</p>
            </div>
          </CardContent>
        </Card>

        {/* 카카오맵 섹션 - SDK 로더 + 3 포지션 마커 */}
        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>실시간 위치</CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <KakaoMap store={storePos} customer={customerPos} rider={rider} />
          </CardContent>
        </Card>

        {/* ETA 섹션 */}
        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>예상 시간</CardTitle>
          </CardHeader>
          <CardContent className='flex items-center justify-between px-4 pb-4 text-[13px]'>
            <p className='text-[#6b7785]'>남은 시간</p>
            <p className='font-extrabold text-[#1b1b1b]'>{eta.remainingMinutes}분</p>
            <p className='text-[#6b7785]'>예상 배달</p>
            <p className='font-extrabold text-[#1b1b1b]'>{eta.estimateMinutes}분</p>
          </CardContent>
        </Card>

        {/* 고객 요청사항 + 상세 주문 보기 */}
        <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>고객 요청사항</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 px-4 pb-4'>
            <p className='rounded-2xl bg-[#f5f7f9] p-3 text-[12px] text-[#1b1b1b]'>{customerRequest}</p>
            <a href={`/rider/orders/${orderId}/detail`}>
              <Button className='h-9 rounded-full bg-[#2ac1bc] text-[12px] font-semibold text-white hover:bg-[#1ba7a1]'>
                상세 주문 보기
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </RiderPageLayout>
  );
}

interface KakaoMapProps {
  store: { lat: number; lng: number };
  customer: { lat: number; lng: number };
  rider: { lat: number; lng: number };
}

function KakaoMap({ store, customer, rider }: KakaoMapProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    // SDK 로드
    const existed = (window as any).kakao?.maps;
    const key = import.meta.env.VITE_KAKAO_JS_KEY as string;
    function init() {
      const kakao = (window as any).kakao;
      const map = new kakao.maps.Map(containerRef.current, {
        center: new kakao.maps.LatLng(rider.lat, rider.lng),
        level: 5,
      });
      [store, customer, rider].forEach((pos) => {
        new kakao.maps.Marker({ position: new kakao.maps.LatLng(pos.lat, pos.lng), map });
      });
    }
    if (!existed) {
      const script = document.createElement('script');
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;
      script.async = true;
      script.onload = () => {
        (window as any).kakao.maps.load(init);
      };
      document.head.appendChild(script);
    } else {
      init();
    }
  }, [store, customer, rider]);

  return <div ref={containerRef} className='h-48 w-full rounded-2xl bg-[#e5e7eb]' />;
}
