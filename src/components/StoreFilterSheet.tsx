import * as React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export interface StoreFilterValue {
  distanceKm: number; // 0~10
}

interface StoreFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: Partial<StoreFilterValue>;
  onApply?: (value: StoreFilterValue) => void;
  onReset?: () => void;
}

const DEFAULTS: StoreFilterValue = { distanceKm: 3 };

export function StoreFilterSheet({ open, onOpenChange, value, onApply, onReset }: StoreFilterSheetProps) {
  const [local, setLocal] = React.useState<StoreFilterValue>({ ...DEFAULTS, ...(value ?? {}) });

  React.useEffect(() => {
    setLocal((prev) => ({ ...prev, ...(value ?? {}) }));
  }, [value]);

  const handleReset = () => {
    setLocal(DEFAULTS);
    onReset?.();
  };

  const distanceDisplay = `${local.distanceKm} km`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='mx-auto w-[90%] max-w-[420px] max-h-[85vh] overflow-hidden rounded-2xl border-0 p-0 shadow-2xl'>
        <DialogHeader className='px-5 pb-3 pt-4'>
          <DialogTitle className='text-[15px] font-semibold text-[#1b1b1b]'>필터</DialogTitle>
        </DialogHeader>
        <div className='max-h-[70vh] space-y-5 overflow-y-auto px-5 pb-5'>
          <section className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label className='text-[12px] text-[#6b7785]'>거리</Label>
              <span className='text-[12px] font-semibold text-[#1b1b1b]'>{distanceDisplay}</span>
            </div>
            <Slider
              value={[local.distanceKm]}
              min={0}
              max={10}
              step={1}
              onValueChange={(v) => setLocal((p) => ({ ...p, distanceKm: v[0] }))}
            />
            <div className='flex justify-between text-[11px] text-[#6b7785]'>
              <span>0 km</span>
              <span>10 km</span>
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
