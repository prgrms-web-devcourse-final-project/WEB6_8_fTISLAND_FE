import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function KakaoAddressSearch({
  onPick,
}: {
  onPick(item: { address: string; lat: number; lng: number }): void;
}) {
  const [keyword, setKeyword] = React.useState('');
  const [results, setResults] = React.useState<Array<{ id: string; address: string; lat: number; lng: number }>>([]);
  const [kakaoReady, setKakaoReady] = React.useState<boolean>(
    typeof window !== 'undefined' && Boolean((window as any).kakao?.maps?.services)
  );
  const [searching, setSearching] = React.useState(false);
  const paginationRef = React.useRef<any>(null);
  const isAppendingRef = React.useRef<boolean>(false);
  const [hasMore, setHasMore] = React.useState<boolean>(false);
  const [loadingMore, setLoadingMore] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const ensureReady = React.useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      try {
        const w: any = window;
        const done = () => resolve();
        if (w?.kakao?.maps?.services) {
          setKakaoReady(true);
          return done();
        }
        if (w?.kakao?.maps?.load)
          return w.kakao.maps.load(() => {
            setKakaoReady(true);
            done();
          });
        const envKey = (import.meta as any)?.env?.VITE_KAKAO_JS_KEY as string | undefined;
        const metaKey =
          (document.querySelector('meta[name="kakao-js-key"]') as HTMLMetaElement | null)?.content || undefined;
        const globalKey = (w as any).__KAKAO_JS_KEY as string | undefined;
        const lsKey = (() => {
          try {
            return localStorage.getItem('VITE_KAKAO_JS_KEY') || undefined;
          } catch {
            return undefined;
          }
        })();
        const urlKey = (() => {
          try {
            return new URLSearchParams(location.search).get('kakaoKey') || undefined;
          } catch {
            return undefined;
          }
        })();
        const key = envKey || metaKey || globalKey || lsKey || urlKey || '';
        if (!key) return reject(new Error('Missing VITE_KAKAO_JS_KEY'));
        if ((w as any).__kakaoLoaderPromise)
          return (w as any).__kakaoLoaderPromise.then(() => ensureReady().then(resolve).catch(reject)).catch(reject);
        const existing = document.getElementById('kakao-maps-sdk') as HTMLScriptElement | null;
        if (existing) {
          (w as any).__kakaoLoaderPromise = new Promise<void>((res) => {
            const tryLoad = () => {
              const g: any = window;
              if (g?.kakao?.maps?.load) g.kakao.maps.load(() => res());
              else setTimeout(tryLoad, 50);
            };
            tryLoad();
          });
          return (w as any).__kakaoLoaderPromise.then(() => ensureReady().then(resolve).catch(reject)).catch(reject);
        }
        const script = document.createElement('script');
        script.id = 'kakao-maps-sdk';
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services&autoload=false`;
        script.async = true;
        script.onload = () => {
          try {
            (w as any).__kakaoLoaderPromise = new Promise<void>((res) => {
              const tryLoad = () => {
                const g: any = window;
                if (g?.kakao?.maps?.load) g.kakao.maps.load(() => res());
                else setTimeout(tryLoad, 50);
              };
              tryLoad();
            });
            (w as any).__kakaoLoaderPromise.then(() => ensureReady().then(resolve).catch(reject)).catch(reject);
          } catch (e) {
            reject(e as any);
          }
        };
        script.onerror = () => reject(new Error('Kakao SDK load failed'));
        document.head.appendChild(script);
      } catch (e) {
        reject(e as any);
      }
    });
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    ensureReady()
      .then(() => {
        if (!cancelled) setKakaoReady(true);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [ensureReady]);

  const runSearch = React.useCallback(async () => {
    if (!keyword.trim()) return;
    try {
      await ensureReady();
      setKakaoReady(true);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
      return;
    }
    const w: any = window;
    setSearching(true);
    isAppendingRef.current = false;
    setResults([]);
    const ps = new w.kakao.maps.services.Places();
    ps.keywordSearch(
      keyword,
      (data: any, status: any, pagination: any) => {
        if (status === w.kakao.maps.services.Status.OK) {
          const pageItems = (data || []).map((item: any, idx: number) => ({
            id: item.id,
            address: item.road_address_name || item.address_name,
            buildingName: item.place_name,
            postalCode: item.road_address?.zone_no,
            lat: Number(item.y),
            lng: Number(item.x),
            __priority: item.road_address_name ? 2 : 1,
            __idx: idx,
          }));
          const sortByPriority = (arr: any[]) =>
            arr
              .slice()
              .sort((a, b) => b.__priority - a.__priority || a.__idx - b.__idx)
              .map((i) => ({ id: i.id, address: i.address, lat: i.lat, lng: i.lng }));

          if (isAppendingRef.current) {
            setResults((prev) => sortByPriority([...(prev as any[]), ...pageItems] as any));
          } else {
            setResults(sortByPriority(pageItems as any));
          }
          paginationRef.current = pagination;
          const more = Boolean(pagination && (pagination.hasNextPage === true || pagination.current < pagination.last));
          setHasMore(more);
        }
        setSearching(false);
        setLoadingMore(false);
        isAppendingRef.current = false;
      },
      { page: 1, size: 10 }
    );
  }, [keyword, ensureReady]);

  const lastScrollTopRef = React.useRef(0);
  const onScroll = React.useCallback(
    (e: React.UIEvent<HTMLUListElement>) => {
      if (!hasMore || loadingMore) return;
      const el = e.currentTarget;
      const goingDown = el.scrollTop > lastScrollTopRef.current;
      lastScrollTopRef.current = el.scrollTop;
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
      if (goingDown && nearBottom && paginationRef.current && typeof paginationRef.current.nextPage === 'function') {
        isAppendingRef.current = true;
        setLoadingMore(true);
        paginationRef.current.nextPage();
      }
    },
    [hasMore, loadingMore]
  );

  return (
    <div className='space-y-3 px-1 pb-2'>
      {!kakaoReady && !loadError ? <p className='text-[12px] text-[#6b7785]'>지도를 불러오는 중입니다…</p> : null}
      {loadError ? <p className='text-[12px] text-[#ef4444]'>지도 로딩 실패: {loadError}</p> : null}
      <div className='flex items-center gap-2 rounded-2xl border border-[#bbe7e4] bg-[#f0fffd] px-3 py-2.5'>
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              runSearch();
            }
          }}
          placeholder='예) 서울시 중구 세종대로 110'
          className='h-9 flex-1 border-0 bg-transparent text-[13px] text-[#1b1b1b] placeholder:text-[#9aa5b1] focus-visible:ring-0'
        />
        <Button
          type='button'
          size='sm'
          className='h-8 rounded-full bg-[#2ac1bc] px-4 text-[12px] font-semibold text_white hover:bg-[#1ba7a1]'
          onClick={runSearch}
          disabled={searching}>
          검색
        </Button>
      </div>
      {results.length > 0 ? (
        <ul onScroll={onScroll} className='max-h-56 space-y-2 overflow-y-auto rounded-2xl bg-white px-3 py-2'>
          {results.map((item) => (
            <li key={item.id}>
              <button
                type='button'
                className='w-full rounded-xl px-3 py-2 text-left text-[13px] text-[#1b1b1b] transition-colors hover:bg-[#f5f7f9]'
                onClick={() => onPick({ address: item.address, lat: item.lat, lng: item.lng })}>
                <p className='font-semibold'>{item.address}</p>
              </button>
            </li>
          ))}
          {loadingMore ? <li className='py-2 text-center text-[12px] text-[#6b7785]'>더 불러오는 중…</li> : null}
        </ul>
      ) : searching ? (
        <p className='text-[12px] text-[#6b7785]'>주소를 검색 중입니다…</p>
      ) : null}
    </div>
  );
}
