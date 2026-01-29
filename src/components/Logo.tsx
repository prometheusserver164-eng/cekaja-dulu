import { forwardRef } from 'react';
import { Search, CheckCircle } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

export const Logo = forwardRef<HTMLDivElement, LogoProps>(
  ({ size = 'md', showTagline = false, className = '' }, ref) => {
    const { settings, loading } = useSiteSettings();

    const sizes = {
      sm: { text: 'text-xl', icon: 16, img: 'h-8 w-8' },
      md: { text: 'text-2xl', icon: 20, img: 'h-10 w-10' },
      lg: { text: 'text-4xl', icon: 28, img: 'h-14 w-14' },
    };

    const hasCustomLogo = settings.branding.logo_url && !loading;

    return (
      <div ref={ref} className={`flex items-center gap-2 ${className}`}>
        {hasCustomLogo ? (
          <img 
            src={settings.branding.logo_url!} 
            alt={settings.branding.site_name}
            className={`${sizes[size].img} object-contain rounded-lg`}
          />
        ) : (
          <div className="relative">
            <div className="gradient-secondary rounded-xl p-2">
              <Search className="text-secondary-foreground" size={sizes[size].icon} />
            </div>
            <CheckCircle 
              className="absolute -bottom-1 -right-1 text-success fill-success-foreground" 
              size={sizes[size].icon * 0.6} 
            />
          </div>
        )}
        <div className="flex flex-col">
          <span className={`${sizes[size].text} font-extrabold text-gradient`}>
            {settings.branding.site_name || 'CekLagi'}
          </span>
          {showTagline && (
            <span className="text-xs text-muted-foreground">
              {settings.branding.tagline || 'Sebelum Beli, Cek Lagi!'}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Logo.displayName = 'Logo';
