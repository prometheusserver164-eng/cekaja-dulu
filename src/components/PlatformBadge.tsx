import * as React from 'react';
import { platformColors, platformNames } from '@/lib/mockData';

interface PlatformBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  platform: keyof typeof platformColors;
  size?: 'sm' | 'md';
}

const PlatformBadge = React.forwardRef<HTMLSpanElement, PlatformBadgeProps>(
  ({ platform, size = 'sm', className, ...props }, ref) => {
    const sizeClasses = {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-sm px-3 py-1',
    };

    // Handle unknown platforms gracefully
    const bgColor = platformColors[platform] || '#6b7280';
    const displayName = platformNames[platform] || platform;

    return (
      <span
        ref={ref}
        className={`inline-flex items-center rounded-full font-medium text-white ${sizeClasses[size]} ${className || ''}`}
        style={{ backgroundColor: bgColor }}
        {...props}
      >
        {displayName}
      </span>
    );
  }
);

PlatformBadge.displayName = 'PlatformBadge';

export { PlatformBadge };
