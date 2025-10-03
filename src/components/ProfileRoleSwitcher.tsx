import { cn } from '@/lib/utils';

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
  return (
    <div className='flex items-center gap-1 rounded-full bg-[#e9f6f5] p-1 text-[12px] font-semibold text-[#1b1b1b]'>
      {roles.map(({ key, label }) => {
        const isActive = value === key;
        return (
          <button
            key={key}
            type='button'
            onClick={() => onChange(key)}
            className={cn(
              'rounded-full px-3 py-1.5 transition-colors',
              isActive ? 'bg-white shadow-sm text-[#1b1b1b]' : 'text-[#6b7785] hover:text-[#1b1b1b]'
            )}>
            {label}
          </button>
        );
      })}
    </div>
  );
}
