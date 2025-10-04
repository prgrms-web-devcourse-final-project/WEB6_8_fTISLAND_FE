import * as React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import AddressManage from '@/components/address/AddressManage';

export const Route = createFileRoute('/(dashboard)/customer/cart/')({
  component: RouteComponent,
});

type CartItem = { id: string; name: string; price: number; qty: number };

function RouteComponent() {
  const [addressOpen, setAddressOpen] = React.useState(false);
  const [address, setAddress] = React.useState<{ base?: string; detail?: string }>({});
  const [items, setItems] = React.useState<CartItem[]>([
    { id: 'p1', name: '상품 1', price: 9900, qty: 1 },
    { id: 'p2', name: '상품 2', price: 12900, qty: 2 },
  ]);
  const [deleteTarget, setDeleteTarget] = React.useState<CartItem | null>(null);
  const [riderNote, setRiderNote] = React.useState('');
  const [storeNote, setStoreNote] = React.useState('');

  const orderAmount = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const deliveryFee = 3000;
  const totalAmount = orderAmount + deliveryFee;
  const minOrderAmount = 15000;
  const deficit = Math.max(0, minOrderAmount - orderAmount);

  const decreaseQty = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (!target) return prev;
      if (target.qty <= 1) {
        setDeleteTarget(target);
        return prev;
      }
      return prev.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i));
    });
  };

  const increaseQty = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i)));
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className='flex min-h-[100dvh] w-full flex-col bg-[#2ac1bc]'>
      <header className='px-4 pb-5 pt-9 text-white sm:px-6 sm:pt-10'>
        <div className='flex items-center justify-between'>
          <Button
            variant='ghost'
            size='icon'
            className='size-9 rounded-full border border-white/30 text-white hover:bg-white/10'
            onClick={() => window.history.back()}>
            <ArrowLeft className='size-4' aria-hidden />
            <span className='sr-only'>뒤로가기</span>
          </Button>
          <h1 className='text-[16px] font-extrabold'>장바구니</h1>
          <div className='size-9' aria-hidden />
        </div>
      </header>

      <main className='flex-1 space-y-4 overflow-y-auto rounded-t-[1.5rem] bg-[#f8f9fa] px-4 pb-24 pt-6 outline-[1.5px] outline-[#2ac1bc]/15 sm:rounded-t-[1.75rem] sm:px-6 sm:pb-28 sm:pt-7'>
        <Card className='border-none bg-white shadow-sm'>
          <CardContent className='space-y-2 px-4 py-4 sm:px-5'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-[12px] text-[#6b7785]'>배달 주소</p>
                <p className='text-[14px] font-semibold text-[#1b1b1b]'>{address.base ?? '주소를 등록해 주세요'}</p>
                {address.detail ? <p className='text-[12px] text-[#6b7785]'>{address.detail}</p> : null}
              </div>
              <Button
                variant='outline'
                className='h-9 rounded-full border-[#dbe4ec] px-3 text-[12px] font-semibold text-[#2ac1bc] hover:border-[#2ac1bc] hover:bg-[#2ac1bc]/10'
                onClick={() => setAddressOpen(true)}>
                주소 수정
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className='border-none bg-white shadow-sm'>
          <CardContent className='space-y-3 px-4 py-4 sm:px-5'>
            <p className='text-[13px] font-semibold text-[#1b1b1b]'>상점 상호</p>
            <div className='space-y-2'>
              {items.map((it) => (
                <div key={it.id} className='flex items-center justify-between rounded-xl bg-[#f5f7f9] px-3 py-2'>
                  <div>
                    <p className='text-[13px] font-semibold text-[#1b1b1b]'>{it.name}</p>
                    <p className='text-[12px] text-[#6b7785]'>₩ {it.price.toLocaleString()}</p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      className='h-8 w-8 rounded-full border-[#dbe4ec] p-0 text-[#1b1b1b]'
                      onClick={() => decreaseQty(it.id)}>
                      <Minus className='size-4' />
                    </Button>
                    <span className='w-6 text-center text-[13px] font-semibold text-[#1b1b1b]'>{it.qty}</span>
                    <Button
                      variant='outline'
                      className='h-8 w-8 rounded-full border-[#dbe4ec] p-0 text-[#1b1b1b]'
                      onClick={() => increaseQty(it.id)}>
                      <Plus className='size-4' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className='border-none bg-white shadow-sm'>
          <CardContent className='space-y-3 px-4 py-4 sm:px-5'>
            <div className='space-y-2'>
              <Label className='text-[12px] text-[#1b1b1b]'>배달원 요청사항</Label>
              <Input
                placeholder='예) 벨 누르지 말아 주세요'
                className='h-10 text-[13px]'
                value={riderNote}
                onChange={(e) => setRiderNote(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-[12px] text-[#1b1b1b]'>상점 요청사항</Label>
              <Input
                placeholder='예) 소스는 따로 주세요'
                className='h-10 text-[13px]'
                value={storeNote}
                onChange={(e) => setStoreNote(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className='border-none bg-white shadow-sm'>
          <CardContent className='space-y-2 px-4 py-4 text-[13px] text-[#1b1b1b] sm:px-5'>
            <div className='flex items-center justify-between'>
              <span>주문금액</span>
              <span>₩ {orderAmount.toLocaleString()}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span>배달비</span>
              <span>₩ {deliveryFee.toLocaleString()}</span>
            </div>
            <div className='flex items-center justify-between font-bold'>
              <span>총 결제금액</span>
              <span>₩ {totalAmount.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className='sticky bottom-0 z-10 border-t border-white/20 bg-[#2ac1bc] px-4 py-4 text-white sm:px-6'>
        <div className='flex items-center justify-between gap-3'>
          <div className='text-[12px]'>
            총 주문금액 ₩ {orderAmount.toLocaleString()} / 최소주문 ₩ {minOrderAmount.toLocaleString()}
            {deficit > 0 ? <span className='ml-2 text-[#FFE08A]'>({deficit.toLocaleString()}원 부족)</span> : null}
          </div>
          <Button className='h-11 flex-1 rounded-full bg-white text-[13px] font-semibold text-[#1b1b1b] hover:bg-white/90'>
            가게배달 주문하기
          </Button>
        </div>
      </footer>

      <Dialog open={addressOpen} onOpenChange={setAddressOpen}>
        <DialogContent className='mx-auto w-[90%] max-w-[28rem] max-h-[85vh] overflow-hidden rounded-3xl border-0 p-0 shadow-2xl'>
          <AddressManage
            defaultOpen
            asDialog
            role='customer'
            onSave={(v) => {
              setAddress({ base: v.selectedAddress?.address, detail: v.unitNumber ?? '' });
            }}
            onClose={() => setAddressOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>메뉴를 삭제하시겠습니까?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className='bg-[#f43f5e] hover:bg-[#e11d48]'>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
