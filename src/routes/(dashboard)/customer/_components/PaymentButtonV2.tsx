import * as React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCreate } from '@/api/generated';

console.log(import.meta.env.VITE_TOSS_CLIENT_KEY);

// v2 SDK 동적 로더 (CDN). 모듈 설치가 안 되어 있거나 번들러가 해석 못하는 경우 대비
async function getLoadTossPayments(): Promise<(clientKey: string) => Promise<any>> {
  // NPM/ESM 로더 (일부 환경에서 전역으로 노출됨)
  // @ts-ignore
  if (typeof (window as any).loadTossPayments === 'function') return (window as any).loadTossPayments;
  // CDN 전역 (v2 스크립트는 TossPayments 글로벌을 노출)
  // @ts-ignore
  if (typeof (window as any).TossPayments === 'function') {
    // 어댑터: loadTossPayments와 동일한 시그니처로 감싸기
    // @ts-ignore
    return async (clientKey: string) => (window as any).TossPayments(clientKey);
  }
  await new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('toss-payments-v2');
    if (existing) return resolve();
    const s = document.createElement('script');
    s.id = 'toss-payments-v2';
    s.src = 'https://js.tosspayments.com/v2';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Toss Payments v2 SDK'));
    document.body.appendChild(s);
  });
  // @ts-ignore
  const loader = (window as any).loadTossPayments;
  // @ts-ignore
  const globalCtor = (window as any).TossPayments;
  if (typeof loader === 'function') return loader;
  if (typeof globalCtor === 'function') {
    return async (clientKey: string) => globalCtor(clientKey);
  }
  throw new Error('TossPayments v2 loader is not available');
}

type PaymentCartItem = { storeId: number; productId: number; name: string; price: number; qty: number };

type PaymentButtonV2Props = {
  items: PaymentCartItem[];
  nickname?: string;
  customerId?: number;
  address?: string;
  lat?: number;
  lng?: number;
  deliveryFee: number;
  riderNote?: string;
  storeNote?: string;
  method?: string; // '토스페이' | '카드' 등
  className?: string;
  children?: React.ReactNode;
};

export default function PaymentButtonV2({
  items,
  nickname,
  customerId,
  address,
  lat,
  lng,
  deliveryFee,
  riderNote,
  storeNote,
  method = '카드',
  className,
  children,
}: PaymentButtonV2Props) {
  const [loading, setLoading] = React.useState(false);
  const createOrder = useCreate();

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

      // 1) 주문 생성 (결제요청에 필요한 orderId 확보)
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
      if (!merchantUid || !serverOrderId) {
        toast.error('주문 식별자(orderId/merchantUid)가 없어 결제를 진행할 수 없습니다.');
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

      // 2) v2 SDK 초기화 및 결제 요청
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

      const loadTossPayments = await getLoadTossPayments();
      const toss = await loadTossPayments(clientKey);
      const req = {
        amount: totalAmount,
        orderId,
        orderName: items[0]?.name ?? '주문',
        customerName: nickname ?? '고객',
        successUrl: `${window.location.origin}/payment/success?merchantUid=${encodeURIComponent(merchantUid)}`,
        failUrl: `${window.location.origin}/payment/fail?merchantUid=${encodeURIComponent(merchantUid)}`,
        card: {
          useEscrow: false,
          flowMode: 'DIRECT',
          useCardPoint: false,
          useAppCardOnly: false,
          easyPay: '토스페이',
        },
      } as any;

      try {
        await toss.requestPayment(method, req);
      } catch (e: any) {
        // 간편결제 미개통(샌드박스: NOT_SUPPORTED_EASYPAY_METHOD) 시 카드로 폴백
        const code = e?.code as string | undefined;
        if (code === 'NOT_SUPPORTED_EASYPAY_METHOD') {
          toast.message('해당 간편결제를 지원하지 않아 카드로 진행합니다.');
          await toss.requestPayment('카드', req);
          return;
        }
        throw e;
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
      {children ?? '결제하기(v2)'}
    </Button>
  );
}
