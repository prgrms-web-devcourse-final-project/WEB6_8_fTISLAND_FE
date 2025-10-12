import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Pencil, Search, Crosshair } from 'lucide-react';
import { useGetDeliveryArea, useUpdateDeliveryArea } from '@/api/generated';
import { toast } from 'sonner';
import { useKakaoLoader } from '@/lib/useKakaoLoader';

export const Route = createFileRoute('/manage-address/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = React.useState(false);
  const [mode, setMode] = React.useState<'search' | 'map'>('search');

  const areaQuery = useGetDeliveryArea({ query: { refetchOnWindowFocus: false, staleTime: 10_000 } } as any);
  const deliveryArea = String(((areaQuery.data as any)?.data?.content as string | undefined) ?? '');

  const updateAreaMutation = useUpdateDeliveryArea();
  const { ready, ensure } = useKakaoLoader();
  const mapRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        await ensure();
        if (cancelled || !mapRef.current || !deliveryArea) return;
        const w: any = window;
        const kakao = w.kakao;
        const map = new kakao.maps.Map(mapRef.current, {
          center: new kakao.maps.LatLng(37.5665, 126.978),
          level: 4,
        });
        if (kakao.maps.services) {
          const geocoder = new kakao.maps.services.Geocoder();
          geocoder.addressSearch(deliveryArea, (res: any, status: any) => {
            if (status === kakao.maps.services.Status.OK && res && res[0]) {
              const { x, y } = res[0];
              const latlng = new kakao.maps.LatLng(Number(y), Number(x));
              map.setCenter(latlng);
              new kakao.maps.Marker({ position: latlng, map });
            }
          });
        }
      } catch {
        // ignore
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [ensure, ready, deliveryArea]);

  return (
    <div className='mx-auto w-full max-w-[420px] p-0'>
      <div className='space-y-4'>
        <Card className='border-none bg-white shadow-sm rounded-none'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>배달 가능 지역</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 px-4 pb-4 text-[13px] text-[#1b1b1b]'>
            <div className='flex items-start gap-2'>
              <MapPin className='mt-0.5 size-4 text-[#2ac1bc]' />
              <div className='flex-1'>
                <p className='font-semibold'>{deliveryArea || '설정된 배달 가능 지역이 없습니다.'}</p>
                <p className='text-[12px] text-[#6b7785]'>지도로 위치를 확인하고 변경할 수 있습니다.</p>
              </div>
              <Button
                type='button'
                size='sm'
                className='h-8 rounded-full bg-[#2ac1bc] px-3 text-[12px] font-semibold text-white hover:bg-[#1ba7a1]'
                onClick={() => setOpenDialog(true)}>
                <Pencil className='mr-1 size-3.5' /> 변경
              </Button>
            </div>

            {/* 간단 지도 미리보기 */}
            <div ref={mapRef} className='mt-2 h-40 w-full rounded-2xl bg-[#e2f6f5]' />
          </CardContent>
        </Card>
      </div>

      {/* 배달 가능 지역 설정 팝업 (라이더 전용) */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className='mx-auto w-[90%] max-w-[26rem] rounded-2xl border-0 p-0 shadow-2xl'>
          <DialogHeader className='px-5 pb-3 pt-4'>
            <DialogTitle className='text-[15px] font-semibold text-[#1b1b1b]'>배달 가능 지역 설정</DialogTitle>
          </DialogHeader>
          <div className='space-y-3 px-5 pb-5'>
            <div className='grid grid-cols-2 gap-2'>
              <Button
                type='button'
                variant={mode === 'search' ? 'default' : 'outline'}
                className={
                  mode === 'search' ? 'h-9 rounded-full bg-[#2ac1bc] text-white hover:bg-[#1ba7a1]' : 'h-9 rounded-full'
                }
                onClick={() => setMode('search')}>
                <Search className='mr-1 size-4' /> 검색으로 찾기
              </Button>
              <Button
                type='button'
                variant={mode === 'map' ? 'default' : 'outline'}
                className={
                  mode === 'map' ? 'h-9 rounded-full bg-[#2ac1bc] text-white hover:bg-[#1ba7a1]' : 'h-9 rounded-full'
                }
                onClick={() => setMode('map')}>
                <Crosshair className='mr-1 size-4' /> 현재 위치로 설정
              </Button>
            </div>

            {mode === 'search' ? (
              <RiderKakaoSearch
                onPick={async (addressText) => {
                  try {
                    await updateAreaMutation.mutateAsync({ data: { deliveryArea: addressText } } as any);
                    toast.success('배달 가능 지역이 변경되었습니다.');
                    await (areaQuery as any).refetch?.();
                    setOpenDialog(false);
                  } catch (e: any) {
                    toast.error(e?.message ?? '배달 가능 지역 변경에 실패했습니다.');
                  }
                }}
              />
            ) : (
              <RiderKakaoPickMap
                onPick={async (addressText) => {
                  try {
                    await updateAreaMutation.mutateAsync({ data: { deliveryArea: addressText } } as any);
                    toast.success('배달 가능 지역이 변경되었습니다.');
                    await (areaQuery as any).refetch?.();
                    setOpenDialog(false);
                  } catch (e: any) {
                    toast.error(e?.message ?? '배달 가능 지역 변경에 실패했습니다.');
                  }
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className='px-4 pb-4'>
        <Button
          type='button'
          className='h-11 w-full rounded-full bg-[#2ac1bc] text-[13px] font-semibold text-white hover:bg-[#1ba7a1]'
          onClick={() => navigate({ to: '/rider/mypage' })}>
          완료
        </Button>
      </div>
    </div>
  );
}

function RiderKakaoSearch({ onPick }: { onPick(addressText: string): void }) {
  const [keyword, setKeyword] = React.useState('');
  const [results, setResults] = React.useState<Array<{ id: string; address: string; buildingName?: string }>>([]);
  const [searching, setSearching] = React.useState(false);
  const [kakaoReady, setKakaoReady] = React.useState<boolean>(
    typeof window !== 'undefined' && Boolean((window as any).kakao?.maps?.services)
  );

  React.useEffect(() => {
    let cancelled = false;
    const load = () =>
      new Promise<void>((resolve, reject) => {
        const w: any = window;
        if (w.kakao?.maps?.services) return resolve();
        const done = () => resolve();
        if (w.kakao?.maps) return w.kakao.maps.load(done);
        const key = (import.meta as any)?.env?.VITE_KAKAO_JS_KEY as string;
        if (!key) return reject(new Error('Missing VITE_KAKAO_JS_KEY'));
        const scriptId = 'kakao-maps-sdk';
        const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
        if (existing) {
          const tryLoad = () => {
            const g: any = window;
            if (g?.kakao?.maps?.load) g.kakao.maps.load(() => resolve());
            else setTimeout(tryLoad, 50);
          };
          tryLoad();
          return;
        }
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services&autoload=false`;
        script.async = true;
        script.onload = () => {
          const g: any = window;
          const tryLoad = () => {
            if (g?.kakao?.maps?.load) g.kakao.maps.load(() => resolve());
            else setTimeout(tryLoad, 50);
          };
          tryLoad();
        };
        script.onerror = () => reject(new Error('Kakao SDK load failed'));
        document.head.appendChild(script);
      });
    load()
      .then(() => {
        if (!cancelled) setKakaoReady(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const runSearch = React.useCallback(() => {
    if (!keyword.trim()) return;
    setSearching(true);
    try {
      const w: any = window;
      if (!kakaoReady || !w?.kakao?.maps?.services) {
        setSearching(false);
        return;
      }
      const ps = new w.kakao.maps.services.Places();
      ps.keywordSearch(keyword, (data: any, status: any) => {
        if (status === w.kakao.maps.services.Status.OK) {
          const mapped = (data || []).map((item: any) => ({
            id: item.id,
            address: item.road_address_name || item.address_name,
            buildingName: item.place_name,
          }));
          setResults(mapped);
        } else {
          setResults([]);
        }
        setSearching(false);
      });
    } catch {
      setSearching(false);
    }
  }, [keyword, kakaoReady]);

  return (
    <div className='space-y-3'>
      <div className='flex items-center gap-2 rounded-2xl border border-[#bbe7e4] bg-[#f0fffd] px-3 py-2.5'>
        <Search className='size-[18px] text-[#2ac1bc]' aria-hidden />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              runSearch();
            }
          }}
          placeholder='예) 서울시 중구 세종대로 110'
          className='h-9 flex-1 border-0 bg-transparent text-[13px] text-[#1b1b1b] outline-none placeholder:text-[#9aa5b1]'
        />
        <Button
          type='button'
          size='sm'
          className='h-8 rounded-full bg-[#2ac1bc] px-4 text-[12px] font-semibold text-white hover:bg-[#1ba7a1]'
          onClick={runSearch}
          disabled={searching}>
          검색
        </Button>
      </div>
      {results.length > 0 ? (
        <ul className='max-h-56 space-y-2 overflow-y-auto rounded-2xl bg-white px-3 py-2 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)]'>
          {results.map((r) => (
            <li key={r.id}>
              <button
                type='button'
                className='w-full rounded-xl px-3 py-2 text-left text-[13px] text-[#1b1b1b] transition-colors hover:bg-[#f5f7f9]'
                onClick={() => onPick(r.address)}>
                <p className='font-semibold'>{r.address}</p>
                {r.buildingName ? <p className='text-[12px] text-[#667085]'>{r.buildingName}</p> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : searching ? (
        <p className='text-[12px] text-[#6b7785]'>주소를 검색 중입니다…</p>
      ) : null}
    </div>
  );
}

function RiderKakaoPickMap({ onPick }: { onPick(addressText: string): void }) {
  const [kakaoReady, setKakaoReady] = React.useState<boolean>(
    typeof window !== 'undefined' && Boolean((window as any).kakao?.maps?.services)
  );
  const mapRef = React.useRef<HTMLDivElement | null>(null);
  const mapObjRef = React.useRef<any>(null);
  const geocoderRef = React.useRef<any>(null);
  const [address, setAddress] = React.useState<string>('');

  React.useEffect(() => {
    let cancelled = false;
    const load = () =>
      new Promise<void>((resolve, reject) => {
        const w: any = window;
        if (w.kakao?.maps?.services) return resolve();
        const done = () => resolve();
        if (w.kakao?.maps) return w.kakao.maps.load(done);
        const key = (import.meta as any)?.env?.VITE_KAKAO_JS_KEY as string;
        if (!key) return reject(new Error('Missing VITE_KAKAO_JS_KEY'));
        const scriptId = 'kakao-maps-sdk';
        const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
        if (existing) {
          const tryLoad = () => {
            const g: any = window;
            if (g?.kakao?.maps?.load) g.kakao.maps.load(() => resolve());
            else setTimeout(tryLoad, 50);
          };
          tryLoad();
          return;
        }
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services&autoload=false`;
        script.async = true;
        script.onload = () => {
          const g: any = window;
          const tryLoad = () => {
            if (g?.kakao?.maps?.load) g.kakao.maps.load(() => resolve());
            else setTimeout(tryLoad, 50);
          };
          tryLoad();
        };
        script.onerror = () => reject(new Error('Kakao SDK load failed'));
        document.head.appendChild(script);
      });
    load()
      .then(() => {
        if (!cancelled) setKakaoReady(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    try {
      const w: any = window;
      if (!kakaoReady || !mapRef.current || !w?.kakao?.maps) return;
      const kakao = w.kakao;
      const map = new kakao.maps.Map(mapRef.current, {
        center: new kakao.maps.LatLng(37.5665, 126.978),
        level: 3,
      });
      mapObjRef.current = map;
      const geocoder = (geocoderRef.current ||= new kakao.maps.services.Geocoder());
      const update = () => {
        const c = map.getCenter();
        geocoder.coord2Address(c.getLng(), c.getLat(), (res: any, status: any) => {
          if (status === kakao.maps.services.Status.OK && res && res.length > 0) {
            const item = res[0];
            const road = item.road_address?.address_name as string | undefined;
            const jibun = item.address?.address_name as string | undefined;
            setAddress(road || jibun || '주소를 가져올 수 없어요');
          }
        });
      };
      kakao.maps.event.addListener(map, 'center_changed', () => {
        // 약한 디바운스
        setTimeout(update, 200);
      });
      // 현재 위치 시도
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc = new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
            map.setCenter(loc);
            update();
          },
          () => update(),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        update();
      }
    } catch {}
  }, [kakaoReady]);

  return (
    <div className='space-y-3'>
      <div className='relative h-56 rounded-2xl overflow-hidden'>
        <div ref={mapRef} className='absolute inset-0 bg-[#e2f6f5]' />
        <div className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full z-50'>
          <div className='text-2xl'>📍</div>
        </div>
      </div>
      <div className='rounded-xl bg-white px-3 py-2 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)]'>
        <p className='text-[12px] text-[#1b1b1b]'>도로명 주소</p>
        <p className='text-[13px] font-semibold text-[#1b1b1b]'>{address || '주소를 확인 중입니다…'}</p>
      </div>
      <div className='flex justify-end'>
        <Button
          type='button'
          className='h-9 rounded-full bg-[#2ac1bc] px-4 text-[12px] font-semibold text-white hover:bg-[#1ba7a1]'
          onClick={() => address && onPick(address)}>
          선택 완료
        </Button>
      </div>
    </div>
  );
}
