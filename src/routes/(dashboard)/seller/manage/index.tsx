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
import { useDeleteStore, useToggleStoreStatus, useUpdateStore } from '@/api/generated';
import type { StoreUpdateRequest } from '@/api/generated/model/storeUpdateRequest';
import { toast } from 'sonner';
import type { ManagedProduct } from '../_components/ProductManager';
import { ProductManager } from '../_components/ProductManager';
import type { ManagedOrder } from '../_components/OrderManager';
import { OrderManager } from '../_components/OrderManager';
import { SettlementManager } from '../_components/SettlementManager';
import { SETTLEMENTS as initialSettlements } from './_data/settlements';
import { SellerFooterNav } from '../_components/SellerFooterNav';

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

const INITIAL_ORDERS: ManagedOrder[] = [
  {
    id: '#ORD-1029',
    storeName: '골목 안 소담상회',
    orderedAt: '2025-09-28T14:22:00+09:00',
    expectedDeliveryTime: '2025-09-28T15:05:00+09:00',
    status: 'COMPLETED',
    address: '서울 성북구 보문로34길 12-1 (4층)',
    items: [
      {
        id: 'ord-1029-item-1',
        name: '골목 반찬 세트',
        quantity: 2,
        unitPrice: 8900,
      },
      {
        id: 'ord-1029-item-2',
        name: '마을 떡볶이 2인분',
        quantity: 1,
        unitPrice: 6500,
      },
    ],
    itemNote: '유리병 포장 제품이 있어요. 취급 시 주의해주세요.',
    customerRequest: '벨 누르지 말고 전화로 연락 주세요.',
    deliveryFee: 3000,
  },
  {
    id: '#ORD-1028',
    storeName: '골목 안 소담상회',
    orderedAt: '2025-09-27T11:15:00+09:00',
    expectedDeliveryTime: '2025-09-27T12:00:00+09:00',
    status: 'RIDER_ASSIGNED',
    address: '서울 종로구 창신동 44-2 (창신시장 내)',
    items: [
      {
        id: 'ord-1028-item-1',
        name: '마을 떡볶이 2인분',
        quantity: 1,
        unitPrice: 6500,
      },
      {
        id: 'ord-1028-item-2',
        name: '수제 어묵 꼬치',
        quantity: 3,
        unitPrice: 1500,
      },
    ],
    itemNote: '떡은 부드러운 식감으로 조리해주세요.',
    customerRequest: '',
    deliveryFee: 2500,
  },
  {
    id: '#ORD-1027',
    storeName: '골목 안 소담상회',
    orderedAt: '2025-09-26T19:40:00+09:00',
    expectedDeliveryTime: '2025-09-26T20:30:00+09:00',
    status: 'REJECTED',
    address: '서울 동대문구 이문로 123길 9',
    items: [
      {
        id: 'ord-1027-item-1',
        name: '수제 튀김 모둠',
        quantity: 2,
        unitPrice: 5000,
      },
    ],
    itemNote: '튀김은 눅눅해지지 않게 포장해주세요.',
    customerRequest: '결제 완료 후 연락 부탁드려요.',
    deliveryFee: 2500,
  },
];

export const SETTLEMENTS = initialSettlements;

function RouteComponent() {
  const storeId = 1; // 임시 하드코딩. 추후 URL/상태 기반으로 교체
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
  const [products, setProducts] = React.useState<ManagedProduct[]>(INITIAL_PRODUCTS);
  const [orders] = React.useState<ManagedOrder[]>(INITIAL_ORDERS);
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
        ) : null}

        {activeTab === 'product' ? (
          <ProductManager
            products={products}
            onAdd={handleAddProduct}
            onUpdate={handleUpdateProduct}
            onDelete={handleDeleteProduct}
          />
        ) : null}

        {activeTab === 'order' ? <OrderManager orders={orders} onFilterChange={() => {}} /> : null}

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

  const startEdit = React.useCallback((field: 'name' | 'roadAddr' | 'description', label: string, value: string) => {
    setEditField(field);
    setEditLabel(label);
    setEditValue(value ?? '');
    setEditOpen(true);
  }, []);

  const saveEdit = React.useCallback(() => {
    if (!editField) return;
    onUpdateField({ [editField]: editValue } as StoreUpdateRequest);
    setEditOpen(false);
  }, [editField, editValue, onUpdateField]);
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
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
              autoFocus
            />
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
