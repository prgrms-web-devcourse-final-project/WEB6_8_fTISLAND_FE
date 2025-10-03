import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { MapPin, Package, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export type ManagedOrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PREPARING'
  | 'RIDER_ASSIGNED'
  | 'DELIVERING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELED'
  | 'CANCELLATION_FAILED'
  | 'PAYMENT_FAILED';

export type ManagedOrderItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type ManagedOrder = {
  id: string;
  storeName: string;
  orderedAt: string;
  expectedDeliveryTime: string;
  status: ManagedOrderStatus;
  address: string;
  items: ManagedOrderItem[];
  itemNote?: string;
  customerRequest?: string;
  deliveryFee: number;
};

interface OrderManagerProps {
  orders: ManagedOrder[];
  onFilterChange(filters: OrderFilters): void;
}

export type OrderFilters = {
  startDate: string;
  endDate: string;
  status: Array<ManagedOrder['status']>;
};

const CURRENCY_FORMATTER = new Intl.NumberFormat('ko-KR');

const ORDER_STATUS_CONFIG: Record<
  ManagedOrderStatus,
  {
    label: string;
    badgeClass: string;
    tone: 'positive' | 'neutral' | 'negative';
    description: string;
  }
> = {
  PENDING: {
    label: '주문 접수 대기',
    badgeClass: 'bg-[#fff6e4] text-[#b97500]',
    tone: 'neutral',
    description: '주문이 접수 대기 중입니다. 결제 확인 전입니다.',
  },
  PAID: {
    label: '결제 완료',
    badgeClass: 'bg-[#e8f3ff] text-[#1d4ed8]',
    tone: 'neutral',
    description: '결제가 완료되어 준비를 시작할 수 있습니다.',
  },
  PREPARING: {
    label: '준비 중',
    badgeClass: 'bg-[#fff0d6] text-[#b45309]',
    tone: 'neutral',
    description: '주문 상품을 준비하고 있습니다.',
  },
  RIDER_ASSIGNED: {
    label: '라이더 배정',
    badgeClass: 'bg-[#e0f7f6] text-[#147f7c]',
    tone: 'neutral',
    description: '배달 라이더가 배정되었습니다.',
  },
  DELIVERING: {
    label: '배달 중',
    badgeClass: 'bg-[#dff5ff] text-[#0284c7]',
    tone: 'neutral',
    description: '배달 중입니다. 도착 예정 시간에 맞춰 확인해주세요.',
  },
  COMPLETED: {
    label: '배달 완료',
    badgeClass: 'bg-[#d8ffe7] text-[#1f6e6b]',
    tone: 'positive',
    description: '배달이 완료되었습니다.',
  },
  REJECTED: {
    label: '주문 거절',
    badgeClass: 'bg-[#fee4e8] text-[#c2414d]',
    tone: 'negative',
    description: '주문이 거절되었습니다.',
  },
  CANCELED: {
    label: '주문 취소',
    badgeClass: 'bg-[#fee4e8] text-[#c2414d]',
    tone: 'negative',
    description: '주문이 취소되었습니다.',
  },
  CANCELLATION_FAILED: {
    label: '취소 실패',
    badgeClass: 'bg-[#fee2e2] text-[#b91c1c]',
    tone: 'negative',
    description: '주문 취소에 실패했습니다.',
  },
  PAYMENT_FAILED: {
    label: '결제 실패',
    badgeClass: 'bg-[#fee2e2] text-[#b91c1c]',
    tone: 'negative',
    description: '결제가 실패했습니다. 재확인이 필요합니다.',
  },
};

const ORDER_STATUS_FLOW: ManagedOrderStatus[] = [
  'PENDING',
  'PAID',
  'PREPARING',
  'RIDER_ASSIGNED',
  'DELIVERING',
  'COMPLETED',
];

const EXCEPTION_STATUSES: ManagedOrderStatus[] = ['REJECTED', 'CANCELED', 'CANCELLATION_FAILED', 'PAYMENT_FAILED'];

const STATUS_FILTER_OPTIONS = ORDER_STATUS_FLOW.concat(EXCEPTION_STATUSES).map((status) => ({
  value: status,
  label: ORDER_STATUS_CONFIG[status].label,
}));

function formatCurrency(amount: number) {
  return `₩${CURRENCY_FORMATTER.format(amount)}`;
}

function parseDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function formatDateTime(value: string, options?: Intl.DateTimeFormatOptions) {
  const parsed = parseDate(value);
  if (!parsed) {
    return value;
  }
  return parsed.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options,
  });
}

export function OrderManager({ orders, onFilterChange }: OrderManagerProps) {
  const [openFilter, setOpenFilter] = React.useState(false);
  const [activeOrderId, setActiveOrderId] = React.useState<string | null>(null);
  const [filters, setFilters] = React.useState<OrderFilters>({
    startDate: '',
    endDate: '',
    status: [],
  });

  const activeOrder = React.useMemo(() => {
    return orders.find((order) => order.id === activeOrderId) ?? null;
  }, [orders, activeOrderId]);

  const filteredOrders = React.useMemo(() => {
    return orders.filter((order) => {
      const dateMatch = (() => {
        if (!filters.startDate && !filters.endDate) {
          return true;
        }

        const orderedDate = parseDate(order.orderedAt);
        if (!orderedDate) {
          return false;
        }

        if (filters.startDate) {
          const start = parseDate(filters.startDate);
          if (start && orderedDate < start) {
            return false;
          }
        }

        if (filters.endDate) {
          const end = parseDate(filters.endDate);
          if (end) {
            const endOfDay = new Date(end);
            endOfDay.setHours(23, 59, 59, 999);
            if (orderedDate > endOfDay) {
              return false;
            }
          }
        }

        return true;
      })();

      const statusMatch = filters.status.length === 0 || filters.status.includes(order.status);
      return dateMatch && statusMatch;
    });
  }, [orders, filters]);

  return (
    <section className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-[15px] font-semibold text-[#1b1b1b]'>주문 관리</h2>
          <p className='text-[12px] text-[#6b7785]'>기간과 상태를 선택해 주문 현황을 확인하세요.</p>
        </div>
        <FilterDialog
          open={openFilter}
          onOpenChange={setOpenFilter}
          currentFilters={filters}
          onConfirm={(nextFilters) => {
            setFilters(nextFilters);
            onFilterChange(nextFilters);
            setOpenFilter(false);
          }}
        />
      </div>
      <div className='space-y-3'>
        {filteredOrders.length === 0 ? (
          <Card className='border-dashed border-[#cbd8e2] bg-[#f5f7f9] text-center text-[13px] text-[#6b7785]'>
            <CardContent className='py-10'>
              조건에 맞는 주문이 없습니다. 다른 기간이나 상태를 선택해 보세요.
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onDetailClick={() => {
                setActiveOrderId(order.id);
              }}
            />
          ))
        )}
      </div>

      <OrderDetailDialog
        order={activeOrder}
        open={activeOrderId !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setActiveOrderId(null);
          }
        }}
      />
    </section>
  );
}

function OrderRow({ order, onDetailClick }: { order: ManagedOrder; onDetailClick(): void }) {
  return (
    <Card className='border-none bg-white shadow-[0_18px_52px_-30px_rgba(15,23,42,0.3)]'>
      <CardContent className='space-y-3 px-4 py-4'>
        <header className='flex items-center justify-between text-[12px] font-semibold text-[#1f6e6b]'>
          <span>{order.id}</span>
          <OrderStatusBadge status={order.status} />
        </header>
        <div className='space-y-1 text-[#1b1b1b]'>
          <p className='text-[14px] font-semibold'>
            {order.items[0]?.name ?? '상품 정보 없음'}
            {order.items[0]?.quantity ? (
              <span className='pl-1 text-[12px] text-[#6b7785]'>×{order.items[0]?.quantity}</span>
            ) : null}
          </p>
          {order.customerRequest ? (
            <p className='rounded-xl bg-[#f5f7f9] px-3 py-2 text-[12px] text-[#475569]'>{order.customerRequest}</p>
          ) : null}
          <div className='flex items-start gap-2 text-[12px] text-[#475569] sm:text-[13px]'>
            <MapPin className='mt-0.5 size-4 text-[#2ac1bc]' aria-hidden />
            {order.address}
          </div>
        </div>
        <footer className='flex items-center justify-between text-[11px] text-[#6b7785]'>
          <span>{formatDateTime(order.orderedAt, { hour: '2-digit', minute: '2-digit' })}</span>
          <Button
            variant='ghost'
            size='sm'
            className='h-8 rounded-full border border-[#cbd8e2] px-3 text-[11px] font-semibold text-[#1b1b1b] hover:bg-[#f8fafc]'
            onClick={onDetailClick}>
            상세 보기
          </Button>
        </footer>
      </CardContent>
    </Card>
  );
}

function OrderDetailDialog({
  order,
  open,
  onOpenChange,
}: {
  order: ManagedOrder | null;
  open: boolean;
  onOpenChange(open: boolean): void;
}) {
  const productTotal = React.useMemo(() => {
    if (!order) {
      return 0;
    }
    return order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [order]);

  const totalAmount = React.useMemo(() => {
    if (!order) {
      return 0;
    }
    return productTotal + order.deliveryFee;
  }, [order, productTotal]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {order ? (
        <DialogContent
          showCloseButton={false}
          className='max-w-[420px] translate-y-0 gap-0 rounded-[28px] border-none bg-white p-0 shadow-[0_34px_72px_-28px_rgba(15,23,42,0.55)]'>
          <DialogHeader className='w-full px-6 pb-4 pt-5'>
            <div className='flex items-start justify-between gap-3'>
              <div className='space-y-2'>
                <DialogTitle className='text-[18px] font-bold text-[#1b1b1b]'>상세 주문 정보</DialogTitle>
                <div className='flex items-center gap-2'>
                  <p className='text-[12px] font-semibold text-[#2ac1bc]'>{order.id}</p>
                  <OrderStatusBadge status={order.status} variant='compact' />
                </div>
              </div>
              <DialogClose asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-8 rounded-full border border-[#e2e8f0] bg-white p-0 text-[#334155] shadow-sm hover:bg-[#f8fafc]'>
                  <X className='size-4' aria-hidden />
                  <span className='sr-only'>닫기</span>
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          <div className='max-h-[70vh] space-y-5 overflow-y-auto px-6 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-2'>
            <section className='space-y-3 rounded-3xl bg-[#f5f7f9] px-5 py-4'>
              <div className='space-y-1'>
                <p className='text-[12px] font-semibold text-[#6b7785]'>상점 이름</p>
                <p className='text-[15px] font-semibold text-[#1b1b1b]'>{order.storeName}</p>
              </div>
              <div className='grid grid-cols-1 gap-3 text-[12px] text-[#475569]'>
                <div className='space-y-1'>
                  <p className='font-semibold text-[#6b7785]'>주문 시각</p>
                  <p className='font-medium text-[#1b1b1b]'>{formatDateTime(order.orderedAt)}</p>
                </div>
                <div className='space-y-1'>
                  <p className='font-semibold text-[#6b7785]'>예상 배달 완료</p>
                  <p className='font-medium text-[#1b1b1b]'>{formatDateTime(order.expectedDeliveryTime)}</p>
                </div>
                <div className='space-y-1'>
                  <p className='font-semibold text-[#6b7785]'>배달 주소</p>
                  <p className='font-medium leading-relaxed text-[#1b1b1b]'>{order.address}</p>
                </div>
              </div>
            </section>

            <section className='space-y-3 rounded-3xl border border-[#e2e8f0] bg-white px-5 py-4'>
              <header className='flex items-center justify-between'>
                <p className='text-[13px] font-semibold text-[#1b1b1b]'>주문 상품</p>
                <span className='text-[12px] font-semibold text-[#6b7785]'>{order.items.length}건</span>
              </header>
              <div className='overflow-hidden rounded-2xl border border-[#e2e8f0]'>
                <Table className='min-w-full border-collapse text-[12px] text-[#1b1b1b]'>
                  <TableHeader className='bg-[#f1f5f9]'>
                    <TableRow className='border-b border-[#e2e8f0] hover:bg-transparent'>
                      <TableHead className='w-[46%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]'>
                        상품명
                      </TableHead>
                      <TableHead className='w-[14%] px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]'>
                        수량
                      </TableHead>
                      <TableHead className='w-[20%] px-2 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]'>
                        단가
                      </TableHead>
                      <TableHead className='w-[20%] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]'>
                        소계
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item, index) => {
                      const subtotal = item.quantity * item.unitPrice;
                      return (
                        <TableRow
                          key={item.id}
                          className={cn(
                            'border-b border-[#e2e8f0] text-[#1b1b1b]',
                            index % 2 === 0 ? 'bg-white' : 'bg-[#f9fafb]',
                            'hover:bg-[#f1f5f9]'
                          )}>
                          <TableCell className='px-4 py-3 text-[12px] font-semibold text-[#1b1b1b]'>
                            <span className='block truncate'>{item.name}</span>
                          </TableCell>
                          <TableCell className='px-2 py-3 text-center text-[12px] text-[#475569]'>
                            ×{item.quantity}
                          </TableCell>
                          <TableCell className='px-2 py-3 text-right text-[12px] text-[#475569] tabular-nums'>
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className='px-4 py-3 text-right text-[12px] font-semibold text-[#1b1b1b] tabular-nums'>
                            {formatCurrency(subtotal)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter className='bg-white'>
                    <TableRow className='border-t border-[#e2e8f0]'>
                      <TableCell colSpan={3} className='px-4 py-3 text-right text-[12px] font-semibold text-[#475569]'>
                        최종 결제 금액
                      </TableCell>
                      <TableCell className='px-4 py-3 text-right text-[14px] font-bold text-[#1ba7a1] tabular-nums'>
                        {formatCurrency(totalAmount)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </section>

            {order.itemNote || order.customerRequest ? (
              <section className='space-y-3 rounded-3xl bg-[#f5f7f9] px-5 py-4'>
                <p className='text-[13px] font-semibold text-[#1b1b1b]'>상품 특이사항 & 고객 요청</p>
                <div className='space-y-2 text-[12px] leading-relaxed text-[#475569]'>
                  {order.itemNote ? (
                    <p>
                      <span className='font-semibold text-[#1b1b1b]'>상품 특이사항</span>
                      <br />
                      {order.itemNote}
                    </p>
                  ) : null}
                  {order.customerRequest ? (
                    <p>
                      <span className='font-semibold text-[#1b1b1b]'>고객 요청사항</span>
                      <br />
                      {order.customerRequest}
                    </p>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section className='space-y-3 rounded-3xl border border-[#e2e8f0] bg-white px-5 py-4'>
              <p className='text-[13px] font-semibold text-[#1b1b1b]'>결제 정보</p>
              <div className='space-y-2 text-[12px] text-[#475569]'>
                <div className='flex items-center justify-between'>
                  <span className='font-medium'>상품 총액</span>
                  <span className='font-semibold text-[#1b1b1b]'>{formatCurrency(productTotal)}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='font-medium'>배달비</span>
                  <span className='font-semibold text-[#1b1b1b]'>{formatCurrency(order.deliveryFee)}</span>
                </div>
                <div className='flex items-center justify-between pt-2'>
                  <span className='text-[13px] font-semibold text-[#1b1b1b]'>최종 결제 금액</span>
                  <span className='text-[15px] font-bold text-[#1ba7a1]'>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </section>
          </div>

          <DialogFooter className='px-6 pb-6'>
            <DialogClose asChild>
              <Button className='h-12 flex-1 rounded-full bg-[#fcd5d7] text-[14px] font-semibold text-[#c2414d] hover:bg-[#fbbec1]'>
                차단하기
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function OrderStatusBadge({
  status,
  variant = 'default',
}: {
  status: ManagedOrder['status'];
  variant?: 'default' | 'compact';
}) {
  const config = ORDER_STATUS_CONFIG[status];
  if (!config) {
    return null;
  }

  return (
    <span
      className={cn(
        'rounded-full font-semibold',
        variant === 'compact' ? 'px-2 py-1 text-[10px]' : 'px-3 py-1 text-[12px]',
        config.badgeClass
      )}>
      {config.label}
    </span>
  );
}

function FilterDialog({
  open,
  onOpenChange,
  currentFilters,
  onConfirm,
}: {
  open: boolean;
  onOpenChange(open: boolean): void;
  currentFilters: OrderFilters;
  onConfirm(filters: OrderFilters): void;
}) {
  const form = useForm<OrderFilters>({
    defaultValues: currentFilters,
  });

  React.useEffect(() => {
    form.reset(currentFilters);
  }, [currentFilters, form]);

  const handleSubmit = form.handleSubmit((values) => {
    onConfirm(values);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          type='button'
          variant='outline'
          className='h-9 rounded-full border-white/30 px-4 text-[12px] font-semibold text-white hover:bg-white/10'>
          필터 설정
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-sm rounded-2xl border-none bg-white p-6 shadow-[0_28px_72px_-28px_rgba(15,23,42,0.45)]'>
        <DialogHeader>
          <DialogTitle className='text-[16px] font-semibold text-[#1b1b1b]'>주문 필터</DialogTitle>
        </DialogHeader>
        <form
          className='space-y-4'
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}>
          <DateRangeFields form={form} />
          <StatusFields form={form} />
          <DialogFooter>
            <Button
              type='button'
              variant='ghost'
              className='h-10 rounded-full border border-[#cbd8e2] px-4 text-[13px] font-semibold text-[#1b1b1b] hover:bg-[#f8fafc]'
              onClick={() => {
                form.reset({ startDate: '', endDate: '', status: [] });
              }}>
              초기화
            </Button>
            <Button
              type='submit'
              className='h-10 rounded-full bg-[#1ba7a1] px-4 text-[13px] font-semibold text-white hover:bg-[#17928d]'>
              적용하기
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DateRangeFields({ form }: { form: ReturnType<typeof useForm<OrderFilters>> }) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className='grid grid-cols-2 gap-3'>
      <div className='space-y-1'>
        <Label className='text-[12px] font-semibold text-[#1b1b1b]'>시작일</Label>
        <Input type='date' className='h-10 rounded-xl border-[#cbd8e2] text-[12px]' {...register('startDate')} />
        {errors.startDate ? <p className='text-[11px] text-[#f43f5e]'>{errors.startDate.message}</p> : null}
      </div>
      <div className='space-y-1'>
        <Label className='text-[12px] font-semibold text-[#1b1b1b]'>종료일</Label>
        <Input type='date' className='h-10 rounded-xl border-[#cbd8e2] text-[12px]' {...register('endDate')} />
        {errors.endDate ? <p className='text-[11px] text-[#f43f5e]'>{errors.endDate.message}</p> : null}
      </div>
    </div>
  );
}

function StatusFields({ form }: { form: ReturnType<typeof useForm<OrderFilters>> }) {
  const { watch, setValue } = form;
  const selected = watch('status');
  const toggle = (value: ManagedOrder['status']) => {
    setValue('status', selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  return (
    <div className='space-y-2 rounded-2xl bg-[#f5f7f9] px-3 py-3'>
      <p className='text-[12px] font-semibold text-[#1b1b1b]'>주문 상태</p>
      <div className='grid gap-2'>
        {STATUS_FILTER_OPTIONS.map(({ value, label }) => (
          <label
            key={value}
            className='flex items-center justify-between rounded-xl bg-white px-3 py-2 text-[12px] font-semibold text-[#1b1b1b] shadow-sm'>
            <span className='flex items-center gap-2'>
              <Package className='size-4 text-[#1ba7a1]' aria-hidden />
              {label}
            </span>
            <Checkbox checked={selected.includes(value)} onCheckedChange={() => toggle(value)} />
          </label>
        ))}
      </div>
    </div>
  );
}
