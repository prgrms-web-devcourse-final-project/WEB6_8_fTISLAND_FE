import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

function useDialogKeyboardOffset(open: boolean) {
  const [offset, setOffset] = React.useState(0);

  React.useEffect(() => {
    if (!open || typeof window === 'undefined') {
      setOffset(0);
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    const handleViewportChange = () => {
      const keyboardHeight = Math.max(0, window.innerHeight - (viewport.height + viewport.offsetTop));
      if (keyboardHeight === 0) {
        setOffset(0);
        return;
      }
      const maxShift = viewport.height * 0.4;
      const shift = Math.min(keyboardHeight * 0.6, maxShift);
      setOffset(shift);
    };

    viewport.addEventListener('resize', handleViewportChange);
    viewport.addEventListener('scroll', handleViewportChange);
    handleViewportChange();

    return () => {
      viewport.removeEventListener('resize', handleViewportChange);
      viewport.removeEventListener('scroll', handleViewportChange);
    };
  }, [open]);

  return offset;
}

export type ManagedProduct = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  thumbnail: string;
};

export type ProductFormValues = {
  name: string;
  price: string;
  quantity: string;
  thumbnail: string;
};

interface ProductManagerProps {
  products: ManagedProduct[];
  onAdd(product: ManagedProduct): void;
  onUpdate(productId: string, product: ManagedProduct): void;
  onDelete(productId: string): void;
}

export function ProductManager({ products, onAdd, onUpdate, onDelete }: ProductManagerProps) {
  return (
    <section className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-[15px] font-semibold text-[#1b1b1b]'>상품 관리</h2>
        <AddProductDialog onSave={onAdd} />
      </div>
      <div className='space-y-3'>
        {products.length === 0 ? (
          <Card className='border-dashed border-[#cbd8e2] bg-[#f5f7f9] text-center text-[13px] text-[#6b7785]'>
            <CardContent className='py-8'>
              등록된 상품이 없습니다. 상품 추가 버튼을 눌러 새로운 상품을 등록해 주세요.
            </CardContent>
          </Card>
        ) : (
          products.map((product) => (
            <ProductRow key={product.id} product={product} onUpdate={onUpdate} onDelete={onDelete} />
          ))
        )}
      </div>
    </section>
  );
}

function ProductRow({
  product,
  onUpdate,
  onDelete,
}: {
  product: ManagedProduct;
  onUpdate(productId: string, product: ManagedProduct): void;
  onDelete(productId: string): void;
}) {
  return (
    <Card className='border-none bg-white shadow-[0_18px_52px_-30px_rgba(15,23,42,0.3)]'>
      <CardContent className='flex items-center gap-4 px-4 py-4'>
        <ThumbnailPreview src={product.thumbnail} name={product.name} />
        <div className='flex flex-1 flex-col gap-1 text-[#1b1b1b]'>
          <p className='text-[14px] font-semibold'>{product.name}</p>
          <div className='flex flex-wrap items-center gap-2 text-[12px] text-[#475569]'>
            <span className='rounded-full bg-[#daf7f4] px-2.5 py-0.5 font-semibold text-[#1f6e6b]'>
              ₩ {product.price.toLocaleString()}
            </span>
            <span className='rounded-full bg-[#fef3c7] px-2.5 py-0.5 font-semibold text-[#b45309]'>
              재고 {product.quantity}개
            </span>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <EditProductDialog product={product} onSave={onUpdate} />
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='size-9 rounded-full border border-[#f87171]/60 text-[#f87171] hover:bg-[#f87171]/10'
            onClick={() => onDelete(product.id)}>
            <Trash2 className='size-4' aria-hidden />
            <span className='sr-only'>상품 삭제</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ThumbnailPreview({ src, name }: { src: string; name: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={`${name} 미리보기`}
        className='size-14 rounded-full border border-[#e2e8f0] object-cover shadow-sm'
      />
    );
  }
  return (
    <div className='flex size-14 items-center justify-center rounded-full border border-dashed border-[#cbd8e2] bg-[#f8fafc] text-[12px] font-semibold text-[#94a3b8]'>
      미리보기
    </div>
  );
}

function AddProductDialog({ onSave }: { onSave(product: ManagedProduct): void }) {
  const [open, setOpen] = React.useState(false);
  const keyboardOffset = useDialogKeyboardOffset(open);
  const form = useProductForm();

  const handleSubmit = form.handleSubmit((values) => {
    const newProduct: ManagedProduct = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      name: values.name,
      price: Number(values.price.replace(/,/g, '')),
      quantity: Number(values.quantity),
      thumbnail: values.thumbnail,
    };
    onSave(newProduct);
    setOpen(false);
    form.reset();
  });

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : setOpen(false))}>
      <DialogTrigger asChild>
        <Button
          type='button'
          className='rounded-full bg-[#1ba7a1] px-4 text-[13px] font-semibold text-white hover:bg-[#17928d]'>
          상품 추가
        </Button>
      </DialogTrigger>
      <DialogContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        className='max-w-sm rounded-2xl border-none bg-white p-6 shadow-[0_28px_72px_-28px_rgba(15,23,42,0.45)]'
        style={keyboardOffset ? { top: `calc(50% - ${keyboardOffset}px)` } : undefined}>
        <DialogHeader>
          <DialogTitle className='text-[16px] font-semibold text-[#1b1b1b]'>새로운 상품 등록</DialogTitle>
          <DialogDescription className='text-[12px] text-[#6b7785]'>
            상품 정보를 입력하면 목록에 추가됩니다.
          </DialogDescription>
        </DialogHeader>
        <form
          className='space-y-4'
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}>
          <ProductFields form={form} />
          <DialogFooter className='pt-2'>
            <Button
              type='button'
              variant='outline'
              className='h-10 rounded-full border-[#cbd8e2] px-4 text-[13px] font-semibold text-[#1b1b1b] hover:bg-[#f8fafc]'
              onClick={() => {
                setOpen(false);
                form.reset();
              }}>
              취소
            </Button>
            <Button
              type='submit'
              className='h-10 rounded-full bg-[#1ba7a1] px-4 text-[13px] font-semibold text-white hover:bg-[#17928d]'>
              등록하기
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditProductDialog({
  product,
  onSave,
}: {
  product: ManagedProduct;
  onSave(productId: string, product: ManagedProduct): void;
}) {
  const [open, setOpen] = React.useState(false);
  const keyboardOffset = useDialogKeyboardOffset(open);
  const form = useProductForm({
    defaultValues: {
      name: product.name,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      thumbnail: product.thumbnail,
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    const updated: ManagedProduct = {
      ...product,
      name: values.name,
      price: Number(values.price.replace(/,/g, '')),
      quantity: Number(values.quantity),
      thumbnail: values.thumbnail,
    };
    onSave(product.id, updated);
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : setOpen(false))}>
      <DialogTrigger asChild>
        <Button
          type='button'
          variant='outline'
          className='h-9 rounded-full border-[#cbd8e2] px-4 text-[12px] font-semibold text-[#1b1b1b] hover:bg-[#f8fafc]'>
          수정
        </Button>
      </DialogTrigger>
      <DialogContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        className='max-w-sm rounded-2xl border-none bg-white p-6 shadow-[0_28px_72px_-28px_rgba(15,23,42,0.45)]'
        style={keyboardOffset ? { top: `calc(50% - ${keyboardOffset}px)` } : undefined}>
        <DialogHeader>
          <DialogTitle className='text-[16px] font-semibold text-[#1b1b1b]'>상품 정보 수정</DialogTitle>
          <DialogDescription className='text-[12px] text-[#6b7785]'>
            변경 사항은 저장 즉시 적용됩니다.
          </DialogDescription>
        </DialogHeader>
        <form
          className='space-y-4'
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}>
          <ProductFields form={form} />
          <DialogFooter className='pt-2'>
            <Button
              type='button'
              variant='outline'
              className='h-10 rounded-full border-[#cbd8e2] px-4 text-[13px] font-semibold text-[#1b1b1b] hover:bg-[#f8fafc]'
              onClick={() => {
                setOpen(false);
                form.reset();
              }}>
              취소
            </Button>
            <Button
              type='submit'
              className='h-10 rounded-full bg-[#1ba7a1] px-4 text-[13px] font-semibold text-white hover:bg-[#17928d]'>
              저장하기
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProductFields({ form }: { form: ReturnType<typeof useProductForm> }) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <>
      <div className='space-y-1'>
        <Label className='text-[12px] font-semibold text-[#1b1b1b]'>상품 이름</Label>
        <Input
          placeholder='예) 오늘의 반찬 세트'
          className='h-10 rounded-xl border-[#cbd8e2] text-[13px]'
          {...register('name', { required: '상품 이름을 입력해 주세요.' })}
        />
        {errors.name ? <p className='text-[11px] text-[#f43f5e]'>{errors.name.message}</p> : null}
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <div className='space-y-1'>
          <Label className='text-[12px] font-semibold text-[#1b1b1b]'>가격</Label>
          <Input
            inputMode='numeric'
            placeholder='예) 8900'
            className='h-10 rounded-xl border-[#cbd8e2] text-[13px]'
            {...register('price', {
              required: '가격을 입력해 주세요.',
              pattern: {
                value: /^\d+(,\d{3})*$/,
                message: '숫자만 입력해 주세요.',
              },
            })}
          />
          {errors.price ? <p className='text-[11px] text-[#f43f5e]'>{errors.price.message}</p> : null}
        </div>
        <div className='space-y-1'>
          <Label className='text-[12px] font-semibold text-[#1b1b1b]'>재고 수량</Label>
          <Input
            inputMode='numeric'
            placeholder='예) 10'
            className='h-10 rounded-xl border-[#cbd8e2] text-[13px]'
            {...register('quantity', {
              required: '재고 수량을 입력해 주세요.',
              pattern: {
                value: /^\d+$/,
                message: '숫자만 입력해 주세요.',
              },
            })}
          />
          {errors.quantity ? <p className='text-[11px] text-[#f43f5e]'>{errors.quantity.message}</p> : null}
        </div>
      </div>
      <div className='space-y-1'>
        <Label className='text-[12px] font-semibold text-[#1b1b1b]'>썸네일 이미지 URL (선택)</Label>
        <Input
          placeholder='예) https://...'
          className='h-10 rounded-xl border-[#cbd8e2] text-[13px]'
          {...register('thumbnail')}
        />
        <p className='text-[11px] text-[#6b7785]'>이미지가 없다면 자동으로 기본 이미지가 적용돼요.</p>
      </div>
    </>
  );
}

function useProductForm(options?: { defaultValues?: Partial<ProductFormValues> }) {
  return useForm<ProductFormValues>({
    defaultValues: {
      name: options?.defaultValues?.name ?? '',
      price: options?.defaultValues?.price ?? '',
      quantity: options?.defaultValues?.quantity ?? '',
      thumbnail: options?.defaultValues?.thumbnail ?? '',
    },
  });
}
