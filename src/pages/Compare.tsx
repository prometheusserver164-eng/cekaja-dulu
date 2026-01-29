import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X, Star, TrendingDown, AlertTriangle, Check } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SearchBar } from '@/components/SearchBar';
import { PlatformBadge } from '@/components/PlatformBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStore } from '@/store/useStore';
import { recentProducts, formatPrice, Product } from '@/lib/mockData';

const Compare = () => {
  const { comparisonProducts, removeFromComparison, clearComparison } = useStore();
  const [slots, setSlots] = useState<(Product | null)[]>([
    comparisonProducts[0] || null,
    comparisonProducts[1] || null,
    comparisonProducts[2] || null,
  ]);

  const mockSentiments = [
    { positive: 78, neutral: 15, negative: 7 },
    { positive: 82, neutral: 12, negative: 6 },
    { positive: 65, neutral: 20, negative: 15 },
  ];

  const filledSlots = slots.filter(Boolean) as Product[];
  const lowestPrice = filledSlots.length > 0 
    ? Math.min(...filledSlots.map(p => p.price)) 
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Bandingkan Produk 🔄
            </h1>
            <p className="text-muted-foreground text-lg">
              Bandingkan hingga 3 produk sekaligus
            </p>
          </div>

          {/* Product Slots */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {slots.map((product, index) => (
              <Card 
                key={index} 
                className={`relative min-h-[400px] ${!product ? 'border-dashed border-2' : ''} animate-fade-in`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {product ? (
                  <CardContent className="p-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => {
                        const newSlots = [...slots];
                        newSlots[index] = null;
                        setSlots(newSlots);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <PlatformBadge platform={product.platform} size="sm" />
                      <h3 className="font-semibold mt-2 line-clamp-2">{product.name}</h3>
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span className="font-semibold">{product.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          ({product.totalReviews.toLocaleString('id-ID')})
                        </span>
                      </div>
                      <div className="mt-3">
                        <span className={`text-xl font-bold ${product.price === lowestPrice ? 'text-success' : ''}`}>
                          {formatPrice(product.price)}
                        </span>
                        {product.price === lowestPrice && filledSlots.length > 1 && (
                          <Badge className="ml-2 bg-success/10 text-success border-success/20">
                            Termurah!
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                ) : (
                  <CardContent className="h-full flex flex-col items-center justify-center p-6">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Plus className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-center mb-4">
                      Tambah produk ke-{index + 1}
                    </p>
                    <div className="w-full max-w-sm">
                      <SearchBar />
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {/* Comparison Table */}
          {filledSlots.length >= 2 && (
            <Card className="animate-fade-in-up">
              <CardHeader>
                <CardTitle>Perbandingan Detail</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Kriteria</th>
                        {filledSlots.map((product) => (
                          <th key={product.id} className="text-center py-3 px-4 font-semibold">
                            {product.name.substring(0, 30)}...
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-4 px-4 font-medium">Rating</td>
                        {filledSlots.map((product) => (
                          <td key={product.id} className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Star className="h-4 w-4 fill-warning text-warning" />
                              <span className="font-semibold">{product.rating}</span>
                            </div>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-4 px-4 font-medium">Total Review</td>
                        {filledSlots.map((product) => (
                          <td key={product.id} className="py-4 px-4 text-center font-semibold">
                            {product.totalReviews.toLocaleString('id-ID')}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-4 px-4 font-medium">Harga</td>
                        {filledSlots.map((product) => (
                          <td key={product.id} className="py-4 px-4 text-center">
                            <span className={`font-bold ${product.price === lowestPrice ? 'text-success' : ''}`}>
                              {formatPrice(product.price)}
                            </span>
                            {product.price === lowestPrice && (
                              <Badge className="ml-2 bg-success/10 text-success border-success/20">
                                <TrendingDown className="h-3 w-3 mr-1" />
                                Termurah
                              </Badge>
                            )}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-4 px-4 font-medium">Sentimen Positif</td>
                        {filledSlots.map((product, index) => (
                          <td key={product.id} className="py-4 px-4">
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-success font-semibold">{mockSentiments[index]?.positive || 75}%</span>
                              <Progress value={mockSentiments[index]?.positive || 75} className="h-2 w-24" />
                            </div>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-4 px-4 font-medium">Sentimen Negatif</td>
                        {filledSlots.map((product, index) => (
                          <td key={product.id} className="py-4 px-4">
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-destructive font-semibold">{mockSentiments[index]?.negative || 10}%</span>
                              <Progress value={mockSentiments[index]?.negative || 10} className="h-2 w-24" />
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-center gap-4 mt-8">
                  {filledSlots.map((product) => (
                    <Button key={product.id} variant="hero" asChild>
                      <Link to={`/analisis/${product.id}`}>
                        <Check className="h-4 w-4" />
                        Pilih {product.name.substring(0, 15)}...
                      </Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {filledSlots.length === 0 && (
            <Card className="p-12 text-center animate-fade-in">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-4xl">🔄</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Mulai Bandingkan Produk</h3>
                <p className="text-muted-foreground mb-6">
                  Tambahkan minimal 2 produk untuk melihat perbandingan detail
                </p>
              </div>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Compare;
