import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useCreate } from '@/api/generated';

type PaymentCartItem = { storeId: number; productId: number; name: string; price: number; qty: number };

type WidgetPaymentButtonProps = {
  items: PaymentCartItem[];
  nickname?: string;
  customerId?: number;
  address?: string;
  lat?: number;
  lng?: number;
  deliveryFee: number;
  riderNote?: string;
  storeNote?: string;
  className?: string;
  children?: React.ReactNode;
};

export default function WidgetPaymentButton({
  items,
  nickname,
  customerId,
  address,
  lat,
  lng,
  deliveryFee,
  riderNote,
  storeNote,
  className,
  children,
}: WidgetPaymentButtonProps) {
  const createOrder = useCreate();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  console.log(import.meta.env.VITE_TOSS_CLIENT_KEY);

  // Toss widget refs/state
  const widgetRef = React.useRef<any>(null);
  const amountRef = React.useRef<number>(0);
  const sanitizedOrderIdRef = React.useRef<string>('');
  const rawOrderIdRef = React.useRef<string>('');

  const customerKey = React.useMemo(() => {
    if (customerId) return `customer-${customerId}`;
    try {
      let existing = sessionStorage.getItem('guest-key');
      if (!existing) {
        existing = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        sessionStorage.setItem('guest-key', existing);
      }
      return existing;
    } catch {
      return `guest-${Date.now()}`;
    }
  }, [customerId]);

  const ensureWidget = React.useCallback(async () => {
    if (widgetRef.current) return widgetRef.current;

    const env = ((import.meta as any)?.env ?? {}) as Record<string, string | undefined>;
    const clientKey =
      (env.VITE_TOSS_CLIENT_KEY as string | undefined) ||
      (env.VITE_TOSS_KEY as string | undefined) ||
      (env.VITE_TOSS_PAYMENTS_CLIENT_KEY as string | undefined) ||
      (env.VITE_TOSS_STANDARD_KEY as string | undefined) ||
      undefined;
    if (!clientKey) {
      toast.error('결제 키가 설정되지 않았습니다. (.env.local에 VITE_TOSS_CLIENT_KEY 설정 필요)');
      throw new Error('missing client key');
    }

    const waitFor = async <T,>(getter: () => T | undefined, timeoutMs = 8000): Promise<T | undefined> => {
      const start = Date.now();
      return await new Promise<T | undefined>((resolve) => {
        const tick = () => {
          const v = getter();
          if (v) return resolve(v);
          if (Date.now() - start > timeoutMs) return resolve(undefined);
          setTimeout(tick, 50);
        };
        tick();
      });
    };

    // 1) 이미 v2 로더가 있다면 우선 사용
    const v2LoaderExisting: any =
      (await waitFor(() => (window as any).loadPaymentWidget)) ||
      (await waitFor(() => (window as any).TossPayments?.loadPaymentWidget));
    if (typeof v2LoaderExisting === 'function') {
      const widget = await v2LoaderExisting(clientKey, customerKey, { ui: { logos: { hidden: false } } });
      widgetRef.current = widget;
      return widget;
    }

    // 2) v1 위젯 스크립트를 우선 로드 시도
    await new Promise<void>((resolve, reject) => {
      if (document.getElementById('toss-payments-widget')) return resolve();
      const script = document.createElement('script');
      script.id = 'toss-payments-widget';
      script.src = 'https://js.tosspayments.com/v1/payment-widget';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Toss Payments widget v1'));
      document.body.appendChild(script);
    });

    // v1 전역 체크
    // @ts-ignore
    let TossPayments: any = (window as any)?.TossPayments;
    if (typeof TossPayments === 'function') {
      const toss = TossPayments(clientKey);
      if (typeof toss?.paymentWidget === 'function') {
        const widget = toss.paymentWidget({ customerKey, ui: { logos: { hidden: false } } });
        widgetRef.current = widget;
        return widget;
      }
    }

    // 3) v1이 실패하면 v2 위젯 스크립트 로드 후 시도
    await new Promise<void>((resolve, reject) => {
      if (document.getElementById('toss-payments-widget-v2')) return resolve();
      const script = document.createElement('script');
      script.id = 'toss-payments-widget-v2';
      script.src = 'https://js.tosspayments.com/v2/payment-widget';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Toss Payments widget v2'));
      document.body.appendChild(script);
    });
    const v2Loader: any =
      (await waitFor(() => (window as any).loadPaymentWidget)) ||
      (await waitFor(() => (window as any).TossPayments?.loadPaymentWidget));
    if (typeof v2Loader === 'function') {
      const widget = await v2Loader(clientKey, customerKey, { ui: { logos: { hidden: false } } });
      widgetRef.current = widget;
      return widget;
    }

    toast.error('결제 모듈 초기화에 실패했습니다.');
    throw new Error('Payment widget not available');
  }, [customerKey]);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    ensureWidget()
      .then(async (w) => {
        if (cancelled) return;
        try {
          await w.renderPaymentMethods('#toss-payment-methods', { amount: amountRef.current });
          await w.renderAgreement('#toss-payment-agreement');
        } catch (e) {
          console.error('[toss][widget] render error', e);
          toast.error('결제 수단을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
          setOpen(false);
        }
      })
      .catch((e) => {
        console.error('[toss][widget] init error', e);
        toast.error('결제 위젯 초기화에 실패했습니다.');
        setOpen(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, ensureWidget]);

  const requestPayment = React.useCallback(async () => {
    try {
      const w = await ensureWidget();
      await w.requestPayment({
        orderId: sanitizedOrderIdRef.current,
        amount: amountRef.current,
        orderName: items[0]?.name ?? '주문',
        customerName: nickname ?? '고객',
        successUrl: `${window.location.origin}/payment/success?orderId=${encodeURIComponent(rawOrderIdRef.current)}`,
        failUrl: `${window.location.origin}/payment/fail?orderId=${encodeURIComponent(rawOrderIdRef.current)}`,
      });
    } catch (e: any) {
      const msg = e?.message ?? '결제 요청 중 오류가 발생했습니다.';
      toast.error(msg);
    }
  }, [ensureWidget, items, nickname]);

  const handleClick = async () => {
    try {
      setLoading(true);
      // validate
      if (!items.length) {
        toast.error('장바구니가 비어 있습니다.');
        return;
      }
      if (!address || lat == null || lng == null) {
        toast.error('배송지를 확인해 주세요.');
        return;
      }
      const baseStoreId = items[0]?.storeId;
      if (baseStoreId == null) {
        toast.error('가게 정보가 올바르지 않습니다.');
        return;
      }
      const hasMixed = items.some((i) => i.storeId !== baseStoreId);
      if (hasMixed) {
        toast.error('서로 다른 가게의 상품은 함께 주문할 수 없습니다.');
        return;
      }

      const storePrice = items.reduce((s, it) => s + it.price * it.qty, 0);
      const totalAmount = storePrice + deliveryFee;
      const orderReq = {
        storeId: baseStoreId,
        orderItemRequests: items.map((it) => ({ productId: it.productId, price: it.price, quantity: it.qty })),
        ...(customerId != null ? { customerId } : {}),
        address,
        lat,
        lng,
        riderNote: riderNote?.trim() || undefined,
        storeNote: storeNote?.trim() || undefined,
        totalPrice: totalAmount,
        storePrice,
        deliveryPrice: deliveryFee,
      } as any;

      const res = await createOrder.mutateAsync({ data: orderReq } as any);
      const content = (res as any)?.data?.content ?? (res as any)?.content;
      const merchantUid: string | undefined =
        (typeof content === 'string' ? (content as string) : undefined) ||
        (content?.merchantUid as string | undefined) ||
        (content?.orderId as string | undefined) ||
        (content?.id ? String(content.id) : undefined);
      if (!merchantUid) {
        toast.error('주문 식별자가 없어 결제를 진행할 수 없습니다.');
        return;
      }

      const sanitizeOrderId = (raw: string): string => {
        const cleaned = String(raw).replace(/[^0-9a-zA-Z-_]/g, '_');
        let id = cleaned.slice(0, 64);
        if (id.length < 6) id = (id + '_'.repeat(6)).slice(0, 6);
        return id;
      };

      amountRef.current = totalAmount;
      sanitizedOrderIdRef.current = sanitizeOrderId(merchantUid);
      rawOrderIdRef.current = merchantUid;
      setOpen(true);
    } catch (e) {
      console.error(e);
      toast.error('결제 준비 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button type='button' className={className} onClick={handleClick} disabled={loading} aria-busy={loading}>
        {children ?? '간편결제(위젯)'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='mx-auto w-[92%] max-w-[28rem] rounded-3xl border-0 p-0 shadow-xl'>
          <DialogHeader className='px-5 pb-2 pt-4'>
            <DialogTitle className='text-[15px] font-semibold text-[#1b1b1b]'>결제 수단을 선택해 주세요</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 px-5 pb-5'>
            <div id='toss-payment-methods' className='rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-4' />
            <div
              id='toss-payment-agreement'
              className='rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-3 text-[12px]'
            />
            <div className='flex gap-2'>
              <Button
                type='button'
                variant='outline'
                className='h-10 flex-1 rounded-full border-[#cbd8e2] text-[13px] font-semibold text-[#1b1b1b]'
                onClick={() => setOpen(false)}>
                닫기
              </Button>
              <Button
                type='button'
                className='h-10 flex-1 rounded-full bg-[#1ba7a1] text-[13px] font-semibold text-white hover:bg-[#17928d]'
                onClick={requestPayment}>
                결제하기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
