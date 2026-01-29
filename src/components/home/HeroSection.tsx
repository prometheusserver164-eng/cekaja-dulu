import { Shield, Zap, Clock, Sparkles, Store, BadgeCheck } from 'lucide-react';
import { SearchBar } from '../SearchBar';

export function HeroSection() {
  const trustBadges = [
    { icon: Shield, label: 'Gratis Selamanya' },
    { icon: Zap, label: 'Tanpa Registrasi' },
    { icon: Clock, label: 'Data Real-time' },
  ];

  const supportedPlatforms = [
    { name: 'Tokopedia', color: 'bg-[#00AA5B]' },
    { name: 'Shopee', color: 'bg-[#EE4D2D]' },
    { name: 'Bukalapak', color: 'bg-[#E31E52]' },
    { name: 'Lazada', color: 'bg-[#0F1689]' },
  ];

  return (
    <section className="relative overflow-hidden gradient-hero py-16 md:py-28">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      </div>

      <div className="container mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Platform Review Agregator #1 Indonesia</span>
            <BadgeCheck className="h-4 w-4 text-primary" />
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 animate-fade-in-up leading-tight">
            Sebelum Beli,{' '}
            <span className="text-gradient">Cek Dulu!</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Agregasi review dari berbagai marketplace dalam satu tempat. 
            <span className="font-semibold text-foreground"> Belanja tanpa keraguan!</span>
          </p>

          {/* Supported platforms */}
          <div className="flex items-center justify-center gap-3 mb-10 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <Store className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              {supportedPlatforms.map((platform) => (
                <div 
                  key={platform.name}
                  className={`${platform.color} text-white text-xs font-medium px-2.5 py-1 rounded-md`}
                >
                  {platform.name}
                </div>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <SearchBar size="large" />
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            {trustBadges.map((badge) => (
              <div key={badge.label} className="flex items-center gap-2.5 px-4 py-2 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <badge.icon className="h-4 w-4 text-success" />
                </div>
                <span className="text-sm font-medium text-foreground">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
