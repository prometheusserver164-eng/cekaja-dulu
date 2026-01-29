import { Link } from 'react-router-dom';
import { Heart, Bell, BellOff, Trash2, TrendingDown, Eye, ShoppingBag } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PlatformBadge } from '@/components/PlatformBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useStore } from '@/store/useStore';
import { formatPrice, getDiscountPercentage } from '@/lib/mockData';
import { Star } from 'lucide-react';

const Wishlist = () => {
  const { wishlist, removeFromWishlist, toggleAlert } = useStore();

  const clearAll = () => {
    wishlist.forEach(item => removeFromWishlist(item.id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Wishlist Saya 💝
              </h1>
              <p className="text-muted-foreground">
                {wishlist.length} produk tersimpan
              </p>
            </div>
            {wishlist.length > 0 && (
              <Button variant="outline" className="text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={clearAll}>
                <Trash2 className="h-4 w-4" />
                Bersihkan Semua
              </Button>
            )}
          </div>

          {/* Wishlist Grid */}
          {wishlist.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((item, index) => (
                <Card 
                  key={item.id} 
                  className="group overflow-hidden transition-all duration-300 hover:card-shadow-hover hover:-translate-y-1 animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute top-2 left-2">
                        <PlatformBadge platform={item.platform} />
                      </div>
                      {item.originalPrice && (
                        <Badge className="absolute top-2 right-2 bg-success text-success-foreground">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          Turun {getDiscountPercentage(item.originalPrice, item.price)}%
                        </Badge>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1 mb-3">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span className="text-sm font-semibold">{item.rating || 0}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(item.totalReviews || 0).toLocaleString('id-ID')} review)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl font-bold text-success">
                          {formatPrice(item.price)}
                        </span>
                        {item.originalPrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(item.originalPrice)}
                          </span>
                        )}
                      </div>

                      {/* Alert Toggle */}
                      <div className="flex items-center justify-between py-3 border-t border-border">
                        <div className="flex items-center gap-2">
                          {item.alertEnabled ? (
                            <Bell className="h-4 w-4 text-primary" />
                          ) : (
                            <BellOff className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm">Alert Harga</span>
                        </div>
                        <Switch
                          checked={item.alertEnabled}
                          onCheckedChange={() => toggleAlert(item.id)}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t border-border">
                        <Button variant="outline" className="flex-1" asChild>
                          <Link to={`/analisis/${item.id}`}>
                            <Eye className="h-4 w-4" />
                            Lihat Analisis
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => removeFromWishlist(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Empty State */
            <Card className="p-12 text-center animate-fade-in">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <Heart className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Wishlist kamu masih kosong</h3>
                <p className="text-muted-foreground mb-6">
                  Mulai cek produk dan simpan favoritmu di sini! Kamu juga bisa aktifkan 
                  notifikasi harga untuk produk yang kamu incar.
                </p>
                <Button variant="hero" size="lg" asChild>
                  <Link to="/">
                    <ShoppingBag className="h-5 w-5" />
                    Cek Produk Sekarang
                  </Link>
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Wishlist;
