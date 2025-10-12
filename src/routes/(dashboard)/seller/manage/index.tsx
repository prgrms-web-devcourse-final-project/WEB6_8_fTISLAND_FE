import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Home, Package, Receipt, ShieldAlert, User } from 'lucide-react';
import { SellerHeader } from '../_components/SellerHeader';
import { useStoreDetailsStore } from '@/store/storeDetails';
import { useDeleteStore, useToggleStoreStatus, useUpdateStore, useGetOrdersHistoryInfinite } from '@/api/generated';
import type { StoreUpdateRequest } from '@/api/generated/model/storeUpdateRequest';
import { toast } from 'sonner';
import type { ManagedProduct } from '../_components/ProductManager';
import { ProductManager } from '../_components/ProductManager';
import { useSearchProductsInfinite } from '@/api/generated';
import type { SearchProductsParams } from '@/api/generated/model/searchProductsParams';
// import { OrderManager } from '../_components/OrderManager';
import { SettlementManager } from '../_components/SettlementManager';
import { SETTLEMENTS as initialSettlements } from './_data/settlements';
import { SellerFooterNav } from '../_components/SellerFooterNav';
import { useAuthStore } from '@/store/auth';
import KakaoAddressSearch from '@/components/address/KakaoAddressSearch';
import { Controller, useForm } from 'react-hook-form';
import {
  useSellerProfileManage,
  type BusinessInfoFormValues,
  type AccountInfoFormValues,
} from './_hooks/useSellerProfileManage';

export const Route = createFileRoute('/(dashboard)/seller/manage/')({
  validateSearch: (search: Record<string, unknown>) => {
    const tab = typeof search.tab === 'string' ? (search.tab as TabKey) : 'store';
    return { tab: NAV_ITEMS.some((item) => item.key === tab) ? tab : 'store' };
  },
  component: RouteComponent,
});

const NAV_ITEMS = [
  { key: 'store', icon: Home, label: '상점 관리' },
  { key: 'product', icon: Package, label: '상품 관리' },
  { key: 'order', icon: ShieldAlert, label: '주문 관리' },
  { key: 'settlement', icon: Receipt, label: '정산 관리' },
] as const;

type TabKey = (typeof NAV_ITEMS)[number]['key'];

export const FOOTER_ITEMS = [
  { icon: Home, label: '홈' },
  { icon: Package, label: '관리', active: true },
  { icon: User, label: '마이뭐든' },
];

export const STORE_INFO = {
  name: '골목 안 소담상회',
  phone: '010-1234-5678',
  address: '서울 성북구 동소문로25길 12 1층',
  status: true,
};

const INITIAL_PRODUCTS: ManagedProduct[] = [
  {
    id: 'prd-1',
    name: '골목 반찬 세트',
    price: 8900,
    quantity: 12,
    thumbnail: '',
  },
  {
    id: 'prd-2',
    name: '마을 떡볶이 2인분',
    price: 6500,
    quantity: 8,
    thumbnail: '',
  },
];

export const SETTLEMENTS = initialSettlements;

function RouteComponent() {
  const storeIdFromAuth = useAuthStore((s) => s.storeId ?? s.currentActiveProfileId);
  const storeId = Number.isFinite(storeIdFromAuth as any) ? (storeIdFromAuth as number) : 0;
  const toggleStoreStatusMutation = useToggleStoreStatus();
  const deleteStoreMutation = useDeleteStore();
  const updateStoreMutation = useUpdateStore({
    mutation: {
      onSuccess: () => toast.success('상점 정보가 저장되었어요.'),
      onError: () => toast.error('저장에 실패했어요. 잠시 후 다시 시도해 주세요.'),
    },
  });

  const handleUpdateField = React.useCallback(
    (partial: StoreUpdateRequest) => {
      updateStoreMutation.mutate({ storeId, data: partial });
    },
    [storeId, updateStoreMutation]
  );
  const navigate = useNavigate();
  const { tab: initialTab } = Route.useSearch();
  const [isOpen, setIsOpen] = React.useState(STORE_INFO.status);
  const [activeTab, setActiveTab] = React.useState<TabKey>(initialTab);
  const [_, setProducts] = React.useState<ManagedProduct[]>(INITIAL_PRODUCTS);
  // const [orders] = React.useState<ManagedOrder[]>(INITIAL_ORDERS);
  const selectedStore = useStoreDetailsStore((s) => s.selectedStore);

  const handleAddProduct = React.useCallback((product: ManagedProduct) => {
    setProducts((prev) => [product, ...prev]);
  }, []);

  const handleUpdateProduct = React.useCallback((productId: string, nextProduct: ManagedProduct) => {
    setProducts((prev) => prev.map((item) => (item.id === productId ? nextProduct : item)));
  }, []);

  const handleDeleteProduct = React.useCallback((productId: string) => {
    setProducts((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const handleDeleteStore = React.useCallback(() => {
    deleteStoreMutation.mutate(
      { storeId },
      {
        onSuccess: () => {
          useStoreDetailsStore.getState().clear();
          toast.success('상점이 삭제되었어요.');
          navigate({ to: '/seller' });
        },
        onError: () => {
          toast.error('상점 삭제에 실패했어요. 잠시 후 다시 시도해 주세요.');
        },
      }
    );
  }, [deleteStoreMutation, storeId, navigate]);

  const setTab = React.useCallback(
    (next: TabKey) => {
      setActiveTab(next);
      navigate({ to: '/seller/manage', search: { tab: next } });
    },
    [navigate]
  );

  return (
    <div className='flex min-h-[100dvh] w-full flex-col bg-[#2ac1bc] text-white'>
      <SellerHeader
        nickname='김사장'
        storeName={selectedStore?.name || STORE_INFO.name}
        address={selectedStore?.roadAddr || STORE_INFO.address}
        description={selectedStore?.description}
        profileImageUrl={selectedStore?.imageUrl || ''}
      />
      <header className='px-4 pb-6 pt-4 sm:px-6'>
        <nav className='grid grid-cols-4 gap-3 text-[11px] font-semibold sm:text-[12px]'>
          {NAV_ITEMS.map(({ key, icon: Icon, label }) => {
            const isActive = key === activeTab;
            return (
              <button
                key={label}
                type='button'
                onClick={() => setTab(key)}
                aria-pressed={isActive}
                className={
                  isActive
                    ? 'flex flex-col items-center gap-2.5 rounded-[1rem] border border-white/40 bg-white px-4 py-5 text-[#1b1b1b] shadow-[0_20px_44px_-24px_rgba(15,23,42,0.55)] transition-all duration-200'
                    : 'flex flex-col items-center gap-2.5 rounded-[1rem] border border-transparent bg-white/10 px-4 py-5 text-white/75 transition-all duration-200 hover:border-white/30 hover:bg-white/15 hover:text-white'
                }>
                <span
                  className={
                    isActive
                      ? 'rounded-full bg-[#1ba7a1]/15 p-2 text-[#1ba7a1]'
                      : 'rounded-full bg-white/12 p-2 text-white/80'
                  }>
                  <Icon className='size-4' aria-hidden />
                </span>
                <span className={isActive ? 'leading-tight text-[12px]' : 'leading-tight'}>{label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <main className='flex-1 space-y-4 overflow-y-auto rounded-t-[1.5rem] bg-[#f8f9fa] px-4 pb-28 pt-6 text-[#1b1b1b] outline outline-[#2ac1bc]/15 sm:space-y-5 sm:rounded-t-[1.75rem] sm:px-6 sm:pb-32 sm:pt-7'>
        {activeTab === 'store' ? (
          <div className='space-y-4'>
            <StoreManagementCard
              isOpen={isOpen}
              onToggle={(next) => {
                const prev = isOpen;
                setIsOpen(next);
                toggleStoreStatusMutation.mutate(
                  { storeId },
                  {
                    onSuccess: () => {
                      toast.success(next ? '영업 상태로 전환됐어요.' : '휴업 상태로 전환됐어요.');
                    },
                    onError: () => {
                      setIsOpen(prev);
                      toast.error('상태 변경에 실패했어요. 잠시 후 다시 시도해 주세요.');
                    },
                  }
                );
              }}
              onUpdateField={handleUpdateField}
              onDelete={handleDeleteStore}
            />
            <SellerBusinessAndAccountForms />
          </div>
        ) : null}

        {activeTab === 'product' ? (
          <ProductListWithInfinite
            onAdd={handleAddProduct}
            onUpdate={handleUpdateProduct}
            onDelete={handleDeleteProduct}
          />
        ) : null}

        {activeTab === 'order' ? <OrderHistorySection /> : null}

        {activeTab === 'settlement' ? <SettlementManager summaries={SETTLEMENTS} /> : null}

        {activeTab !== 'store' && activeTab !== 'product' && activeTab !== 'order' && activeTab !== 'settlement' ? (
          <Card className='border-none bg-white text-center text-[13px] text-[#6b7785] shadow-[0_24px_60px_-32px_rgba(15,23,42,0.28)]'>
            <CardContent className='py-12'>해당 탭의 세부 UI는 추후 구현 예정입니다.</CardContent>
          </Card>
        ) : null}
      </main>
      <SellerFooterNav active='manage' />
    </div>
  );
}

function SellerBusinessAndAccountForms() {
  const { profile, isLoading, isError, submitBusinessInfo, submitAccountInfo, isUpdatingBusiness, isUpdatingAccount } =
    useSellerProfileManage();

  const { control: controlBiz, handleSubmit: handleSubmitBiz } = useForm<BusinessInfoFormValues>({
    mode: 'onChange',
    values: {
      businessName: profile?.businessName ?? '',
      businessPhoneNumber: profile?.businessPhoneNumber ?? '',
    },
  });

  const { control: controlAcc, handleSubmit: handleSubmitAcc } = useForm<AccountInfoFormValues>({
    mode: 'onChange',
    values: {
      bankName: profile?.bankName ?? '',
      accountNumber: profile?.accountNumber ?? '',
      accountHolder: profile?.accountHolder ?? '',
    },
  });

  if (isLoading) {
    return (
      <Card className='border-none bg-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.28)]'>
        <CardContent className='space-y-3 px-4 py-4'>
          <div className='h-4 w-40 animate-pulse rounded bg-slate-200' />
          <div className='h-4 w-64 animate-pulse rounded bg-slate-200' />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className='border-none bg-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.28)]'>
        <CardContent className='px-4 py-4 text-[12px] text-[#ef4444]'>판매자 프로필을 불러오지 못했어요.</CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      <Card className='border-none bg-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.28)]'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>사업자 정보</CardTitle>
          <CardDescription className='text-[12px] text-[#6b7785]'>
            사업자명과 대표 전화번호를 관리하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          <form
            className='space-y-3'
            onSubmit={handleSubmitBiz((v) => {
              submitBusinessInfo({
                businessName: (v.businessName || '').trim() || undefined,
                businessPhoneNumber: (v.businessPhoneNumber || '').trim() || undefined,
              });
            })}>
            <div className='flex flex-col gap-1'>
              <Label className='text-[12px] font-semibold text-[#6b7785]'>사업자명</Label>
              <Controller
                control={controlBiz}
                name='businessName'
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder='예) 뭐든슈퍼'
                    className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
                  />
                )}
              />
            </div>
            <div className='flex flex-col gap-1'>
              <Label className='text-[12px] font-semibold text-[#6b7785]'>사업자 전화번호</Label>
              <Controller
                control={controlBiz}
                name='businessPhoneNumber'
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder='010-1234-5678'
                    className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
                  />
                )}
              />
            </div>
            <div className='flex justify-end pt-1'>
              <Button type='submit' disabled={isUpdatingBusiness} className='h-9 rounded-full bg-[#1ba7a1] text-white'>
                {isUpdatingBusiness ? '저장 중…' : '저장'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className='border-none bg-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.28)]'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>정산 계좌</CardTitle>
          <CardDescription className='text-[12px] text-[#6b7785]'>은행, 계좌번호, 예금주를 관리하세요.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          <form
            className='space-y-3'
            onSubmit={handleSubmitAcc((v) => {
              submitAccountInfo({
                bankName: (v.bankName || '').trim() || undefined,
                accountNumber: (v.accountNumber || '').trim() || undefined,
                accountHolder: (v.accountHolder || '').trim() || undefined,
              });
            })}>
            <div className='flex flex-col gap-1'>
              <Label className='text-[12px] font-semibold text-[#6b7785]'>은행명</Label>
              <Controller
                control={controlAcc}
                name='bankName'
                render={({ field }) => (
                  <Input {...field} placeholder='예) KB국민' className='h-9 rounded-xl border-[#dbe4ec] text-[13px]' />
                )}
              />
            </div>
            <div className='flex flex-col gap-1'>
              <Label className='text-[12px] font-semibold text-[#6b7785]'>계좌번호</Label>
              <Controller
                control={controlAcc}
                name='accountNumber'
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder='하이픈 없이 숫자만'
                    className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
                  />
                )}
              />
            </div>
            <div className='flex flex-col gap-1'>
              <Label className='text-[12px] font-semibold text-[#6b7785]'>예금주</Label>
              <Controller
                control={controlAcc}
                name='accountHolder'
                render={({ field }) => (
                  <Input {...field} placeholder='예) 홍길동' className='h-9 rounded-xl border-[#dbe4ec] text-[13px]' />
                )}
              />
            </div>
            <div className='flex justify-end pt-1'>
              <Button type='submit' disabled={isUpdatingAccount} className='h-9 rounded-full bg-[#1ba7a1] text-white'>
                {isUpdatingAccount ? '저장 중…' : '저장'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
function OrderHistorySection() {
  const storeIdFromAuth = useAuthStore((s) => s.storeId ?? s.currentActiveProfileId);
  const effectiveStoreId = Number.isFinite(storeIdFromAuth as any) ? (storeIdFromAuth as number) : undefined;
  const query = useGetOrdersHistoryInfinite(
    (effectiveStoreId ?? 0) as number,
    { size: 10 } as any,
    {
      query: {
        enabled: !!effectiveStoreId,
        getNextPageParam: (lastPage: any) => lastPage?.data?.content?.nextPageToken ?? undefined,
        refetchOnWindowFocus: false,
      },
    } as any
  );

  const items = React.useMemo(() => {
    const pages = (query.data?.pages ?? []) as any[];
    const list = pages.flatMap((p) => (p?.data?.content?.content ?? []) as any[]);
    return list
      .filter((o) => o?.status === 'COMPLETED' || o?.status === 'REJECTED')
      .map((o) => {
        const first = o?.orderItems?.[0]?.product?.name ?? '주문 상품';
        const count = Math.max(0, (o?.orderItems?.length ?? 0) - 1);
        const title = count > 0 ? `${first} 외 ${count}건` : first;
        const amount = Number(o?.totalPrice ?? 0);
        const createdAt = o?.createdAt as string | undefined;
        const d = createdAt ? new Date(createdAt) : undefined;
        const two = (n: number) => String(n).padStart(2, '0');
        const dateText = d
          ? `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`
          : '';
        const statusLabel = o?.status === 'COMPLETED' ? '배달 완료' : '거절';
        return { id: o?.id, title, amount, dateText, statusLabel };
      });
  }, [query.data]);

  if (!effectiveStoreId) {
    return (
      <Card className='border-none bg-white shadow-[0_16px_48px_-32px_rgba(15,23,42,0.35)]'>
        <CardContent className='px-4 py-6 text-center text-[13px] text-[#6b7785]'>상점이 없습니다.</CardContent>
      </Card>
    );
  }

  if (query.isLoading) {
    return (
      <section className='space-y-3'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className='border-none bg-white shadow-[0_16px_48px_-32px_rgba(15,23,42,0.35)]'>
            <CardContent className='space-y-3 px-4 py-4'>
              <div className='h-4 w-32 animate-pulse rounded bg-slate-200' />
              <div className='h-4 w-60 animate-pulse rounded bg-slate-200' />
            </CardContent>
          </Card>
        ))}
      </section>
    );
  }

  if (query.isError) {
    return (
      <Card className='border-none bg-white shadow-[0_16px_48px_-32px_rgba(15,23,42,0.35)]'>
        <CardContent className='px-4 py-4 text-[12px] text-[#ef4444]'>주문 내역을 불러오지 못했어요.</CardContent>
      </Card>
    );
  }

  return (
    <section className='space-y-3'>
      {items.length === 0 ? (
        <Card className='border-none bg-white shadow-[0_16px_48px_-32px_rgba(15,23,42,0.35)]'>
          <CardContent className='px-4 py-6 text-center text-[13px] text-[#6b7785]'>
            주문 내역이 비어 있어요.
          </CardContent>
        </Card>
      ) : (
        items.map((it) => (
          <Card key={it.id} className='border-none bg-white shadow-[0_16px_48px_-32px_rgba(15,23,42,0.35)]'>
            <CardContent className='flex items-center justify-between gap-3 px-4 py-3'>
              <div className='flex-1'>
                <p className='text-[14px] font-semibold text-[#1b1b1b]'>{it.title}</p>
                <p className='text-[12px] text-[#6b7785]'>{it.dateText}</p>
              </div>
              <div className='text-right'>
                <p className='text-[12px] font-semibold text-[#1b1b1b]'>
                  ₩ {new Intl.NumberFormat('ko-KR').format(it.amount)}
                </p>
                <p className='text-[11px] text-[#475569]'>{it.statusLabel}</p>
              </div>
            </CardContent>
          </Card>
        ))
      )}
      {query.hasNextPage ? (
        <div className='flex justify-center pt-1'>
          <Button
            variant='outline'
            size='sm'
            className='rounded-full'
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}>
            {query.isFetchingNextPage ? '불러오는 중…' : '더 보기'}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function ProductListWithInfinite({
  onAdd,
  onUpdate,
  onDelete,
}: {
  onAdd(product: ManagedProduct): void;
  onUpdate(productId: string, product: ManagedProduct): void;
  onDelete(productId: string): void;
}) {
  const navigate = useNavigate();
  const storeIdFromAuth = useAuthStore((s) => s.storeId ?? s.currentActiveProfileId);
  const effectiveStoreId = Number.isFinite(storeIdFromAuth as any) ? (storeIdFromAuth as number) : undefined;
  const params: SearchProductsParams = { request: { limit: 10 } };
  const query = useSearchProductsInfinite<any>((effectiveStoreId ?? 0) as number, params, {
    query: {
      enabled: !!effectiveStoreId,
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage: any) => lastPage?.data?.content?.nextPageToken ?? undefined,
      select: (data) => data,
      staleTime: 10_000,
      refetchOnWindowFocus: false,
    },
  });

  const items: ManagedProduct[] = React.useMemo(() => {
    const pages = (query.data?.pages ?? []) as any[];
    // 우선순위: data.content.products → data.content.content → []
    const list = pages.flatMap((p) => {
      const d = (p as any)?.data?.content;
      if (!d) return [] as any[];
      const products = (d as any).products as any[] | undefined;
      const content = (d as any).content as any[] | undefined;
      return (products ?? content ?? []) as any[];
    });
    return list.map((p: any) => ({
      // 백엔드 응답의 식별자 필드 우선 사용 (productId)
      id: String(p.productId ?? p.id ?? ''),
      name: p.name ?? '',
      price: Number(p.price ?? 0),
      quantity: Number(p.stock?.quantity ?? 0),
      thumbnail: p.imageUrl ?? '',
    }));
  }, [query.data]);

  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const scrollRootRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const root = document.querySelector('main');
    scrollRootRef.current = (root as HTMLDivElement) || null;
    const el = sentinelRef.current;
    if (!root || !el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
            query.fetchNextPage();
          }
        });
      },
      { root: scrollRootRef.current, rootMargin: '120px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  if (!effectiveStoreId) {
    return (
      <Card className='border-none bg-white shadow-[0_16px_48px_-32px_rgba(15,23,42,0.35)]'>
        <CardContent className='space-y-3 px-4 py-6 text-center'>
          <p className='text-[13px] text-[#6b7785]'>등록된 상점이 없습니다.</p>
          <Button
            className='h-9 rounded-full bg-[#2ac1bc] px-4 text-[12px] font-semibold text-white hover:bg-[#1ba7a1]'
            onClick={() => navigate({ to: '/seller/create-store' })}>
            상점 만들기
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <ProductManager products={items} onAdd={onAdd} onUpdate={onUpdate} onDelete={onDelete} />
      <div ref={sentinelRef} />
      {query.isFetchingNextPage ? (
        <p className='py-2 text-center text-[12px] text-white/80'>상품을 더 불러오는 중…</p>
      ) : null}
    </>
  );
}

function StoreManagementCard({
  isOpen,
  onToggle,
  onUpdateField,
  onDelete,
}: {
  isOpen: boolean;
  onToggle(value: boolean): void;
  onUpdateField(partial: StoreUpdateRequest): void;
  onDelete(): void;
}) {
  const selected = useStoreDetailsStore.getState().selectedStore;
  const [editOpen, setEditOpen] = React.useState(false);
  const [editField, setEditField] = React.useState<'name' | 'roadAddr' | 'description' | null>(null);
  const [editLabel, setEditLabel] = React.useState('');
  const [editValue, setEditValue] = React.useState('');
  const [editLat, setEditLat] = React.useState<number | ''>('');
  const [editLng, setEditLng] = React.useState<number | ''>('');

  const startEdit = React.useCallback((field: 'name' | 'roadAddr' | 'description', label: string, value: string) => {
    setEditField(field);
    setEditLabel(label);
    setEditValue(value ?? '');
    setEditLat('');
    setEditLng('');
    setEditOpen(true);
  }, []);

  const saveEdit = React.useCallback(() => {
    if (!editField) return;
    const partial: StoreUpdateRequest = { [editField]: editValue } as StoreUpdateRequest;
    if (editField === 'roadAddr') {
      if (editLat !== '' && editLng !== '') {
        partial.lat = Number(editLat);
        partial.lng = Number(editLng);
      }
    }
    onUpdateField(partial);
    setEditOpen(false);
  }, [editField, editValue, editLat, editLng, onUpdateField]);
  return (
    <Card className='border-none bg-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.28)]'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-[15px] font-semibold text-[#1b1b1b]'>상점 기본 정보</CardTitle>
        <CardDescription className='text-[12px] text-[#6b7785]'>
          상호명, 연락처, 주소 정보를 최신 상태로 유지하세요.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-5'>
        <InfoRow
          label='상점 이름'
          value={selected?.name || ''}
          onEdit={() => startEdit('name', '상점 이름', selected?.name || '')}
        />
        <InfoRow
          label='상점 주소'
          value={selected?.roadAddr || ''}
          onEdit={() => startEdit('roadAddr', '상점 주소', selected?.roadAddr || '')}
        />
        <InfoRow
          label='상점 소개'
          value={selected?.description || ''}
          onEdit={() => startEdit('description', '상점 소개', selected?.description || '')}
        />
        <div className='flex flex-col gap-3 rounded-2xl bg-[#f5f7f9] px-3 py-3'>
          <p className='text-[13px] font-semibold text-[#1b1b1b]'>상점 영업 상태</p>
          <div className='flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm'>
            <div>
              <p className='text-[12px] font-semibold text-[#1b1b1b]'>현재 상태</p>
              <p className='text-[12px] text-[#6b7785]'>
                {isOpen ? (
                  <span className='text-[10px]'>고객이 주문을 접수할 수 있는 상태입니다.</span>
                ) : (
                  '주문이 일시 중지된 상태입니다.'
                )}
              </p>
            </div>
            <Label className='flex items-center gap-2 text-[13px] font-semibold text-[#1b1b1b]'>
              <Switch
                checked={isOpen}
                onCheckedChange={onToggle}
                className='data-[state=checked]:bg-[#1ba7a1] data-[state=unchecked]:bg-[#cbd8e2]'
              />
              <span className='whitespace-nowrap'>{isOpen ? '영업중' : '휴업중'}</span>
            </Label>
          </div>
        </div>
        <div className='flex justify-end pt-1'>
          <DeleteStoreButton onDelete={onDelete} />
        </div>
      </CardContent>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className='mx-auto w-[90%] max-w-[26rem] rounded-2xl border-0 p-0 shadow-2xl'>
          <DialogHeader className='px-5 pb-3 pt-4'>
            <DialogTitle className='text-[15px] font-semibold text-[#1b1b1b]'>{editLabel} 수정</DialogTitle>
          </DialogHeader>
          <div className='space-y-3 px-5 pb-5'>
            <Label className='text-[12px] font-semibold'>{editLabel}</Label>
            {editField === 'roadAddr' ? (
              <>
                <KakaoAddressSearch
                  onPick={(item) => {
                    setEditValue(item.address);
                    setEditLat(item.lat);
                    setEditLng(item.lng);
                  }}
                />
                <div className='grid grid-cols-2 gap-2'>
                  <Input
                    readOnly
                    value={editLat as any}
                    placeholder='위도'
                    className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
                  />
                  <Input
                    readOnly
                    value={editLng as any}
                    placeholder='경도'
                    className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
                  />
                </div>
              </>
            ) : (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
                autoFocus
              />
            )}
            <div className='flex justify-end gap-2 pt-1'>
              <Button type='button' variant='outline' className='h-9 rounded-full' onClick={() => setEditOpen(false)}>
                취소
              </Button>
              <Button type='button' className='h-9 rounded-full bg-[#1ba7a1] text-white' onClick={saveEdit}>
                저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function InfoRow({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void }) {
  return (
    <div className='flex items-start justify-between gap-3 rounded-2xl bg-[#f5f7f9] px-3 py-2.5'>
      <div className='flex flex-col gap-1'>
        <span className='text-[12px] font-semibold text-[#6b7785]'>{label}</span>
        <span className='text-[13px] font-semibold text-[#1b1b1b]'>{value}</span>
      </div>
      {onEdit ? (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='h-8 rounded-full border border-[#cbd8e2] px-3 text-[12px] font-semibold text-[#1b1b1b] hover:bg-white'
          onClick={onEdit}>
          수정
        </Button>
      ) : null}
    </div>
  );
}

function DeleteStoreButton({ onDelete }: { onDelete(): void }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button
        type='button'
        variant='outline'
        className='h-9 rounded-full border-[#f87171] px-3 text-[12px] font-semibold text-[#f87171] hover:bg-[#f87171]/10'
        onClick={() => setOpen(true)}>
        상점 삭제
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='mx-auto w-[90%] max-w-[26rem] rounded-2xl border-0 p-0 shadow-2xl'>
          <DialogHeader className='px-5 pb-3 pt-4'>
            <DialogTitle className='text-[15px] font-semibold text-[#1b1b1b]'>정말 삭제하시겠습니까?</DialogTitle>
          </DialogHeader>
          <div className='space-y-3 px-5 pb-5'>
            <p className='text-[12px] text-[#6b7785]'>삭제 후에는 되돌릴 수 없습니다.</p>
            <div className='flex justify-end gap-2 pt-1'>
              <Button type='button' variant='outline' className='h-9 rounded-full' onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button
                type='button'
                className='h-9 rounded-full bg-[#ef4444] text-white hover:bg-[#dc2626]'
                onClick={() => {
                  onDelete();
                  setOpen(false);
                }}>
                삭제
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
