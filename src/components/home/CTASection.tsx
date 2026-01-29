import { ArrowRight, ShoppingBag, Users, Search, Star, Sparkles, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';

export function CTASection() {
  const stats = [
    { icon: Search, value: '50K+', label: 'Produk Dianalisis' },
    { icon: Users, value: '1M+', label: 'Review Dikumpulkan' },
    { icon: Star, value: '98%', label: 'User Puas' },
  ];

  return (
    <section className="py-16 md:py-24 gradient-cta relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-32 h-32 bg-secondary-foreground/5 rounded-full blur-2xl" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-secondary-foreground/5 rounded-full blur-2xl" />
      </div>

      <div className="container mx-auto relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-foreground/10 rounded-2xl mb-6 animate-bounce-soft">
            <ShoppingBag className="h-8 w-8 text-secondary-foreground" />
          </div>

          {/* Heading */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-secondary-foreground mb-6">
            Udah siap belanja cerdas?
          </h2>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-secondary-foreground/80 mb-10 max-w-xl mx-auto">
            Jangan sampai nyesel beli produk yang salah. Cek review dulu sebelum checkout!
          </p>

          {/* CTA Button */}
          <Link to="/">
            <Button 
              size="xl" 
              className="bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90 hover:-translate-y-1 group rounded-2xl shadow-lg"
            >
              <Sparkles className="h-5 w-5" />
              <span>Mulai Cek Produk</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <div className="flex items-center gap-1.5 text-sm text-secondary-foreground/70">
              <CheckCircle className="h-4 w-4" />
              <span>Gratis selamanya</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-secondary-foreground/70">
              <CheckCircle className="h-4 w-4" />
              <span>Tanpa registrasi</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-secondary-foreground/70">
              <CheckCircle className="h-4 w-4" />
              <span>Analisis AI akurat</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-12 pt-12 border-t border-secondary-foreground/20">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-secondary-foreground/10 rounded-2xl mb-3">
                  <stat.icon className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div className="text-3xl md:text-4xl font-extrabold text-secondary-foreground">{stat.value}</div>
                <div className="text-sm text-secondary-foreground/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
