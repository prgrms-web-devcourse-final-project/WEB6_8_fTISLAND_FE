import * as React from 'react';
import { cn } from '@/lib/utils';

export interface RiderFooterNavItem {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface RiderFooterNavProps {
  items: RiderFooterNavItem[];
  activeIndex?: number;
  onClickItem?: (index: number) => void;
  className?: string;
}

export function RiderFooterNav({ items, activeIndex = 0, onClickItem, className }: RiderFooterNavProps) {
  return (
    <footer className={cn('border-t border-white/20 bg-[#2ac1bc] px-3 py-3 text-white sm:px-6', 'h-[60px]', className)}>
      <nav className='flex items-center justify-between text-[10px] font-semibold'>
        {items.map((item, index) => (
          <button
            key={item.label}
            type='button'
            onClick={() => onClickItem?.(index)}
            aria-current={index === activeIndex ? 'page' : undefined}
            className={cn('flex flex-col cursor-pointer items-center gap-1 rounded-full px-2 transition-colors')}>
            <item.icon className={cn('transition-all', index === activeIndex ? 'size-5' : 'size-4')} aria-hidden />
            <span className={cn(index === activeIndex ? 'font-extrabold' : 'font-semibold')}>{item.label}</span>
            <span
              aria-hidden
              className={cn(
                'mt-0.5 h-0.5 w-4 rounded-full bg-transparent transition-colors',
                index === activeIndex && 'bg-white'
              )}
            />
          </button>
        ))}
      </nav>
    </footer>
  );
}

export default RiderFooterNav;
