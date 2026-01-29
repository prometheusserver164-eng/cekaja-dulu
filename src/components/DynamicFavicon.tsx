import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export function DynamicFavicon() {
  const { settings, loading } = useSiteSettings();

  useEffect(() => {
    if (loading) return;

    const faviconUrl = settings.branding.favicon_url;
    
    if (faviconUrl) {
      // Update existing favicon links
      const existingLinks = document.querySelectorAll("link[rel*='icon']");
      existingLinks.forEach(link => link.remove());

      // Create new favicon link
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = faviconUrl;
      
      // Determine type based on URL
      if (faviconUrl.includes('.png')) {
        link.type = 'image/png';
      } else if (faviconUrl.includes('.svg')) {
        link.type = 'image/svg+xml';
      } else if (faviconUrl.includes('.ico')) {
        link.type = 'image/x-icon';
      }
      
      document.head.appendChild(link);

      // Also update apple-touch-icon if it exists
      const appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.href = faviconUrl;
      document.head.appendChild(appleLink);
    }
  }, [settings.branding.favicon_url, loading]);

  return null;
}
