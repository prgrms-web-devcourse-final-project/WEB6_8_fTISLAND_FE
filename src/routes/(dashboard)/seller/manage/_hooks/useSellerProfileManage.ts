import { toast } from 'sonner';
import { useGetMyProfile, useUpdateAccountInfo, useUpdateBusinessInfo } from '@/api/generated';
import type { SellerProfileResponse } from '@/api/generated/model/sellerProfileResponse';

interface BusinessInfoFormValues {
  businessName?: string;
  businessPhoneNumber?: string;
}

interface AccountInfoFormValues {
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
}

export function useSellerProfileManage() {
  const profileQuery = useGetMyProfile({
    query: { staleTime: 10_000, refetchOnWindowFocus: false },
  } as any);

  const profile = ((profileQuery.data as any)?.data?.content ?? undefined) as SellerProfileResponse | undefined;

  const updateBusinessMutation = useUpdateBusinessInfo({
    mutation: {
      onSuccess: () => {
        toast.success('사업자 정보가 저장되었어요.');
        profileQuery.refetch();
      },
      onError: () => {
        toast.error('사업자 정보 저장에 실패했어요. 잠시 후 다시 시도해 주세요.');
      },
    },
  });

  const updateAccountMutation = useUpdateAccountInfo({
    mutation: {
      onSuccess: () => {
        toast.success('정산 계좌 정보가 저장되었어요.');
        profileQuery.refetch();
      },
      onError: () => {
        toast.error('정산 계좌 저장에 실패했어요. 잠시 후 다시 시도해 주세요.');
      },
    },
  });

  const submitBusinessInfo = (values: BusinessInfoFormValues) => {
    updateBusinessMutation.mutate({ data: values as any });
  };

  const submitAccountInfo = (values: AccountInfoFormValues) => {
    updateAccountMutation.mutate({ data: values as any });
  };

  return {
    profile,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    submitBusinessInfo,
    submitAccountInfo,
    isUpdatingBusiness: (updateBusinessMutation as any).isPending ?? (updateBusinessMutation as any).isLoading,
    isUpdatingAccount: (updateAccountMutation as any).isPending ?? (updateAccountMutation as any).isLoading,
  };
}

export type { BusinessInfoFormValues, AccountInfoFormValues };
