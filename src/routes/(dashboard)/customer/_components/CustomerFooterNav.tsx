import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FooterNavItem {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface CustomerFooterNavProps {
  items: FooterNavItem[];
  activeIndex?: number;
  onClickItem?: (index: number) => void;
  className?: string;
}

export function CustomerFooterNav({ items, onClickItem, className }: CustomerFooterNavProps) {
  return (
    <footer className={cn('border-t border-white/20 bg-[#2ac1bc] px-3 py-3 text-white sm:px-6', 'h-[60px]', className)}>
      <nav className='flex items-center justify-between text-[10px] font-semibold'>
        {items.map((item, index) => (
          <button
            key={item.label}
            type='button'
            onClick={() => onClickItem?.(index)}
            className={cn(
              'flex flex-col cursor-pointer items-center gap-1 rounded-full px-2 text-white/80 transition-colors hover:text-white'
            )}>
            <item.icon className='size-4' aria-hidden />
            {item.label}
          </button>
        ))}
      </nav>
    </footer>
  );
}

export default CustomerFooterNav;
