import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { Building2, Home, MapPin, Search, X } from 'lucide-react';

// Kakao Maps SDK typings (simple guard)
declare global {
  interface Window {
    kakao?: any;
  }
}

export type AddressRole = 'customer' | 'seller' | 'rider';

export interface AddressFormValues {
  keyword: string;
  selectedAddress?: {
    address: string;
    buildingName?: string;
    postalCode?: string;
  };
  unitNumber?: string;
  memo?: string;
  type: 'home' | 'company' | 'custom';
  setPrimary: boolean;
  agreeLocation: boolean;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
}

const TYPE_OPTIONS: Array<{
  value: AddressFormValues['type'];
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}> = [
  { value: 'home', label: '집', icon: Home },
  { value: 'company', label: '회사', icon: Building2 },
  { value: 'custom', label: '기타', icon: MapPin },
];

export interface AddressManageProps {
  defaultOpen?: boolean;
  role?: AddressRole;
  savedAddresses?: Array<{
    id: string;
    label: string;
    detail: string;
    isPrimary?: boolean;
    type: 'home' | 'company' | 'custom';
  }>;
  onSave?: (data: AddressFormValues) => void;
  onClose?: () => void;
}

export default function AddressManage({
  defaultOpen = true,
  role = 'customer',
  savedAddresses = [],
  onSave,
  onClose,
}: AddressManageProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const [searching, setSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<
    Array<{ id: string; address: string; buildingName?: string; postalCode?: string }>
  >([]);
  const [previewMap, setPreviewMap] = React.useState<string | null>(null);
  const isCustomer = role === 'customer';

  const form = useForm<AddressFormValues>({
    defaultValues: {
      keyword: '',
      type: 'custom',
      setPrimary: false,
      agreeLocation: false,
      bankName: '',
      accountNumber: '',
      accountHolder: '',
    },
  });
  const { register, handleSubmit, watch, setValue, formState } = form;
  const selectedAddress = watch('selectedAddress');
  const addressType = watch('type');

  const handleClose = React.useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const handleSearch = handleSubmit(async ({ keyword }) => {
    if (!keyword.trim()) return;
    setSearching(true);
    try {
      if (!window.kakao?.maps?.services) {
        console.warn('Kakao Maps API is not loaded yet.');
        return;
      }
      const ps = new window.kakao.maps.services.Places();
      ps.keywordSearch(keyword, (data: any, status: any) => {
        if (status === window.kakao?.maps?.services.Status.OK) {
          const mapped = data.slice(0, 5).map((item: any) => ({
            id: item.id,
            address: item.road_address_name || item.address_name,
            buildingName: item.place_name,
            postalCode: item.road_address?.zone_no,
          }));
          setSearchResults(mapped);
          setPreviewMap(mapped[0]?.address ?? null);
        } else {
          setSearchResults([]);
        }
      });
    } finally {
      setSearching(false);
    }
  });

  const handleSelectAddress = React.useCallback(
    (item: { id: string; address: string; buildingName?: string; postalCode?: string }) => {
      setValue('selectedAddress', {
        address: item.address,
        buildingName: item.buildingName,
        postalCode: item.postalCode,
      });
      setPreviewMap(item.address);
    },
    [setValue]
  );

  const onSubmit = React.useCallback(
    (values: AddressFormValues) => {
      if (!values.selectedAddress) return;
      onSave?.(values);
      handleClose();
    },
    [handleClose, onSave]
  );

  const onSaveDraft = React.useCallback(
    (values: AddressFormValues) => {
      onSave?.(values);
    },
    [onSave]
  );

  const canSubmit = Boolean(selectedAddress);

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 sm:px-0'>
      <Card className='w-full max-w-[26rem] rounded-3xl border-none bg-white shadow-xl sm:max-w-[28rem]'>
        <CardHeader className='space-y-3 pb-3 pt-6'>
          <div className='flex items-start justify-between'>
            <div>
              <CardTitle className='text-xl font-bold text-[#1b1b1b]'>주소 관리</CardTitle>
              <CardDescription className='mt-1 text-[13px] text-[#5c5c5c]'>
                즐겨찾는 주소를 등록하고 빠르게 배달을 요청해 보세요.
              </CardDescription>
            </div>
            <Button variant='ghost' size='icon' className='size-8 rounded-full text-[#1b1b1b]' onClick={handleClose}>
              <X className='size-5' aria-hidden />
            </Button>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className='space-y-5 px-6'>
            <section className='space-y-3'>
              <Label className='text-[13px] font-semibold text-[#1b1b1b]'>도로명, 건물명 또는 지번으로 검색</Label>
              <div className='flex items-center gap-2 rounded-2xl border border-[#bbe7e4] bg-[#f0fffd] px-3 py-2.5'>
                <Search className='size-[18px] text-[#2ac1bc]' aria-hidden />
                <Input
                  placeholder='예) 서울시 중구 세종대로 110'
                  className='h-9 border-0 bg-transparent text-[13px] text-[#1b1b1b] placeholder:text-[#9aa5b1] focus-visible:ring-0'
                  {...register('keyword', { required: true })}
                />
                <Button
                  type='button'
                  size='sm'
                  className='h-8 rounded-full bg-[#2ac1bc] px-4 text-[12px] font-semibold text-white hover:bg-[#1ba7a1]'
                  onClick={handleSearch}
                  disabled={searching}>
                  검색
                </Button>
              </div>
              {searchResults.length > 0 ? (
                <ul className='space-y-2 rounded-2xl bg-white px-3 py-2 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)]'>
                  {searchResults.map((item) => (
                    <li key={item.id}>
                      <button
                        type='button'
                        className={cn(
                          'w-full rounded-xl px-3 py-2 text-left text-[13px] transition-colors',
                          selectedAddress?.address === item.address
                            ? 'bg-[#2ac1bc]/10 text-[#1f6e6b]'
                            : 'text-[#1b1b1b] hover:bg-[#f5f7f9]'
                        )}
                        onClick={() => handleSelectAddress(item)}>
                        <p className='font-semibold'>{item.address}</p>
                        {item.buildingName ? <p className='text-[12px] text-[#667085]'>{item.buildingName}</p> : null}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : searching ? (
                <p className='text-[12px] text-[#6b7785]'>주소를 검색 중입니다…</p>
              ) : null}
            </section>

            {selectedAddress ? (
              <section className='space-y-3 rounded-2xl bg-white px-4 py-3 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)]'>
                <div className='space-y-1'>
                  <p className='text-sm font-semibold text-[#1b1b1b]'>{selectedAddress.address}</p>
                  {selectedAddress.buildingName ? (
                    <p className='text-[12px] text-[#6b7785]'>{selectedAddress.buildingName}</p>
                  ) : null}
                  {selectedAddress.postalCode ? (
                    <p className='text-[12px] text-[#9aa5b1]'>우편번호 {selectedAddress.postalCode}</p>
                  ) : null}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='unit-number' className='text-[12px] font-semibold text-[#1b1b1b]'>
                    상세 주소
                  </Label>
                  <Input
                    id='unit-number'
                    placeholder='예) 101동 1203호'
                    className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
                    {...register('unitNumber', { required: true })}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='memo' className='text-[12px] font-semibold text-[#1b1b1b]'>
                    배달 메모
                  </Label>
                  <Input
                    id='memo'
                    placeholder='예) 비밀번호 1234, 문 앞에 놓아 주세요'
                    className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
                    {...register('memo')}
                  />
                </div>
              </section>
            ) : null}

            <section className='space-y-3'>
              <Label className='text-[13px] font-semibold text-[#1b1b1b]'>주소 구분</Label>
              <div className='grid grid-cols-3 gap-2'>
                {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    type='button'
                    key={value}
                    className={cn(
                      'flex h-11 flex-col items-center justify-center rounded-2xl border text-[12px] font-semibold transition-colors',
                      addressType === value
                        ? 'border-transparent bg-[#2ac1bc] text-white shadow-[0_12px_32px_-24px_rgba(15,23,42,0.35)]'
                        : 'border-[#dbe4ec] bg-white text-[#1b1b1b] hover:bg-[#f5f7f9]'
                    )}
                    onClick={() => setValue('type', value)}>
                    <Icon className='mb-1 size-[18px]' aria-hidden />
                    {label}
                  </button>
                ))}
              </div>
              {!isCustomer && addressType !== 'custom' ? (
                <p className='text-[11px] text-[#f43f5e]'>집/회사 추가는 소비자 프로필에서만 지원됩니다.</p>
              ) : null}
            </section>

            <section className='space-y-3 rounded-2xl bg-white px-4 py-3 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)]'>
              <div className='flex items-center justify-between'>
                <label className='flex items-center gap-3 text-[13px] text-[#1b1b1b]'>
                  <Checkbox
                    className='size-4 rounded-md border-[#cbd8e2] accent-[#2ac1bc] sm:size-5'
                    {...register('setPrimary')}
                    disabled={!isCustomer}
                  />
                  <span className='font-semibold'>즐겨찾는 주소로 설정</span>
                </label>
                {!isCustomer ? <span className='text-[11px] text-[#9aa5b1]'>사용자 프로필에서만 가능</span> : null}
              </div>

              <label className='flex items-start gap-3 rounded-xl bg-[#f0fffd] px-3.5 py-3 text-[13px] text-[#1b1b1b] sm:px-4 sm:text-sm'>
                <Checkbox
                  className='mt-1 size-4 rounded-md border-[#cbd8e2] accent-[#2ac1bc] sm:size-5'
                  {...register('agreeLocation', { required: '위치 정보 동의가 필요합니다.' })}
                />
                <span className='space-y-1'>
                  <span className='block text-[13px] font-semibold sm:text-sm'>위치 정보 이용 동의</span>
                  <span className='block text-[12px] text-[#6b7785] sm:text-xs'>
                    실시간 배차와 배송 추적을 위해 위치 정보를 활용합니다.
                  </span>
                </span>
              </label>
              {formState.errors.agreeLocation ? (
                <p className='text-[11px] text-[#f43f5e] sm:text-xs'>{formState.errors.agreeLocation.message}</p>
              ) : null}
            </section>

            {savedAddresses.length > 0 ? (
              <section className='space-y-2'>
                <p className='text-[12px] font-semibold text-[#1b1b1b]'>등록된 주소</p>
                <div className='space-y-2 rounded-2xl bg-white px-3 py-2 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)]'>
                  {savedAddresses.map((item) => (
                    <button
                      key={item.id}
                      type='button'
                      className='flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] text-[#1b1b1b] transition-colors hover:bg-[#f5f7f9]'
                      onClick={() =>
                        handleSelectAddress({ id: item.id, address: item.detail, buildingName: item.label })
                      }>
                      <span className='space-y-0.5'>
                        <span className='font-semibold'>{item.label}</span>
                        <span className='block text-[12px] text-[#6b7785]'>{item.detail}</span>
                      </span>
                      {item.isPrimary ? (
                        <span className='rounded-full bg-[#2ac1bc]/10 px-2 py-0.5 text-[11px] font-semibold text-[#1f6e6b]'>
                          기본
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {previewMap ? (
              <section className='space-y-2 rounded-2xl bg-white px-4 py-3 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)]'>
                <p className='text-[12px] font-semibold text-[#1b1b1b]'>지도 미리보기 (Kakao)</p>
                <div className='flex h-40 items-center justify-center rounded-xl bg-[#e2f6f5] text-center text-[12px] text-[#1f6e6b]'>
                  {previewMap}
                </div>
                <p className='text-[11px] text-[#6b7785]'>
                  실제 서비스에서는 Kakao Maps SDK를 활용해 좌표 기반 지도를 노출합니다.
                </p>
              </section>
            ) : null}

            <section className='space-y-3 rounded-2xl bg-white px-4 py-3 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)]'>
              <Label className='text-[13px] font-semibold text-[#1b1b1b]'>정산 계좌 정보</Label>
              <div className='grid grid-cols-1 gap-2'>
                <Input
                  placeholder='은행명 (선택)'
                  className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
                  {...register('bankName')}
                />
                <Input
                  placeholder='계좌번호 (선택)'
                  className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
                  {...register('accountNumber')}
                />
                <Input
                  placeholder='예금주 (선택)'
                  className='h-9 rounded-xl border-[#dbe4ec] text-[13px]'
                  {...register('accountHolder')}
                />
              </div>
              <p className='text-[11px] text-[#6b7785]'>
                판매자·라이더의 정산 계좌를 미리 입력해 두면 등록이 훨씬 빨라져요.
              </p>
            </section>
          </CardContent>

          <CardFooter className='flex flex-col gap-2 px-6 pb-6 pt-0 sm:flex-row sm:items-center sm:justify-end'>
            <Button
              type='button'
              variant='outline'
              className='h-10 w-full rounded-full border-[#dbe4ec] text-[13px] font-semibold text-[#2ac1bc] hover:border-[#2ac1bc] hover:bg-[#2ac1bc]/10 sm:h-11 sm:w-auto sm:px-6'
              onClick={handleSubmit(onSaveDraft)}>
              임시 저장
            </Button>
            <Button
              type='submit'
              disabled={!canSubmit || formState.isSubmitting}
              className='h-10 w-full rounded-full bg-[#1ba7a1] text-[13px] font-semibold text-white hover:bg-[#17928d] disabled:cursor-not-allowed disabled:opacity-70 sm:h-11 sm:w-auto sm:px-8'>
              주소 등록하기
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
