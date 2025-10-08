import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
// import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { LucideBuilding, LucideHome, LucidePlusCircle, Search, X } from 'lucide-react';

// Kakao Maps SDK typings (simple guard)
declare global {
  interface Window {
    kakao?: any;
  }
}

export type AddressRole = 'customer' | 'seller' | 'rider';

export interface AddressFormValues {
  keyword: string;
  selectedAddress?: {
    address: string;
    buildingName?: string;
    postalCode?: string;
  };
  unitNumber?: string;
  memo?: string;
  type: 'home' | 'company' | 'custom';
  setPrimary: boolean;
  agreeLocation: boolean;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
}

// 타입 버튼 UI 제거됨 (요구사항 최신 반영)

export interface AddressManageProps {
  defaultOpen?: boolean;
  role?: AddressRole;
  asDialog?: boolean;
  savedAddresses?: Array<{
    id: string;
    label: string;
    detail: string;
    isPrimary?: boolean;
    type: 'home' | 'company' | 'custom';
  }>;
  onSave?: (data: AddressFormValues) => void;
  onClose?: () => void;
}

export default function AddressManage({
  defaultOpen = true,
  asDialog = false,
  savedAddresses = [],
  onSave,
  onClose,
}: AddressManageProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  // 주소 설정 팝업으로 검색 플로우를 이관하여 여기선 사용하지 않음
  // const [previewMap, setPreviewMap] = React.useState<string | null>(null);
  const [localSavedAddresses, setLocalSavedAddresses] = React.useState(savedAddresses);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);
  const [addressDialogOpen, setAddressDialogOpen] = React.useState(false);
  const [mapDialogOpen, setMapDialogOpen] = React.useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [pendingAddress, setPendingAddress] = React.useState<{
    id: string;
    address: string;
    buildingName?: string;
    postalCode?: string;
  } | null>(null);
  const [presetType, setPresetType] = React.useState<'home' | 'company' | 'custom' | null>(null);
  const [homeAddress, setHomeAddress] = React.useState<{
    address: string;
    buildingName?: string;
    postalCode?: string;
    unitNumber?: string;
  } | null>(null);
  const [companyAddress, setCompanyAddress] = React.useState<{
    address: string;
    buildingName?: string;
    postalCode?: string;
    unitNumber?: string;
  } | null>(null);
  // const isCustomer = role === 'customer';

  const form = useForm<AddressFormValues>({
    defaultValues: {
      keyword: '',
      type: 'custom',
      setPrimary: false,
      agreeLocation: false,
    },
  });
  const { handleSubmit } = form;
  // const addressType = watch('type');

  const handleClose = React.useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  // 검색은 KakaoSearchMap 내부에서 수행

  // 현재 위치 찾기 로직은 지도 팝업으로 대체됨

  // home/company 기본 주소 여부는 리스트에서 선택/삭제로 관리

  const requestDeleteAddress = React.useCallback((id: string) => {
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDeleteAddress = React.useCallback(() => {
    if (!deleteTargetId) return;
    setLocalSavedAddresses((prev) => prev.filter((a) => a.id !== deleteTargetId));
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
  }, [deleteTargetId]);

  const finalizeFromSaved = React.useCallback(
    (item: { id: string; label: string; detail: string; type: 'home' | 'company' | 'custom' }) => {
      const values: AddressFormValues = {
        keyword: '',
        selectedAddress: {
          address: item.detail,
          buildingName: item.label,
        },
        type: item.type,
        setPrimary: false,
        agreeLocation: false,
      };
      onSave?.(values);
      handleClose();
    },
    [onSave, handleClose]
  );

  // const handleSelectAddress = React.useCallback(
  //   (item: { id: string; address: string; buildingName?: string; postalCode?: string }) => {
  //     setValue('selectedAddress', {
  //       address: item.address,
  //       buildingName: item.buildingName,
  //       postalCode: item.postalCode,
  //     });
  //   },
  //   [setValue]
  // );

  const onSubmit = React.useCallback(
    (values: AddressFormValues) => {
      if (!values.selectedAddress) return;
      onSave?.(values);
      handleClose();
    },
    [handleClose, onSave]
  );

  // const onSaveDraft = React.useCallback((values: AddressFormValues) => { onSave?.(values); }, [onSave]);

  // const canSubmit = Boolean(selectedAddress);

  if (!asDialog && !isOpen) return null;

  const card = (
    <Card
      className={`w-full max-w-[26rem] rounded-3xl border-none bg-white shadow-xl sm:max-w-[28rem] ${
        asDialog ? 'max-h-[80vh] flex flex-col' : ''
      }`}>
      <CardHeader className='space-y-3 pb-1 pt-3'>
        <div className='flex items-start justify-between'>
          <div>
            <CardTitle className='text-xl font-bold text-[#1b1b1b]'>주소 관리</CardTitle>
          </div>
          {!asDialog ? (
            <Button variant='ghost' size='icon' className='size-8 rounded-full text-[#1b1b1b]' onClick={handleClose}>
              <X className='size-5' aria-hidden />
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} className={`flex ${asDialog ? 'h-full flex-col' : ''}`}>
        <CardContent className={`space-y-5 px-6 pb-16 ${asDialog ? 'flex-1 overflow-y-auto' : ''}`}>
          <section className='space-y-3'>
            <div className='flex items-center gap-2 flex-col'>
              <button
                type='button'
                onClick={() => setAddressDialogOpen(true)}
                className='flex w-full py-3 h-15 flex-1 items-center gap-2 rounded-2xl border border-[#bbe7e4] bg-[#f0fffd] px-3 text-left text-[13px] text-[#1b1b1b] hover:bg-[#e9fbf8]'>
                <Search className='size-[18px] text-[#2ac1bc]' aria-hidden />
                <span className='text-[13px] text-[#6b7785]'>도로명, 건물명 또는 지번으로 검색</span>
              </button>
              <Button
                type='button'
                size='sm'
                variant='outline'
                className='h-10 w-full rounded-full border-[#2ac1bc]/50 px-3 text-[12px] font-semibold text-[#2ac1bc] hover:bg-[#2ac1bc]/10'
                onClick={() => setMapDialogOpen(true)}>
                현재 위치로 찾기
              </Button>
            </div>
          </section>

          {/* 현재 위치로 찾기 버튼 아래 선택된 주소 섹션 제거 */}

          <section className='space-y-3 mb-4'>
            <div className='flex items-center gap-2 flex-col'>
              <Card className='w-full flex py-4 gap-1'>
                <CardHeader className='text-[13px] font-semibold text-[#1b1b1b] flex items-center gap-2'>
                  <div className='flex items-center gap-2'>
                    <LucideHome className='size-[14px]' />
                    <span>집 주소</span>
                  </div>
                  {homeAddress ? (
                    <div className='flex items-center gap-1'>
                      <Button
                        variant='ghost'
                        className='h-6 text-[#2ac1bc] hover:border-[#2ac1bc] hover:bg-[#2ac1bc]/10'
                        onClick={() => {
                          setPresetType('home');
                          setPendingAddress(null);
                          setAddressDialogOpen(true);
                        }}>
                        수정하기
                      </Button>
                      <Button
                        variant='ghost'
                        className='h-6 text-[#f43f5e] hover:bg-[#fee2e2]'
                        onClick={() => setHomeAddress(null)}>
                        삭제
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant='ghost'
                      className='h-6 text-[#2ac1bc] hover:border-[#2ac1bc] hover:bg-[#2ac1bc]/10'
                      onClick={() => {
                        setPresetType('home');
                        setPendingAddress(null);
                        setAddressDialogOpen(true);
                      }}>
                      <LucidePlusCircle />
                      추가하기
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <span className='text-[12px] text-[#6b7785]'>
                    {homeAddress
                      ? `${homeAddress.address}${homeAddress.unitNumber ? ` ${homeAddress.unitNumber}` : ''}`
                      : '등록된 집 주소가 없습니다.'}
                  </span>
                </CardContent>
              </Card>
              <Card className='w-full flex py-4 gap-1'>
                <CardHeader className='text-[13px] font-semibold text-[#1b1b1b] flex items-center gap-2'>
                  <div className='flex items-center gap-2'>
                    <LucideBuilding className='size-[14px]' />
                    <span>회사 주소</span>
                  </div>
                  {companyAddress ? (
                    <div className='flex items-center gap-1'>
                      <Button
                        variant='ghost'
                        className='h-6 text-[#2ac1bc] hover:border-[#2ac1bc] hover:bg-[#2ac1bc]/10'
                        onClick={() => {
                          setPresetType('company');
                          setPendingAddress(null);
                          setAddressDialogOpen(true);
                        }}>
                        수정하기
                      </Button>
                      <Button
                        variant='ghost'
                        className='h-6 text-[#f43f5e] hover:bg-[#fee2e2]'
                        onClick={() => setCompanyAddress(null)}>
                        삭제
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant='ghost'
                      className='h-6 text-[#2ac1bc] hover:border-[#2ac1bc] hover:bg-[#2ac1bc]/10'
                      onClick={() => {
                        setPresetType('company');
                        setPendingAddress(null);
                        setAddressDialogOpen(true);
                      }}>
                      <LucidePlusCircle />
                      추가하기
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <span className='text-[12px] text-[#6b7785]'>
                    {companyAddress
                      ? `${companyAddress.address}${companyAddress.unitNumber ? ` ${companyAddress.unitNumber}` : ''}`
                      : '등록된 회사 주소가 없습니다.'}
                  </span>
                </CardContent>
              </Card>
            </div>
          </section>

          {localSavedAddresses.length > 0 ? (
            <section className='space-y-2'>
              <p className='text-[12px] font-semibold text-[#1b1b1b]'>등록된 주소</p>
              <div className='space-y-2 rounded-2xl bg-white px-3 py-2 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)] max-h-56 overflow-y-auto'>
                {localSavedAddresses.map((item) => (
                  <button
                    key={item.id}
                    type='button'
                    className='flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] text-[#1b1b1b] transition-colors hover:bg-[#f5f7f9]'
                    onClick={() =>
                      finalizeFromSaved({ id: item.id, label: item.label, detail: item.detail, type: item.type })
                    }>
                    <span className='space-y-0.5'>
                      <span className='font-semibold'>{item.label}</span>
                      <span className='block text-[12px] text-[#6b7785]'>{item.detail}</span>
                    </span>
                    <span className='flex items-center gap-2'>
                      {item.isPrimary ? (
                        <span className='rounded-full bg-[#2ac1bc]/10 px-2 py-0.5 text-[11px] font-semibold text-[#1f6e6b]'>
                          기본
                        </span>
                      ) : null}
                      <Button
                        type='button'
                        variant='ghost'
                        className='h-8 rounded-full text-[#f43f5e] hover:bg-[#fee2e2]'
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDeleteAddress(item.id);
                        }}>
                        삭제
                      </Button>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {/* 지도 미리보기 섹션 제거 */}

          {/* 정산 계좌 정보 섹션 제거 */}
        </CardContent>

        {/* 하단 등록 버튼 제거 (상세 정보 다이얼로그 및 리스트 클릭으로 등록) */}
      </form>
    </Card>
  );

  if (asDialog) {
    return (
      <>
        {card}
        {/* 주소 설정 팝업 (검색 버튼 클릭 시) - Kakao Maps SDK */}
        <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
          <DialogContent className='mx-auto w-[90%] max-w-[26rem] rounded-2xl border-0 p-0 shadow-2xl'>
            <DialogHeader className='px-5 pb-3 pt-4'>
              <DialogTitle className='text-[15px] font-semibold text-[#1b1b1b]'>주소 설정</DialogTitle>
            </DialogHeader>
            <KakaoSearchMap
              onPick={(item) => {
                setPendingAddress(item);
                setAddressDialogOpen(false);
                setDetailDialogOpen(true);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* 지도에서 주소 찾기 팝업 (현재 위치 찾기 클릭 시) */}
        <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
          <DialogContent className='mx-auto w-[90%] max-w-[26rem] rounded-2xl border-0 p-0 shadow-2xl'>
            <DialogHeader className='px-5 pb-3 pt-4'>
              <DialogTitle className='text-[15px] font-semibold text-[#1b1b1b]'>지도에서 주소 찾기</DialogTitle>
            </DialogHeader>
            <KakaoPickOnMap
              onPick={(item) => {
                setPendingAddress(item);
                setMapDialogOpen(false);
                setDetailDialogOpen(true);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* 주소 상세 정보 입력 팝업 */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className='mx-auto w-[90%] max-w-[26rem] rounded-2xl border-0 p-0 shadow-2xl'>
            <DialogHeader className='px-5 pb-3 pt-4'>
              <DialogTitle className='text-[15px] font-semibold text-[#1b1b1b]'>주소 상세 정보</DialogTitle>
            </DialogHeader>
            {pendingAddress ? (
              <DetailAddressForm
                base={pendingAddress}
                presetType={presetType ?? 'custom'}
                onSubmit={(values) => {
                  // 선택된 상세 정보를 메인 상태 및 리스트에 반영
                  const fullDetail = values.unitNumber?.trim()
                    ? `${values.address.address} ${values.unitNumber}`
                    : values.address.address;

                  if (values.type === 'home') {
                    setHomeAddress({
                      address: values.address.address,
                      buildingName: values.address.buildingName,
                      postalCode: values.address.postalCode,
                      unitNumber: values.unitNumber,
                    });
                  } else if (values.type === 'company') {
                    setCompanyAddress({
                      address: values.address.address,
                      buildingName: values.address.buildingName,
                      postalCode: values.address.postalCode,
                      unitNumber: values.unitNumber,
                    });
                  } else {
                    // custom은 기존 리스트에 추가
                    setLocalSavedAddresses((prev) => [
                      {
                        id: `${Date.now()}`,
                        label: values.address.buildingName || '일반',
                        detail: fullDetail,
                        isPrimary: false,
                        type: 'custom',
                      },
                      ...prev,
                    ]);
                  }
                  setDetailDialogOpen(false);
                }}
              />
            ) : null}
          </DialogContent>
        </Dialog>
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>주소를 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>이 작업은 되돌릴 수 없습니다.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteAddress} className='bg-[#f43f5e] hover:bg-[#e11d48]'>
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 sm:px-0'>{card}</div>
  );
}

function KakaoSearchMap({
  onPick,
}: {
  onPick(item: { id: string; address: string; buildingName?: string; postalCode?: string }): void;
}) {
  const [keyword, setKeyword] = React.useState('');
  const [searching, setSearching] = React.useState(false);
  const [results, setResults] = React.useState<
    Array<{ id: string; address: string; buildingName?: string; postalCode?: string }>
  >([]);
  const [kakaoReady, setKakaoReady] = React.useState<boolean>(
    typeof window !== 'undefined' && Boolean((window as any).kakao?.maps?.services)
  );
  const paginationRef = React.useRef<any>(null);
  const isAppendingRef = React.useRef<boolean>(false);
  const [hasMore, setHasMore] = React.useState<boolean>(false);
  const [loadingMore, setLoadingMore] = React.useState<boolean>(false);
  const listRef = React.useRef<HTMLUListElement | null>(null);

  const runSearch = React.useCallback(() => {
    if (!keyword.trim()) {
      setSearching(false);
      return;
    }
    setSearching(true);
    isAppendingRef.current = false;
    setResults([]);
    setHasMore(false);
    setLoadingMore(false);
    try {
      const w: any = window;
      if (!kakaoReady || !w?.kakao?.maps?.services) {
        setSearching(false);
        return;
      }
      const ps = new w.kakao.maps.services.Places();
      ps.keywordSearch(
        keyword,
        (data: any, status: any, pagination: any) => {
          if (status === w.kakao.maps.services.Status.OK) {
            const mapped = (data || [])
              .map((item: any) => ({
                id: item.id,
                address: item.road_address_name || item.address_name,
                buildingName: item.place_name,
                postalCode: item.road_address?.zone_no,
                __priority: item.road_address_name ? 1 : 0, // 도로명 주소 우선 정렬용
              }))
              .sort((a: any, b: any) => b.__priority - a.__priority)
              .map((item: any) => ({
                id: item.id,
                address: item.address,
                buildingName: item.buildingName,
                postalCode: item.postalCode,
              }));
            if (isAppendingRef.current) {
              setResults((prev) => [...prev, ...mapped]);
            } else {
              setResults(mapped);
            }
            paginationRef.current = pagination;
            const more = Boolean(
              pagination &&
                (pagination.hasNextPage === true ||
                  (typeof pagination.current === 'number' &&
                    typeof pagination.last === 'number' &&
                    pagination.current < pagination.last))
            );
            setHasMore(more);
          } else if (!isAppendingRef.current) {
            setResults([]);
            setHasMore(false);
          }
          setSearching(false);
          setLoadingMore(false);
        },
        { page: 1, size: 10 }
      );
    } catch {
      setSearching(false);
    }
  }, [keyword, kakaoReady]);

  const handleScroll = React.useCallback(
    (e: React.UIEvent<HTMLUListElement>) => {
      if (!hasMore || loadingMore) return;
      const el = e.currentTarget;
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
      if (nearBottom && paginationRef.current && typeof paginationRef.current.nextPage === 'function') {
        isAppendingRef.current = true;
        setLoadingMore(true);
        paginationRef.current.nextPage();
      }
    },
    [hasMore, loadingMore]
  );

  React.useEffect(() => {
    let cancelled = false;
    const loadKakao = () =>
      new Promise<void>((resolve, reject) => {
        if (typeof window === 'undefined') return reject(new Error('no-window'));
        const w: any = window;
        if (w.kakao?.maps?.services) return resolve();
        const onReady = () => resolve();
        if (w.kakao?.maps) {
          w.kakao.maps.load(onReady);
          return;
        }
        const key = (import.meta as any)?.env?.VITE_KAKAO_JS_KEY as string;
        console.log({ key });
        if (!key) return reject(new Error('Missing VITE_KAKAO_JS_KEY'));
        // singleton loader
        if ((w as any).__kakaoLoaderPromise) return (w as any).__kakaoLoaderPromise.then(() => resolve()).catch(reject);
        const scriptId = 'kakao-maps-sdk';
        const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
        if (existing) {
          (w as any).__kakaoLoaderPromise = new Promise<void>((res) => {
            const tryLoad = () => {
              const g: any = window;
              if (g?.kakao?.maps?.load) {
                g.kakao.maps.load(() => res());
              } else {
                setTimeout(tryLoad, 50);
              }
            };
            tryLoad();
          });
          (w as any).__kakaoLoaderPromise.then(resolve).catch(reject);
          return;
        }
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services&autoload=false`;
        script.async = true;
        script.onload = () => {
          try {
            (w as any).__kakaoLoaderPromise = new Promise<void>((res) => {
              const tryLoad = () => {
                const g: any = window;
                if (g?.kakao?.maps?.load) {
                  g.kakao.maps.load(() => res());
                } else {
                  setTimeout(tryLoad, 50);
                }
              };
              tryLoad();
            });
            (w as any).__kakaoLoaderPromise.then(resolve).catch(reject);
          } catch (e) {
            reject(e as any);
          }
        };
        script.onerror = () => reject(new Error('Kakao SDK load failed'));
        document.head.appendChild(script);
      });

    loadKakao()
      .then(() => {
        if (!cancelled) setKakaoReady(true);
      })
      .catch((e) => {
        console.error('[kakao] load error', e);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  console.log(import.meta.env.VITE_KAKAO_JS_KEY);

  return (
    <div className='space-y-3 px-5 pb-5'>
      {!kakaoReady ? (
        <p className='text-[12px] text-[#6b7785]'>지도를 불러오는 중입니다…</p>
      ) : (
        <>
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
            <ul
              ref={listRef}
              onScroll={handleScroll}
              className='max-h-56 space-y-2 overflow-y-auto rounded-2xl bg-white px-3 py-2 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)]'>
              {results.map((item) => (
                <li key={item.id}>
                  <button
                    type='button'
                    className='w-full rounded-xl px-3 py-2 text-left text-[13px] text-[#1b1b1b] transition-colors hover:bg-[#f5f7f9]'
                    onClick={() => onPick(item)}>
                    <p className='font-semibold'>{item.address}</p>
                    {item.buildingName ? <p className='text-[12px] text-[#667085]'>{item.buildingName}</p> : null}
                  </button>
                </li>
              ))}
              {loadingMore ? <li className='py-2 text-center text-[12px] text-[#6b7785]'>더 불러오는 중…</li> : null}
            </ul>
          ) : searching ? (
            <p className='text-[12px] text-[#6b7785]'>주소를 검색 중입니다…</p>
          ) : null}
        </>
      )}
    </div>
  );
}

function KakaoPickOnMap({
  onPick,
}: {
  onPick(item: { id: string; address: string; buildingName?: string; postalCode?: string }): void;
}) {
  const [kakaoReady, setKakaoReady] = React.useState<boolean>(
    typeof window !== 'undefined' && Boolean((window as any).kakao?.maps?.services)
  );
  const [displayAddress, setDisplayAddress] = React.useState<string>('');
  const [postalCode, setPostalCode] = React.useState<string | undefined>(undefined);
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<any>(null);
  const geocoderRef = React.useRef<any>(null);
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const loadKakao = () =>
      new Promise<void>((resolve, reject) => {
        if (typeof window === 'undefined') return reject(new Error('no-window'));
        const w: any = window;
        if (w.kakao?.maps?.services) return resolve();
        const onReady = () => resolve();
        if (w.kakao?.maps) {
          w.kakao.maps.load(onReady);
          return;
        }
        const key = (import.meta as any)?.env?.VITE_KAKAO_JS_KEY as string;
        if (!key) return reject(new Error('Missing VITE_KAKAO_JS_KEY'));
        if ((w as any).__kakaoLoaderPromise) return (w as any).__kakaoLoaderPromise.then(() => resolve()).catch(reject);
        const scriptId = 'kakao-maps-sdk';
        const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
        if (existing) {
          (w as any).__kakaoLoaderPromise = new Promise<void>((res) => {
            const tryLoad = () => {
              const g: any = window;
              if (g?.kakao?.maps?.load) {
                g.kakao.maps.load(() => res());
              } else {
                setTimeout(tryLoad, 50);
              }
            };
            tryLoad();
          });
          (w as any).__kakaoLoaderPromise.then(resolve).catch(reject);
          return;
        }
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services&autoload=false`;
        script.async = true;
        script.onload = () => {
          try {
            (w as any).__kakaoLoaderPromise = new Promise<void>((res) => {
              const tryLoad = () => {
                const g: any = window;
                if (g?.kakao?.maps?.load) {
                  g.kakao.maps.load(() => res());
                } else {
                  setTimeout(tryLoad, 50);
                }
              };
              tryLoad();
            });
            (w as any).__kakaoLoaderPromise.then(resolve).catch(reject);
          } catch (e) {
            reject(e as any);
          }
        };
        script.onerror = () => reject(new Error('Kakao SDK load failed'));
        document.head.appendChild(script);
      });

    loadKakao()
      .then(() => {
        if (!cancelled) setKakaoReady(true);
      })
      .catch((e) => {
        console.error('[kakao] load error', e);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const updateAddressFromCenter = React.useCallback(() => {
    try {
      const w: any = window;
      if (!mapRef.current || !w?.kakao?.maps?.services) return;
      const geocoder = (geocoderRef.current ||= new w.kakao.maps.services.Geocoder());
      const center = mapRef.current.getCenter();
      geocoder.coord2Address(center.getLng(), center.getLat(), (res: any, status: any) => {
        if (status === w.kakao.maps.services.Status.OK && res && res.length > 0) {
          const item = res[0];
          const road = item.road_address?.address_name as string | undefined;
          const jibun = item.address?.address_name as string | undefined;
          const zoneNo = item.road_address?.zone_no as string | undefined;
          setDisplayAddress(road || jibun || '주소를 가져올 수 없어요');
          setPostalCode(zoneNo);
        }
      });
    } catch {
      // noop
    }
  }, []);

  React.useEffect(() => {
    if (!kakaoReady || !mapContainerRef.current) return;
    const w: any = window;
    const kakao = w.kakao;
    const defaultCenter = new kakao.maps.LatLng(37.5665, 126.978); // 서울시청
    const map = new kakao.maps.Map(mapContainerRef.current, {
      center: defaultCenter,
      level: 3,
    });
    mapRef.current = map;

    const handleCenterChanged = () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        updateAddressFromCenter();
      }, 250);
    };
    kakao.maps.event.addListener(map, 'center_changed', handleCenterChanged);
    kakao.maps.event.addListener(map, 'dragend', handleCenterChanged);

    // 현재 위치로 이동 시도
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
          map.setCenter(loc);
          updateAddressFromCenter();
        },
        () => {
          updateAddressFromCenter();
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      updateAddressFromCenter();
    }

    return () => {
      try {
        kakao.maps.event.removeListener(map, 'center_changed', handleCenterChanged);
        kakao.maps.event.removeListener(map, 'dragend', handleCenterChanged);
      } catch {
        // ignore
      }
    };
  }, [kakaoReady, updateAddressFromCenter]);

  const handleConfirm = React.useCallback(() => {
    const w: any = window;
    if (!mapRef.current || !w?.kakao?.maps) return;
    const center = mapRef.current.getCenter();
    const lat = center.getLat();
    const lng = center.getLng();
    onPick({ id: `${lat},${lng}`, address: displayAddress, postalCode });
  }, [displayAddress, postalCode, onPick]);

  return (
    <div className='space-y-3 px-5 pb-5'>
      {!kakaoReady ? (
        <p className='text-[12px] text-[#6b7785]'>지도를 불러오는 중입니다…</p>
      ) : (
        <>
          <div className='relative h-56 rounded-2xl overflow-hidden'>
            <div ref={mapContainerRef} className='absolute inset-0 bg-[#e2f6f5]' />
            <div className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full z-50'>
              <div className='text-2xl'>📍</div>
            </div>
          </div>
          <div className='rounded-xl bg-white px-3 py-2 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)]'>
            <p className='text-[12px] text-[#1b1b1b]'>도로명 주소</p>
            <p className='text-[13px] font-semibold text-[#1b1b1b]'>{displayAddress || '주소를 확인 중입니다…'}</p>
            {postalCode ? <p className='text-[11px] text-[#6b7785]'>우편번호 {postalCode}</p> : null}
          </div>
          <div className='flex justify-end'>
            <Button
              type='button'
              className='h-9 rounded-full bg-[#2ac1bc] px-4 text-[12px] font-semibold text-white hover:bg-[#1ba7a1]'
              onClick={handleConfirm}>
              선택 완료
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function DetailAddressForm({
  base,
  presetType = 'custom',
  onSubmit,
}: {
  base: { id: string; address: string; buildingName?: string; postalCode?: string };
  presetType?: 'home' | 'company' | 'custom';
  onSubmit: (values: {
    address: { address: string; buildingName?: string; postalCode?: string };
    unitNumber?: string;
    type: 'home' | 'company' | 'custom';
  }) => void;
}) {
  const [unitNumber, setUnitNumber] = React.useState<string>('');
  const [type, setType] = React.useState<'home' | 'company' | 'custom'>(presetType);
  const mapRef = React.useRef<HTMLDivElement | null>(null);
  const kakaoMapRef = React.useRef<any>(null);
  const [kakaoReady, setKakaoReady] = React.useState<boolean>(
    typeof window !== 'undefined' && Boolean((window as any).kakao?.maps)
  );

  React.useEffect(() => {
    let cancelled = false;
    const loadKakao = () =>
      new Promise<void>((resolve, reject) => {
        const w: any = window;
        if (w?.kakao?.maps) return resolve();
        const key = (import.meta as any)?.env?.VITE_KAKAO_JS_KEY as string;
        if (!key) return reject(new Error('Missing VITE_KAKAO_JS_KEY'));
        if ((w as any).__kakaoLoaderPromise) return (w as any).__kakaoLoaderPromise.then(() => resolve()).catch(reject);
        const existing = document.getElementById('kakao-maps-sdk') as HTMLScriptElement | null;
        if (existing) {
          (w as any).__kakaoLoaderPromise = new Promise<void>((res) => {
            const tryLoad = () => {
              const g: any = window;
              if (g?.kakao?.maps?.load) {
                g.kakao.maps.load(() => res());
              } else {
                setTimeout(tryLoad, 50);
              }
            };
            tryLoad();
          });
          return (w as any).__kakaoLoaderPromise.then(resolve).catch(reject);
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
                if (g?.kakao?.maps?.load) {
                  g.kakao.maps.load(() => res());
                } else {
                  setTimeout(tryLoad, 50);
                }
              };
              tryLoad();
            });
            (w as any).__kakaoLoaderPromise.then(resolve).catch(reject);
          } catch (e) {
            reject(e as any);
          }
        };
        script.onerror = () => reject(new Error('Kakao SDK load failed'));
        document.head.appendChild(script);
      });

    loadKakao()
      .then(() => {
        if (!cancelled) setKakaoReady(true);
      })
      .catch(() => {
        // ignore in preview
      });

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
        level: 4,
      });
      kakaoMapRef.current = map;

      if (base?.address) {
        // 주소 텍스트를 좌표로 변환해 미리보기 위치로 이동
        if (w?.kakao?.maps?.services) {
          const geocoder = new w.kakao.maps.services.Geocoder();
          geocoder.addressSearch(base.address, (res: any, status: any) => {
            if (status === w.kakao.maps.services.Status.OK && res && res[0]) {
              const { x, y } = res[0];
              const latlng = new kakao.maps.LatLng(Number(y), Number(x));
              map.setCenter(latlng);
            }
          });
        }
      }
    } catch {
      // ignore
    }
  }, [kakaoReady, base?.address]);

  return (
    <div className='space-y-4 px-5 pb-5'>
      <div className='space-y-2 rounded-2xl bg-white px-4 py-3 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)]'>
        <p className='text-[12px] font-semibold text-[#1b1b1b]'>지도 미리보기</p>
        <div ref={mapRef} className='h-32 rounded-xl bg-[#e2f6f5]' />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='unit-number-detail' className='text-[12px] font-semibold text-[#1b1b1b]'>
          상세 주소
        </Label>
        <Input
          id='unit-number-detail'
          placeholder='예) 101동 1203호'
          className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
          value={unitNumber}
          onChange={(e) => setUnitNumber(e.target.value)}
        />
      </div>
      <div className='space-y-2'>
        <p className='text-[12px] font-semibold text-[#1b1b1b]'>주소 유형</p>
        <RadioGroup value={type} onValueChange={(v) => setType(v as any)} className='grid grid-cols-3 gap-2'>
          <div className='flex items-center gap-2 rounded-xl border border-[#dbe4ec] px-3 py-2'>
            <RadioGroupItem value='home' id='type-home' />
            <Label htmlFor='type-home' className='text-[12px]'>
              집
            </Label>
          </div>
          <div className='flex items-center gap-2 rounded-xl border border-[#dbe4ec] px-3 py-2'>
            <RadioGroupItem value='company' id='type-company' />
            <Label htmlFor='type-company' className='text-[12px]'>
              회사
            </Label>
          </div>
          <div className='flex items-center gap-2 rounded-xl border border-[#dbe4ec] px-3 py-2'>
            <RadioGroupItem value='custom' id='type-custom' />
            <Label htmlFor='type-custom' className='text-[12px]'>
              기타
            </Label>
          </div>
        </RadioGroup>
      </div>
      <div className='flex justify-end'>
        <Button
          type='button'
          className='h-9 rounded-full bg-[#2ac1bc] px-4 text-[12px] font-semibold text-white hover:bg-[#1ba7a1]'
          onClick={() =>
            onSubmit({
              address: base,
              unitNumber: unitNumber.trim() || undefined,
              type,
            })
          }>
          완료
        </Button>
      </div>
    </div>
  );
}
