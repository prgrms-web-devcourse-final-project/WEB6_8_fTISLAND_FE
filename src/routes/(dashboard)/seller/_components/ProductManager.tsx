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
import { usePresignedUpload } from '@/lib/usePresignedUpload';
import { GeneratePresignedUrlRequestDomain } from '@/api/generated/model/generatePresignedUrlRequestDomain';
import { useCreateProduct, useUpdateProduct, getSearchProductsInfiniteQueryKey } from '@/api/generated';
import type { ProductCreateRequest } from '@/api/generated/model/productCreateRequest';
import type { ProductUpdateRequest } from '@/api/generated/model/productUpdateRequest';
import { toast } from 'sonner';
import { useStoreDetailsStore } from '@/store/storeDetails';
import { useQueryClient } from '@tanstack/react-query';
import { useDeleteProduct } from '@/api/generated';
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
  // 사용 가능 수량 바인딩
  quantity: number; // availableQuantity로부터 매핑해 전달
  thumbnail: string;
};

export type ProductFormValues = {
  name: string;
  price: string;
  quantity: string;
  thumbnail: string;
  description: string;
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
            <span className='rounded-full bg-[#f1f5f9] px-2.5 py-0.5 font-semibold text-[#334155]'>
              재고 {new Intl.NumberFormat('ko-KR').format(product.quantity)}개
            </span>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <EditProductDialog product={product} onSave={onUpdate} />
          <DeleteProductButton productId={product.id} onDeleted={() => onDelete(product.id)} />
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

function DeleteProductButton({ productId, onDeleted }: { productId: string; onDeleted(): void }) {
  const [open, setOpen] = React.useState(false);
  const deleteMutation = useDeleteProduct();
  const selectedStoreId = useStoreDetailsStore((s) => s.selectedStore?.id) ?? 1;
  const qc = useQueryClient();
  const numericProductId = Number(
    /^-?\d+(?:\.\d+)?$/.test(productId) ? productId : (productId as any)?.replace?.(/^PRD-/, '')
  );

  return (
    <>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='size-9 rounded-full border border-[#f87171]/60 text-[#f87171] hover:bg-[#f87171]/10'
        onClick={() => setOpen(true)}>
        <Trash2 className='size-4' aria-hidden />
        <span className='sr-only'>상품 삭제</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-sm rounded-2xl border-none bg-white p-6 shadow-[0_28px_72px_-28px_rgba(15,23,42,0.45)]'>
          <DialogHeader>
            <DialogTitle className='text-[16px] font-semibold text-[#1b1b1b]'>상품을 삭제할까요?</DialogTitle>
            <DialogDescription className='text-[12px] text-[#6b7785]'>삭제 후에는 되돌릴 수 없어요.</DialogDescription>
          </DialogHeader>
          <DialogFooter className='pt-2'>
            <Button
              type='button'
              variant='outline'
              className='h-10 rounded-full border-[#cbd8e2] px-4 text-[13px] font-semibold text-[#1b1b1b] hover:bg-[#f8fafc]'
              onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button
              type='button'
              disabled={deleteMutation.isPending}
              aria-busy={deleteMutation.isPending}
              className='h-10 rounded-full bg-[#ef4444] px-4 text-[13px] font-semibold text-white hover:bg-[#dc2626]'
              onClick={() => {
                if (!Number.isFinite(numericProductId) || numericProductId <= 0) {
                  toast.error('올바르지 않은 상품 ID입니다.');
                  return;
                }
                deleteMutation.mutate(
                  { storeId: selectedStoreId, productId: numericProductId },
                  {
                    onSuccess: () => {
                      toast.success('상품을 삭제했어요.');
                      setOpen(false);
                      onDeleted();
                      try {
                        qc.invalidateQueries({
                          queryKey: getSearchProductsInfiniteQueryKey(selectedStoreId, {
                            request: { limit: 10 },
                          } as any),
                        });
                      } catch {}
                    },
                    onError: () => {
                      toast.error('상품 삭제에 실패했어요. 잠시 후 다시 시도해 주세요.');
                    },
                  }
                );
              }}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AddProductDialog({ onSave }: { onSave(product: ManagedProduct): void }) {
  const [open, setOpen] = React.useState(false);
  const keyboardOffset = useDialogKeyboardOffset(open);
  const form = useProductForm();
  const createProductMutation = useCreateProduct();
  const selectedStoreId = useStoreDetailsStore((s) => s.selectedStore?.id) ?? 1;
  const qc = useQueryClient();

  const handleSubmit = form.handleSubmit((values) => {
    const req: ProductCreateRequest = {
      name: values.name,
      description: values.description || '',
      price: Number(values.price.replace(/,/g, '')),
      imageUrl: values.thumbnail || '',
      initialStock: Number(values.quantity),
    };
    createProductMutation.mutate(
      { storeId: selectedStoreId, data: req },
      {
        onSuccess: () => {
          toast.success('상품이 등록되었어요.');
          const newProduct: ManagedProduct = {
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
            name: values.name,
            price: Number(values.price.replace(/,/g, '')),
            quantity: Number(values.quantity),
            thumbnail: values.thumbnail,
          };
          onSave(newProduct);
          try {
            qc.invalidateQueries({
              queryKey: getSearchProductsInfiniteQueryKey(selectedStoreId, { request: { limit: 10 } } as any),
            });
          } catch {}
          setOpen(false);
          form.reset();
        },
        onError: () => {
          toast.error('상품 등록에 실패했어요. 잠시 후 다시 시도해 주세요.');
        },
      }
    );
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
              disabled={createProductMutation.isPending}
              aria-busy={createProductMutation.isPending}
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
      description: '',
    },
  });
  const updateMutation = useUpdateProduct();
  const selectedStoreId = useStoreDetailsStore((s) => s.selectedStore?.id) ?? 1;
  const numericProductId = Number(product.id);
  const qc = useQueryClient();

  const handleSubmit = form.handleSubmit((values) => {
    const req: ProductUpdateRequest = {
      name: values.name,
      price: Number(values.price.replace(/,/g, '')),
      imageUrl: values.thumbnail || undefined,
      description: values.description || undefined,
      newStockQuantity: Number(values.quantity),
      // description은 현재 폼에 없어 undefined 유지
    };
    updateMutation.mutate(
      { storeId: selectedStoreId, productId: numericProductId, data: req },
      {
        onSuccess: () => {
          toast.success('상품 정보를 수정했어요.');
          const updated: ManagedProduct = {
            ...product,
            name: values.name,
            price: Number(values.price.replace(/,/g, '')),
            quantity: Number(values.quantity),
            thumbnail: values.thumbnail,
          };
          onSave(product.id, updated);
          try {
            qc.invalidateQueries({
              queryKey: getSearchProductsInfiniteQueryKey(selectedStoreId, { request: { limit: 10 } } as any),
            });
          } catch {}
          setOpen(false);
        },
        onError: () => {
          toast.error('상품 수정에 실패했어요. 잠시 후 다시 시도해 주세요.');
        },
      }
    );
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
              disabled={updateMutation.isPending}
              aria-busy={updateMutation.isPending}
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
    setValue,
    watch,
  } = form;
  const uploadMutation = usePresignedUpload();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

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
        <Label className='text-[12px] font-semibold text-[#1b1b1b]'>상품 설명</Label>
        <Input
          placeholder='예) 원산지/구성/특징 등'
          className='h-10 rounded-xl border-[#cbd8e2] text-[13px]'
          {...register('description', { required: '상품 설명을 입력해 주세요.' })}
        />
        {errors.description ? <p className='text-[11px] text-[#f43f5e]'>{errors.description.message}</p> : null}
      </div>
      <div className='space-y-1'>
        <Label className='text-[12px] font-semibold text-[#1b1b1b]'>썸네일 이미지</Label>
        <input type='hidden' {...register('thumbnail', { required: '썸네일 이미지를 업로드해 주세요.' })} />
        <div className='flex items-center gap-3'>
          <ThumbnailPreview src={watch('thumbnail')} name={watch('name') || '상품 이미지'} />
          <div className='flex gap-2'>
            <Button
              type='button'
              disabled={uploadMutation.isPending}
              aria-busy={uploadMutation.isPending}
              className='h-9 rounded-full bg-[#1ba7a1] px-3 text-[12px] font-semibold text-white hover:bg-[#17928d]'
              onClick={() => fileInputRef.current?.click()}>
              {watch('thumbnail') ? '다시 선택' : '이미지 선택'}
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            className='hidden'
            onChange={async (e) => {
              const file = e.currentTarget.files?.[0];
              if (!file) return;
              try {
                const { objectUrl } = await uploadMutation.mutateAsync({
                  file,
                  domain: GeneratePresignedUrlRequestDomain.PRODUCT,
                  contentType: (file as any).type || 'application/octet-stream',
                });
                setValue('thumbnail', objectUrl, { shouldDirty: true, shouldValidate: true });
                // clear to allow selecting the same file again
                e.currentTarget.value = '';
              } catch {
                // handled by hook toast
              }
            }}
          />
        </div>
        {errors.thumbnail ? <p className='text-[11px] text-[#f43f5e]'>{errors.thumbnail.message}</p> : null}
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
      description: options?.defaultValues?.description ?? '',
    },
  });
}
