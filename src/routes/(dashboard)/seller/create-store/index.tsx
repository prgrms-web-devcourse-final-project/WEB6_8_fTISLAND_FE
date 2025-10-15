import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { http } from '@/api/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft } from 'lucide-react';
import { SellerFooterNav } from '../_components/SellerFooterNav';
import { useAuthStore, type AuthState } from '@/store/auth';
import { usePresignedUpload } from '@/lib/usePresignedUpload';
import { GeneratePresignedUrlRequestDomain } from '@/api/generated/model/generatePresignedUrlRequestDomain';

export const Route = createFileRoute('/(dashboard)/seller/create-store/' as any)({
  component: RouteComponent,
});

type Category = { id: number; name: string };
type ApiResponse<T> = { success: boolean; code: string; message: string; content: T };

type CreateStoreForm = {
  storeCategoryId: number | '';
  name: string;
  description: string;
  roadAddr: string;
  lat: number | '';
  lng: number | '';
  imageUrl?: string;
};

async function fetchCategories(): Promise<Category[]> {
  try {
    const apiBase = (import.meta as any)?.env?.VITE_API_URL || 'https://api.deliver-anything.shop';
    const url = `${String(apiBase).replace(/\/$/, '')}/api/v1/store-categories`;
    const raw = localStorage.getItem('auth');
    const token = raw
      ? (() => {
          try {
            const parsed = JSON.parse(raw);
            return (parsed?.state?.accessToken as string) || undefined;
          } catch {
            return undefined;
          }
        })()
      : undefined;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) return [];
    const data: ApiResponse<Category[]> | Category[] = await res.json();
    if (Array.isArray(data)) return data as Category[];
    return Array.isArray((data as any)?.content) ? ((data as any).content as Category[]) : [];
  } catch {
    return [];
  }
}

async function createStore(body: CreateStoreForm) {
  return await http.post('/api/v1/stores', body);
}

function RouteComponent() {
  const navigate = useNavigate();
  const uploadMutation = usePresignedUpload();
  const setAuth = useAuthStore((s: AuthState) => s.setAuth);
  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ['store-categories'],
    queryFn: fetchCategories,
  });

  const form = useForm<CreateStoreForm>({
    defaultValues: {
      storeCategoryId: '',
      name: '',
      description: '',
      roadAddr: '',
      lat: '',
      lng: '',
      imageUrl: '',
    },
  });
  console.log(import.meta.env.VITE_KAKAO_JS_KEY);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createStore,
    onSuccess: async (resp: any) => {
      try {
        const storeId = Number((resp as any)?.content ?? (resp as any)?.data?.content);
        if (Number.isFinite(storeId)) setAuth({ storeId });
      } catch {}
      navigate({ to: '/seller' });
    },
  });

  const [addrDialogOpen, setAddrDialogOpen] = React.useState(false);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!values.storeCategoryId || !values.roadAddr || values.lat === '' || values.lng === '') return;
    await mutateAsync({
      ...values,
      storeCategoryId: Number(values.storeCategoryId),
      lat: Number(values.lat),
      lng: Number(values.lng),
    });
  });

  return (
    <div className='flex min-h-[100dvh] w-full flex-col items-center bg-[#f1f5f9] text-[#1b1b1b]'>
      <header className='sticky top-0 z-50 flex w-full items-center gap-2 bg-[#2ac1bc] px-4 py-3 text-white sm:px-6'>
        <button
          type='button'
          aria-label='뒤로가기'
          className='rounded-full p-1 hover:bg-white/10'
          onClick={() => navigate({ to: '/seller' })}>
          <ChevronLeft className='size-6' />
        </button>
        <span className='text-[15px] font-semibold'>상점 생성</span>
      </header>

      <main className='flex w-full max-w-[28rem] flex-1 flex-col px-4 py-6 sm:px-6'>
        <h1 className='mb-4 text-xl font-bold'>상점 생성</h1>
        <form onSubmit={onSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label className='text-[12px] font-semibold'>카테고리</Label>
            <Select
              value={String(form.watch('storeCategoryId') ?? '')}
              onValueChange={(v) => form.setValue('storeCategoryId', (v ? Number(v) : '') as any)}
              disabled={catLoading}>
              <SelectTrigger className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'>
                <SelectValue placeholder='카테고리를 선택하세요' />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)} className='text-[13px]'>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='name' className='text-[12px] font-semibold'>
              상점명
            </Label>
            <Input
              id='name'
              className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
              {...form.register('name', { required: true })}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description' className='text-[12px] font-semibold'>
              상점 소개
            </Label>
            <Input
              id='description'
              className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
              {...form.register('description')}
            />
          </div>

          <div className='space-y-2'>
            <Label className='text-[12px] font-semibold'>주소(도로명)</Label>
            <div className='flex gap-2'>
              <Input
                readOnly
                className='h-9 flex-1 rounded-xl border-[#dbe4ec] text-[13px]'
                value={form.watch('roadAddr')}
              />
              <Button
                type='button'
                variant='outline'
                className='h-9 rounded-xl border-[#2ac1bc] text-[12px] text-[#2ac1bc]'
                onClick={() => setAddrDialogOpen(true)}>
                주소 검색
              </Button>
            </div>
            <div className='grid grid-cols-2 gap-2'>
              <Input
                readOnly
                className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
                value={form.watch('lat') as any}
                placeholder='위도'
              />
              <Input
                readOnly
                className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
                value={form.watch('lng') as any}
                placeholder='경도'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='imageUrl' className='text-[12px] font-semibold'>
              대표 이미지 URL
            </Label>
            <Input
              id='imageUrl'
              className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
              {...form.register('imageUrl')}
            />
            <div className='flex items-center gap-2'>
              <input
                id='imageFile'
                type='file'
                accept='image/*'
                className='block w-full text-[12px]'
                onChange={async (e) => {
                  const file = e.currentTarget.files?.[0];
                  if (!file) return;
                  const res = await uploadMutation.mutateAsync({
                    file,
                    domain: GeneratePresignedUrlRequestDomain.STORE,
                    contentType: (file as any).type || 'application/octet-stream',
                  });
                  form.setValue('imageUrl', res.objectUrl);
                }}
              />
              <Button
                type='button'
                variant='outline'
                className='h-9 rounded-xl text-[12px]'
                onClick={() => {
                  const input = document.getElementById('imageFile') as HTMLInputElement | null;
                  input?.click();
                }}
                disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? '업로드 중…' : '이미지 업로드'}
              </Button>
            </div>
          </div>

          <div className='pt-2'>
            <Button
              type='submit'
              disabled={isPending}
              className='h-10 w-full rounded-full bg-[#1ba7a1] text-[13px] font-semibold text-white hover:bg-[#17928d]'>
              상점 생성하기
            </Button>
          </div>
        </form>

        <Dialog open={addrDialogOpen} onOpenChange={setAddrDialogOpen}>
          <DialogContent className='mx-auto w-[90%] max-w-[26rem] rounded-2xl border-0 p-0 shadow-2xl'>
            <DialogHeader className='px-5 pb-3 pt-4'>
              <DialogTitle className='text-[15px] font-semibold text-[#1b1b1b]'>주소 설정</DialogTitle>
            </DialogHeader>
            <KakaoAddressSearch
              onPick={(item) => {
                form.setValue('roadAddr', item.address);
                form.setValue('lat', item.lat as any);
                form.setValue('lng', item.lng as any);
                setAddrDialogOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
        <div className='h-[calc(68px+env(safe-area-inset-bottom))]' />
      </main>
      <div className='fixed inset-x-0 bottom-0 z-[1000]'>
        <SellerFooterNav active='home' />
      </div>
    </div>
  );
}

function KakaoAddressSearch({ onPick }: { onPick(item: { address: string; lat: number; lng: number }): void }) {
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
    // 환경변수 키 로그 (디버그용)
    try {
      const w: any = window;
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
      const mask = (v?: string) =>
        v ? (v.length <= 6 ? '*'.repeat(v.length) : `${v.slice(0, 3)}***${v.slice(-3)}`) : v;
      const picked = envKey || metaKey || globalKey || lsKey || urlKey || undefined;
      console.groupCollapsed('[주소검색] Kakao 키 탐색');
      console.debug('envKey:', mask(envKey));
      console.debug('metaKey:', mask(metaKey));
      console.debug('global __KAKAO_JS_KEY:', mask(globalKey));
      console.debug('localStorage VITE_KAKAO_JS_KEY:', mask(lsKey));
      console.debug('url ?kakaoKey:', mask(urlKey));
      console.debug('picked:', mask(picked));
      console.groupEnd();
    } catch {}
    ensureReady()
      .then(() => {
        if (!cancelled) setKakaoReady(true);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : String(e));
        try {
          console.error('[주소검색] Kakao 로더 실패:', e);
        } catch {}
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const runSearch = React.useCallback(async () => {
    if (!keyword.trim()) return;
    try {
      await ensureReady();
      setKakaoReady(true);
      try {
        console.debug('[주소검색] 검색 실행:', { keyword });
      } catch {}
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
      try {
        console.error('[주소검색] ensureReady 에러:', e);
      } catch {}
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
  }, [keyword]);

  // hasMore/loadingMore는 상단에서 선언됨

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
    <div className='space-y-3 px-5 pb-5'>
      {!kakaoReady && !loadError ? (
        <p className='text-[12px] text-[#6b7785]'>
          지도를 불러오는 중입니다… (입력 후 Enter 또는 검색 버튼을 눌러주세요)
        </p>
      ) : null}
      {loadError ? <p className='text-[12px] text-[#ef4444]'>지도 로딩 실패: {loadError}</p> : null}
      <div className='flex items-center gap-2 rounded-2xl border border-[#bbe7e4] bg-[#f0fffd] px-3 py-2.5'>
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
        <ul
          onScroll={onScroll}
          className='max-h-56 space-y-2 overflow-y-auto rounded-2xl bg-white px-3 py-2 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)]'>
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
