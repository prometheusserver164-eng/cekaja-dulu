import { platformColors, platformNames } from '@/lib/mockData';

interface PlatformBadgeProps {
  platform: keyof typeof platformColors;
  size?: 'sm' | 'md';
}

export function PlatformBadge({ platform, size = 'sm' }: PlatformBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium text-white ${sizeClasses[size]}`}
      style={{ backgroundColor: platformColors[platform] }}
    >
      {platformNames[platform]}
    </span>
  );
}
