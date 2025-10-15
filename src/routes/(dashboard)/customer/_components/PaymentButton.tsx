import * as React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCreate } from '@/api/generated';

type PaymentCartItem = { storeId: number; productId: number; name: string; price: number; qty: number };

type PaymentButtonProps = {
  items: PaymentCartItem[];
  nickname?: string;
  customerId?: number;
  address?: string;
  lat?: number;
  lng?: number;
  deliveryFee: number;
  riderNote?: string;
  storeNote?: string;
  method?: string; // 예: '토스페이', '카카오페이', '네이버페이', '카드' 등
  className?: string;
  children?: React.ReactNode;
};

export default function PaymentButton({
  items,
  nickname,
  customerId,
  address,
  lat,
  lng,
  deliveryFee,
  riderNote,
  storeNote,
  method = '토스페이',
  className,
  children,
}: PaymentButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const createOrder = useCreate();

  console.log(import.meta.env.VITE_TOSS_CLIENT_KEY);

  const waitFor = React.useCallback(
    async <T,>(getter: () => T | undefined, timeoutMs = 8000): Promise<T | undefined> => {
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
    },
    []
  );

  const ensureStdScript = React.useCallback(async () => {
    // v2가 이미 있으면 주입 생략
    if (
      typeof (window as any).loadTossPayments === 'function' ||
      typeof (window as any).TossPayments?.loadTossPayments === 'function'
    )
      return;
    if (!document.getElementById('toss-payments-standard')) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement('script');
        s.id = 'toss-payments-standard';
        s.src = 'https://js.tosspayments.com/v2';
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load Toss Payments standard v2'));
        document.body.appendChild(s);
      });
    }
    // v2 로더가 반드시 생기지 않아도 됨(아래에서 v1로 폴백)
  }, []);

  const ensureStdScriptV1 = React.useCallback(async () => {
    // v1 표준 스크립트 로더 준비
    if (typeof (window as any).TossPayments === 'function') return;
    if (!document.getElementById('toss-payments-standard-v1')) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement('script');
        s.id = 'toss-payments-standard-v1';
        s.src = 'https://js.tosspayments.com/v1';
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load Toss Payments standard v1'));
        document.body.appendChild(s);
      });
    }
    const ok = await waitFor(() => (window as any).TossPayments, 8000);
    if (!ok) throw new Error('TossPayments v1 not available');
  }, [waitFor]);

  const handleClick = async () => {
    try {
      setLoading(true);
      // 0) 유효성 검사
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

      // 1) 주문 생성
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

      const createRes = await createOrder.mutateAsync({ data: orderReq } as any);
      const content = (createRes as any)?.data?.content ?? (createRes as any)?.content;
      const serverOrderId: string | undefined =
        (content?.orderId != null ? String(content.orderId) : undefined) ||
        (content?.id != null ? String(content.id) : undefined);
      const merchantUid: string | undefined =
        (content?.merchantUid as string | undefined) ||
        (content?.merchantId as string | undefined) ||
        (typeof content === 'string' ? (content as string) : undefined);
      toast.success('주문이 생성되었습니다. 결제를 진행해 주세요.');
      if (!merchantUid || !serverOrderId) {
        console.error('[order] missing merchantUid in create response', content);
        toast.error('주문 식별자(orderId/merchantUid)를 찾을 수 없어 결제를 진행할 수 없습니다.');
        return;
      }

      const buildTossOrderId = (raw: string): string => {
        const base = `order_${String(raw)}`;
        const cleaned = base.replace(/[^0-9a-zA-Z-_]/g, '_');
        let id = cleaned.slice(0, 64);
        if (id.length < 6) id = (id + '_'.repeat(6)).slice(0, 6);
        return id;
      };
      const orderId = buildTossOrderId(String(serverOrderId));
      try {
        sessionStorage.setItem('last-order-id', String(serverOrderId));
      } catch {}
      const env = ((import.meta as any)?.env ?? {}) as Record<string, string | undefined>;
      const clientKey =
        (env.VITE_TOSS_CLIENT_KEY as string | undefined) ||
        (env.VITE_TOSS_KEY as string | undefined) ||
        (env.VITE_TOSS_PAYMENTS_CLIENT_KEY as string | undefined) ||
        (env.VITE_TOSS_STANDARD_KEY as string | undefined) ||
        undefined;
      if (!clientKey) {
        toast.error('결제 키가 설정되지 않았습니다. (.env.local에 VITE_TOSS_CLIENT_KEY 설정 필요)');
        return;
      }

      // 2) 결제 요청: v1 우선 → v2 폴백
      await ensureStdScriptV1();
      const TP: any = (window as any).TossPayments;
      if (typeof TP !== 'function') throw new Error('TossPayments v1 not available');
      const client = TP(clientKey);

      // v1 간편결제 매핑: payMethod='카드' + easyPay 옵션
      const toV1EasyPay = (m?: string): { payMethod: string; easyPay?: string } => {
        const key = (m || '').trim();
        if (key === '토스페이') return { payMethod: '카드', easyPay: 'TOSSPAY' };
        if (key === '카카오페이') return { payMethod: '카드', easyPay: 'KAKAOPAY' };
        if (key === '네이버페이') return { payMethod: '카드', easyPay: 'NAVERPAY' };
        // 기본은 카드 결제 (간편결제 미지정)
        return { payMethod: '카드' };
      };
      const v1 = toV1EasyPay(method);
      await client.requestPayment(v1.payMethod, {
        amount: totalAmount,
        flowMode: 'DEFAULT',
        orderId,
        orderName: items[0]?.name ?? '주문',
        customerName: nickname ?? '고객',
        successUrl: `${window.location.origin}/payment/success?merchantUid=${encodeURIComponent(merchantUid ?? '')}`,
        failUrl: `${window.location.origin}/payment/fail?merchantUid=${encodeURIComponent(merchantUid ?? '')}`,
        ...(v1.easyPay ? { easyPay: v1.easyPay } : {}),
      });
      return;

      // v1 실패 시 v2 시도
      await ensureStdScript();
      const v2Loader: any =
        (await waitFor(() => (window as any).loadTossPayments)) ||
        (await waitFor(() => (window as any).TossPayments?.loadTossPayments));
      if (typeof v2Loader === 'function') {
        const v2 = await v2Loader(clientKey);
        await v2.requestPayment(method, {
          amount: totalAmount,
          orderId,
          orderName: items[0]?.name ?? '주문',
          customerName: nickname ?? '고객',
          successUrl: `${window.location.origin}/payment/success?orderId=${encodeURIComponent(merchantUid ?? '')}`,
          failUrl: `${window.location.origin}/payment/fail?orderId=${encodeURIComponent(merchantUid ?? '')}`,
        });
      }
    } catch (e: any) {
      const msg = e?.message ?? '결제 요청 중 오류가 발생했습니다.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type='button' className={className} onClick={handleClick} disabled={loading} aria-busy={loading}>
      {children ?? '간편결제'}
    </Button>
  );
}
