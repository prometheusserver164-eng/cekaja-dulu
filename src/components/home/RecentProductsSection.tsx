import { ArrowRight, Search, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { recentProducts } from '@/lib/mockData';
import { ProductCard } from '../ProductCard';
import { Button } from '../ui/button';

export function RecentProductsSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Produk yang Baru Dicek
              </h2>
            </div>
            <p className="text-muted-foreground ml-12">
              Lihat apa yang sedang dicek orang lain
            </p>
          </div>
          <Button variant="outline" className="group rounded-xl">
            <span>Lihat Semua</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-5 md:overflow-visible scrollbar-hide">
          {recentProducts.map((product, index) => (
            <div 
              key={product.id} 
              className="min-w-[260px] md:min-w-0 animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
