import { Shield, Zap, Clock } from 'lucide-react';
import { SearchBar } from '../SearchBar';

export function HeroSection() {
  const trustBadges = [
    { icon: Shield, label: 'Gratis' },
    { icon: Zap, label: 'Tanpa Daftar' },
    { icon: Clock, label: 'Data Real-time' },
  ];

  return (
    <section className="relative overflow-hidden gradient-hero py-16 md:py-24">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6 animate-fade-in">
            <span className="text-sm font-medium text-primary">🚀 Platform Review Agregator #1 Indonesia</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 animate-fade-in-up">
            Sebelum Beli,{' '}
            <span className="text-gradient">Cek Dulu!</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Agregasi review dari Tokopedia, Shopee, Bukalapak, dan Lazada dalam satu tempat. 
            <span className="font-semibold text-foreground"> Belanja tanpa keraguan!</span>
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <SearchBar size="large" />
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            {trustBadges.map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 text-muted-foreground">
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                  <badge.icon className="h-4 w-4 text-success" />
                </div>
                <span className="text-sm font-medium">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
