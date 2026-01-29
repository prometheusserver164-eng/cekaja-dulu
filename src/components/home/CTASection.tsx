import { ArrowRight, ShoppingBag, Users, Search, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';

export function CTASection() {
  const stats = [
    { icon: Search, value: '50K+', label: 'Produk Dianalisis' },
    { icon: Users, value: '1M+', label: 'Review Dikumpulkan' },
    { icon: Star, value: '98%', label: 'User Puas' },
  ];

  return (
    <section className="py-16 md:py-24 gradient-cta">
      <div className="container mx-auto">
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
              className="bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90 hover:-translate-y-1 group"
            >
              <span>Mulai Cek Produk</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-12 pt-12 border-t border-secondary-foreground/20">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-secondary-foreground/10 rounded-xl mb-2">
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
