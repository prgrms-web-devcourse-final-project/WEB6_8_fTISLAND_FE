import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Minus, Plus, Search } from 'lucide-react';
import { useGetProduct } from '@/api/generated';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const Route = createFileRoute('/(dashboard)/customer/store/$storeId/product/$productId/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { storeId, productId } = Route.useParams();
  const [qty, setQty] = React.useState(1);
  const [open, setOpen] = React.useState(false);
  const numericStoreId = Number(storeId);
  const numericProductId = Number(productId);
  const productQuery = useGetProduct(numericStoreId, numericProductId, {
    query: { enabled: Number.isFinite(numericStoreId) && Number.isFinite(numericProductId), staleTime: 10_000 },
  } as any);
  const product = (productQuery.data as any)?.data?.content ?? undefined;
  const unitPrice = Number(product?.price ?? 0);
  const totalPrice = unitPrice * qty;

  return (
    <div className='flex min-h-[100dvh] w-full flex-col bg-[#2ac1bc]'>
      <header className='relative h-[230px] w-full overflow-hidden'>
        {product?.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product?.name ?? '상품 이미지'}
            className='absolute inset-0 h-full w-full object-cover opacity-80'
          />
        ) : (
          <div className='absolute inset-0 bg-[url(https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2070&auto=format&fit=crop)] bg-cover bg-center opacity-80' />
        )}
        <div className='absolute inset-0 bg-black/30' />
        <div className='relative z-10 flex items-center justify-between px-4 pt-6 text-white sm:px-6 sm:pt-7'>
          <Button
            variant='ghost'
            size='icon'
            className='size-9 rounded-full border border-white/30 text-white hover:bg-white/10'
            onClick={() => window.history.back()}>
            <ArrowLeft className='size-4' aria-hidden />
            <span className='sr-only'>뒤로가기</span>
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='size-9 rounded-full border border-white/30 text-white hover:bg-white/10'>
            <Search className='size-4' aria-hidden />
            <span className='sr-only'>검색</span>
          </Button>
        </div>
      </header>

      <main className='flex-1 space-y-4 rounded-t-[1.5rem] bg-[#f8f9fa] px-4 pb-24 pt-4 outline-[1.5px] outline-[#2ac1bc]/15 sm:rounded-t-[1.75rem] sm:px-6 sm:pb-28 sm:pt-5'>
        <section className='rounded-2xl bg-white px-4 py-4 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.28)] sm:px-5'>
          <div className='space-y-1'>
            <h1 className='text-[18px] font-extrabold text-[#1b1b1b]'>{product?.name ?? `상품 ${productId}`}</h1>
            <p className='text-[12px] text-[#6b7785]'>{product?.description ?? '신선하고 맛있는 상품입니다.'}</p>
            <p className='text-[14px] font-bold text-[#1b1b1b]'>₩ {new Intl.NumberFormat('ko-KR').format(unitPrice)}</p>
          </div>

          <div className='mt-3 flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className='h-9 w-9 rounded-full border-[#dbe4ec] p-0 text-[#1b1b1b] hover:bg-[#f5f7f9]'>
              <Minus className='size-4' />
            </Button>
            <Input
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              className='h-9 w-14 text-center'
            />
            <Button
              type='button'
              variant='outline'
              onClick={() => setQty((q) => q + 1)}
              className='h-9 w-9 rounded-full border-[#dbe4ec] p-0 text-[#1b1b1b] hover:bg-[#f5f7f9]'>
              <Plus className='size-4' />
            </Button>
          </div>
        </section>
      </main>

      <footer className='sticky bottom-0 z-10 border-t border-white/20 bg-[#2ac1bc] px-4 py-4 text-white sm:px-6'>
        <div className='flex items-center justify-between gap-3'>
          <div className='text-[13px]'>수량 {qty}개</div>
          <Button
            className='h-11 flex-1 rounded-full bg-white text-[13px] font-semibold text-[#1b1b1b] hover:bg-white/90'
            onClick={() => setOpen(true)}>
            배달 카트에 담기
          </Button>
        </div>
      </footer>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='mx-auto w-[90%] max-w-[420px] rounded-2xl border-0 p-0 shadow-2xl'>
          <DialogHeader className='px-5 pb-2 pt-4'>
            <DialogTitle className='text-[15px] font-semibold text-[#1b1b1b]'>카트에 담았어요</DialogTitle>
          </DialogHeader>
          <div className='space-y-2 px-5 pb-4'>
            <Button
              variant='outline'
              className='h-10 w-full rounded-full border-[#dbe4ec] text-[13px] font-semibold text-[#1b1b1b] hover:bg-[#f5f7f9]'
              onClick={() => navigate({ to: '/customer' })}>
              메인페이지로 돌아가기
            </Button>
            <Button
              variant='outline'
              className='h-10 w-full rounded-full border-[#dbe4ec] text-[13px] font-semibold text-[#1b1b1b] hover:bg-[#f5f7f9]'
              onClick={() => navigate({ to: '/customer/store/$storeId', params: { storeId } })}>
              판매자 상세 페이지로 돌아가기
            </Button>
          </div>
          <DialogFooter className='flex flex-row items-center justify-between gap-3 border-t border-[#eef2f6] px-5 py-4'>
            <span className='text-[13px] font-semibold text-[#1b1b1b]'>총 {totalPrice.toLocaleString('ko-KR')}원</span>
            <Button
              className='h-10 flex-1 rounded-full bg-[#2ac1bc] text-[13px] font-semibold text-white hover:bg-[#1ba7a1]'
              onClick={() => navigate({ to: '/customer/cart' })}>
              카트 보기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
