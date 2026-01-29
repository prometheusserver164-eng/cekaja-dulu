import { forwardRef } from 'react';
import { platformColors, platformNames } from '@/lib/mockData';

interface PlatformBadgeProps {
  platform: keyof typeof platformColors;
  size?: 'sm' | 'md';
}

export const PlatformBadge = forwardRef<HTMLSpanElement, PlatformBadgeProps>(
  ({ platform, size = 'sm' }, ref) => {
    const sizeClasses = {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-sm px-3 py-1',
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center rounded-full font-medium text-white ${sizeClasses[size]}`}
        style={{ backgroundColor: platformColors[platform] }}
      >
        {platformNames[platform]}
      </span>
    );
  }
);

PlatformBadge.displayName = 'PlatformBadge';
