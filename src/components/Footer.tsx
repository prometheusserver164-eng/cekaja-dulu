import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { Instagram, Twitter, Facebook, Mail, Youtube } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export const Footer = forwardRef<HTMLElement>((_, ref) => {
  const { settings } = useSiteSettings();

  const socialIcons = [
    { key: 'instagram', icon: Instagram, url: settings.social_links.instagram },
    { key: 'twitter', icon: Twitter, url: settings.social_links.twitter },
    { key: 'facebook', icon: Facebook, url: settings.social_links.facebook },
    { key: 'youtube', icon: Youtube, url: settings.social_links.youtube },
    { key: 'email', icon: Mail, url: settings.social_links.email ? `mailto:${settings.social_links.email}` : '' },
  ];

  const activeSocials = socialIcons.filter(s => s.url);

  return (
    <footer ref={ref} className="bg-card border-t border-border">
      <div className="container mx-auto py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Logo size="md" showTagline />
            <p className="mt-4 text-muted-foreground max-w-md">
              {settings.footer.about_text}
            </p>
            {activeSocials.length > 0 && (
              <div className="flex gap-4 mt-6">
                {activeSocials.map((social) => (
                  <a 
                    key={social.key}
                    href={social.url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <social.icon size={20} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Navigasi</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="text-muted-foreground hover:text-primary transition-colors">
                  Wishlist
                </Link>
              </li>
              <li>
                <Link to="/bandingkan" className="text-muted-foreground hover:text-primary transition-colors">
                  Bandingkan
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Informasi</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Tentang Kami
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Cara Kerja
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Kontak
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {settings.footer.copyright_year} {settings.branding.site_name}. Semua hak dilindungi.
            </p>
            <p className="text-xs text-muted-foreground text-center md:text-right">
              Disclaimer: Data review bersumber dari platform publik. {settings.branding.site_name} tidak bertanggung jawab 
              atas keakuratan informasi dari sumber asli.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';
