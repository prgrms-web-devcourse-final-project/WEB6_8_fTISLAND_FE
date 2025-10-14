import { cn } from '@/lib/utils';
import { useGetAvailableProfiles, useSwitchProfile } from '@/api/generated';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';

export type ProfileRole = 'consumer' | 'seller' | 'rider';

interface ProfileRoleSwitcherProps {
  roles?: { key: ProfileRole; label: string }[];
  value: ProfileRole;
  onChange(value: ProfileRole): void;
}

const DEFAULT_ROLES: Array<{ key: ProfileRole; label: string }> = [
  { key: 'consumer', label: '소비자' },
  { key: 'seller', label: '판매자' },
  { key: 'rider', label: '배달원' },
];

export function ProfileRoleSwitcher({ roles = DEFAULT_ROLES, value, onChange }: ProfileRoleSwitcherProps) {
  const navigate = useNavigate();
  const { data } = useGetAvailableProfiles();
  const available = (data as any)?.data?.content?.availableProfiles as string[] | undefined;
  const switchMutation = useSwitchProfile({
    mutation: {
      onSuccess: (res) => {
        const content = (res as any)?.data?.content;
        // Authorization 헤더에서 새 토큰을 캡처하여 로컬스토리지에 저장
        let newAccessToken: string | undefined;
        try {
          const hdr = (res as any)?.headers?.authorization ?? (res as any)?.headers?.Authorization;
          newAccessToken =
            typeof hdr === 'string' && hdr.toLowerCase().startsWith('bearer ')
              ? hdr.slice(7)
              : typeof hdr === 'string'
                ? hdr
                : undefined;
        } catch {}
        const type = content?.currentProfileType ?? content?.currentActiveProfileType;
        const profileId = content?.currentProfileDetail?.profileId ?? content?.currentActiveProfileId;
        const storeId = content?.currentProfileDetail?.storeId ?? content?.storeId;
        // Persist switched profile info
        useAuthStore.getState().setAuth({
          ...(newAccessToken ? { accessToken: newAccessToken } : {}),
          currentActiveProfileType: type,
          currentActiveProfileId: profileId,
          storeId,
        });
        toast.success('프로필이 전환되었습니다.');
        if (type === 'CUSTOMER') navigate({ to: '/customer' });
        else if (type === 'SELLER') navigate({ to: '/seller' });
        else if (type === 'RIDER') navigate({ to: '/rider' });
      },
    },
  });

  const toApiType = (k: ProfileRole): 'CUSTOMER' | 'SELLER' | 'RIDER' =>
    k === 'consumer' ? 'CUSTOMER' : (k.toUpperCase() as any);

  return (
    <div className='flex items-center gap-1 rounded-full bg-[#e9f6f5] p-1 text-[12px] font-semibold text-[#1b1b1b]'>
      {roles.map(({ key, label }) => {
        const isActive = value === key;
        const apiType = toApiType(key);
        const isEnabled = !available || available.includes(apiType);
        return (
          <button
            key={key}
            type='button'
            disabled={!isEnabled || (isActive && !available)}
            onClick={async () => {
              onChange(key);
              if (!isEnabled) return;
              await switchMutation.mutateAsync({ data: { targetProfileType: apiType } as any });
            }}
            className={cn(
              'rounded-full px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
              isActive ? 'bg-white shadow-sm text-[#1b1b1b]' : 'text-[#6b7785] hover:text-[#1b1b1b]'
            )}>
            {label}
          </button>
        );
      })}
    </div>
  );
}
