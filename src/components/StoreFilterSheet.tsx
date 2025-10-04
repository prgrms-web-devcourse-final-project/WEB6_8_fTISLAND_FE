import * as React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export type StoreSortOption = 'recommended' | 'orders' | 'distance' | 'rating' | 'newest';

export interface StoreFilterValue {
  sort: StoreSortOption;
  freeDelivery: boolean;
  hasCoupon: boolean;
  // delivery fee upper bound; null means 전체 (제한없음)
  deliveryFeeMax: number | null;
  // minimum order amount lower bound; null means 전체 (제한없음)
  minOrderMin: number | null;
}

interface StoreFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: Partial<StoreFilterValue>;
  onApply?: (value: StoreFilterValue) => void;
  onReset?: () => void;
}

const DEFAULTS: StoreFilterValue = {
  sort: 'recommended',
  freeDelivery: false,
  hasCoupon: false,
  deliveryFeeMax: null,
  minOrderMin: null,
};

export function StoreFilterSheet({ open, onOpenChange, value, onApply, onReset }: StoreFilterSheetProps) {
  const [local, setLocal] = React.useState<StoreFilterValue>({ ...DEFAULTS, ...(value ?? {}) });

  React.useEffect(() => {
    setLocal((prev) => ({ ...prev, ...(value ?? {}) }));
  }, [value]);

  const handleReset = () => {
    setLocal(DEFAULTS);
    onReset?.();
  };

  const formatCurrency = (amount: number) => amount.toLocaleString('ko-KR') + '원';

  const deliveryDisplay = local.deliveryFeeMax == null ? '전체' : formatCurrency(local.deliveryFeeMax);
  const minOrderDisplay = local.minOrderMin == null ? '전체' : formatCurrency(local.minOrderMin);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='mx-auto w-[90%] max-w-[420px] max-h-[85vh] overflow-hidden rounded-2xl border-0 p-0 shadow-2xl'>
        <DialogHeader className='px-5 pb-3 pt-4'>
          <DialogTitle className='text-[15px] font-semibold text-[#1b1b1b]'>필터</DialogTitle>
        </DialogHeader>
        <div className='max-h-[70vh] space-y-5 overflow-y-auto px-5 pb-5'>
          <section className='space-y-3'>
            <Label className='text-[12px] text-[#6b7785]'>매장 정렬</Label>
            <RadioGroup
              value={local.sort}
              onValueChange={(val) => setLocal((p) => ({ ...p, sort: val as StoreSortOption }))}
              className='grid grid-cols-3 gap-2'>
              {[
                { v: 'recommended', l: '추천순' },
                { v: 'orders', l: '주문순' },
                { v: 'distance', l: '가까운순' },
                { v: 'rating', l: '별점순' },
                { v: 'newest', l: '신규순' },
              ].map((o) => (
                <div
                  key={o.v}
                  className='flex items-center gap-2 rounded-full border border-[#dbe4ec] bg-white px-3 py-2'>
                  <RadioGroupItem id={`sort-${o.v}`} value={o.v} />
                  <label htmlFor={`sort-${o.v}`} className='text-[12px] text-[#1b1b1b]'>
                    {o.l}
                  </label>
                </div>
              ))}
            </RadioGroup>
          </section>

          <section className='space-y-3'>
            <Label className='text-[12px] text-[#6b7785]'>인기 필터</Label>
            <div className='grid grid-cols-2 gap-2'>
              <button
                type='button'
                onClick={() => setLocal((p) => ({ ...p, freeDelivery: !p.freeDelivery }))}
                className={`rounded-full border px-3 py-2 text-[12px] font-semibold ${
                  local.freeDelivery
                    ? 'border-[#2ac1bc] bg-[#2ac1bc]/10 text-[#1f6e6b]'
                    : 'border-[#dbe4ec] bg-white text-[#1b1b1b]'
                }`}>
                무료 배달
              </button>
              <button
                type='button'
                onClick={() => setLocal((p) => ({ ...p, hasCoupon: !p.hasCoupon }))}
                className={`rounded-full border px-3 py-2 text-[12px] font-semibold ${
                  local.hasCoupon
                    ? 'border-[#2ac1bc] bg-[#2ac1bc]/10 text-[#1f6e6b]'
                    : 'border-[#dbe4ec] bg-white text-[#1b1b1b]'
                }`}>
                할인 쿠폰
              </button>
            </div>
          </section>

          <section className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label className='text-[12px] text-[#6b7785]'>배달 금액</Label>
              <span className='text-[12px] font-semibold text-[#1b1b1b]'>{deliveryDisplay}</span>
            </div>
            <input
              type='range'
              min={0}
              max={50000}
              step={1000}
              value={local.deliveryFeeMax == null ? 50000 : local.deliveryFeeMax}
              onChange={(e) => {
                const val = Number(e.target.value);
                setLocal((p) => ({ ...p, deliveryFeeMax: val >= 50000 ? null : val }));
              }}
              className='w-full'
            />
            <div className='flex justify-between text-[11px] text-[#6b7785]'>
              <span>0원</span>
              <span>전체</span>
            </div>
          </section>

          <section className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label className='text-[12px] text-[#6b7785]'>최소주문금액</Label>
              <span className='text-[12px] font-semibold text-[#1b1b1b]'>{minOrderDisplay}</span>
            </div>
            <input
              type='range'
              min={5000}
              max={15000}
              step={1000}
              value={local.minOrderMin == null ? 15000 : local.minOrderMin}
              onChange={(e) => {
                const val = Number(e.target.value);
                setLocal((p) => ({ ...p, minOrderMin: val >= 15000 ? null : val }));
              }}
              className='w-full'
            />
            <div className='flex justify-between text-[11px] text-[#6b7785]'>
              <span>5,000원</span>
              <span>전체</span>
            </div>
          </section>
        </div>
        <DialogFooter className='flex flex-row items-center justify-between gap-3 border-t border-[#eef2f6] px-5 py-4'>
          <Button
            type='button'
            variant='outline'
            onClick={handleReset}
            className='h-10 flex-1 rounded-full border-[#dbe4ec] bg-white text-[13px] font-semibold text-[#1b1b1b] hover:bg-[#f5f7f9]'>
            초기화
          </Button>
          <Button
            type='button'
            onClick={() => {
              onApply?.(local);
              onOpenChange(false);
            }}
            className='h-10 flex-1 rounded-full bg-[#2ac1bc] text-[13px] font-semibold text-white hover:bg-[#1ba7a1]'>
            필터 적용
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default StoreFilterSheet;
