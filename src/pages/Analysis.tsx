import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, Heart, GitCompare, ExternalLink, ChevronRight, 
  ThumbsUp, ThumbsDown, AlertTriangle, Bell, Lightbulb,
  TrendingDown, TrendingUp, Loader2, Smile, Meh, Frown,
  CheckCircle, XCircle, ShieldCheck, ShieldAlert, BarChart3,
  MessageSquare, BadgeCheck, Clock
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PlatformBadge } from '@/components/PlatformBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStore } from '@/store/useStore';
import { mockAnalysisResult, formatPrice, getDiscountPercentage, AnalysisResult } from '@/lib/mockData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BestTimeToBuy } from '@/components/analysis/BestTimeToBuy';

const Analysis = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reviewFilter, setReviewFilter] = useState<'all' | 'positive' | 'negative' | 'verified'>('all');
  const { 
    currentAnalysis, 
    isInWishlist, 
    addToWishlist, 
    removeFromWishlist, 
    addToComparison 
  } = useStore();
  
  // Use real data if available, otherwise fall back to mock
  const data: AnalysisResult = currentAnalysis || mockAnalysisResult;
  const inWishlist = isInWishlist(data.product.id);

  useEffect(() => {
    // If no current analysis and not using mock ID, redirect to home
    if (!currentAnalysis && id !== '1') {
      navigate('/');
    }
  }, [currentAnalysis, id, navigate]);

  const handleWishlistClick = () => {
    if (inWishlist) {
      removeFromWishlist(data.product.id);
    } else {
      addToWishlist(data.product);
    }
  };

  const filteredReviews = (data.reviews || []).filter(review => {
    if (reviewFilter === 'all') return true;
    if (reviewFilter === 'positive') return review.sentiment === 'positive';
    if (reviewFilter === 'negative') return review.sentiment === 'negative';
    if (reviewFilter === 'verified') return review.verified;
    return true;
  });

  const SentimentIcon = ({ sentiment }: { sentiment: 'positive' | 'neutral' | 'negative' }) => {
    switch (sentiment) {
      case 'positive':
        return <Smile className="h-5 w-5 text-success" />;
      case 'neutral':
        return <Meh className="h-5 w-5 text-muted-foreground" />;
      case 'negative':
        return <Frown className="h-5 w-5 text-destructive" />;
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Memuat data analisis...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="container mx-auto py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span>Hasil Analisis</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground truncate max-w-[200px]">{data.product.name}</span>
          </nav>
        </div>

        <div className="container mx-auto pb-16">
          {/* Live Data Indicator */}
          {currentAnalysis && (
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success rounded-full text-sm font-medium animate-fade-in">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              Data Real-time dari AI Search
            </div>
          )}

          {/* Product Card */}
          <Card className="mb-8 overflow-hidden animate-fade-in">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-[400px_1fr] gap-6">
                <div className="aspect-square bg-muted overflow-hidden">
                  {data.product.image ? (
                    <img 
                      src={data.product.image} 
                      alt={data.product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3">
                    <PlatformBadge platform={data.product.platform} size="md" />
                    <Badge variant="outline">{data.product.category}</Badge>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-4">{data.product.name}</h1>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-6 w-6 fill-warning text-warning" />
                      <span className="text-2xl font-bold">{data.product.rating}</span>
                    </div>
                    <span className="text-muted-foreground">
                      ({(data.product.totalReviews || 0).toLocaleString('id-ID')} review)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl font-bold text-success">
                      {formatPrice(data.product.price)}
                    </span>
                    {data.product.originalPrice && (
                      <>
                        <span className="text-lg text-muted-foreground line-through">
                          {formatPrice(data.product.originalPrice)}
                        </span>
                        <Badge className="bg-destructive text-destructive-foreground">
                          -{getDiscountPercentage(data.product.originalPrice, data.product.price)}%
                        </Badge>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={handleWishlistClick}>
                      <Heart className={`h-4 w-4 ${inWishlist ? 'fill-destructive text-destructive' : ''}`} />
                      {inWishlist ? 'Tersimpan' : 'Simpan ke Wishlist'}
                    </Button>
                    <Button variant="outline" onClick={() => addToComparison(data.product)}>
                      <GitCompare className="h-4 w-4" />
                      Bandingkan
                    </Button>
                    <Button variant="hero" asChild>
                      <a href={data.product.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Buka di {data.product.platform.charAt(0).toUpperCase() + data.product.platform.slice(1)}
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Summary Card */}
          <Card className="mb-8 gradient-hero border-primary/20 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-warning" />
                Kesimpulan Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium mb-4 leading-relaxed">
                "{data.summary}"
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span>Berdasarkan analisis AI dari berbagai sumber</span>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Tingkat Akurasi: 95%
                </Badge>
              </div>
              {data.suspiciousPercentage > 5 && (
                <div className="mt-4 p-4 bg-destructive/10 rounded-xl border border-destructive/20 flex items-center gap-3">
                  <ShieldAlert className="h-5 w-5 text-destructive" />
                  <span className="text-destructive font-medium">
                    Terdeteksi {data.suspiciousPercentage}% review mencurigakan (mungkin palsu)
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sentiment Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="bg-success/5 border-success/20 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-success/20 flex items-center justify-center">
                  <Smile className="h-7 w-7 text-success" />
                </div>
                <div className="text-4xl font-bold text-success mb-1">{data.sentiment.positive}%</div>
                <div className="text-sm text-muted-foreground">Puas</div>
                <Progress value={data.sentiment.positive} className="mt-3 h-2" />
              </CardContent>
            </Card>
            <Card className="bg-muted/50 border-muted-foreground/20 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                  <Meh className="h-7 w-7 text-muted-foreground" />
                </div>
                <div className="text-4xl font-bold text-muted-foreground mb-1">{data.sentiment.neutral}%</div>
                <div className="text-sm text-muted-foreground">Biasa Aja</div>
                <Progress value={data.sentiment.neutral} className="mt-3 h-2" />
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 border-destructive/20 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-destructive/20 flex items-center justify-center">
                  <Frown className="h-7 w-7 text-destructive" />
                </div>
                <div className="text-4xl font-bold text-destructive mb-1">{data.sentiment.negative}%</div>
                <div className="text-sm text-muted-foreground">Kecewa</div>
                <Progress value={data.sentiment.negative} className="mt-3 h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Pros & Cons */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-success/5 border-success/20 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-success">
                  <ThumbsUp className="h-5 w-5" />
                  Yang Paling Dipuji
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {(data.pros || []).map((pro, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-success" />
                      </div>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 border-destructive/20 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <ThumbsDown className="h-5 w-5" />
                  Keluhan Utama
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {(data.cons || []).map((con, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <XCircle className="h-4 w-4 text-destructive" />
                      </div>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Price History Chart */}
          {data.priceHistory && data.priceHistory.length > 0 && (
            <Card className="mb-8 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Tracking Harga 30 Hari Terakhir
                  </CardTitle>
                  <Button variant="outline">
                    <Bell className="h-4 w-4" />
                    Aktifkan Alert Harga
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.priceHistory}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        className="text-xs"
                      />
                      <YAxis 
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`}
                        className="text-xs"
                      />
                      <Tooltip 
                        formatter={(value: number) => formatPrice(value)}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        fill="url(#colorPrice)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-8 mt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingDown className="h-4 w-4 text-success" />
                    <span>Terendah: {formatPrice(Math.min(...data.priceHistory.map(p => p.price)))}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-destructive" />
                    <span>Tertinggi: {formatPrice(Math.max(...data.priceHistory.map(p => p.price)))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Best Time to Buy Analysis */}
          {data.priceHistory && data.priceHistory.length > 0 && (
            <div className="mb-8" style={{ animationDelay: '420ms' }}>
              <BestTimeToBuy 
                priceHistory={data.priceHistory} 
                currentPrice={data.product.price} 
              />
            </div>
          )}

          {/* Reviews Section */}
          <Card className="animate-fade-in-up" style={{ animationDelay: '450ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Baca Review Asli dari Pembeli
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { key: 'all', label: 'Semua', icon: null },
                  { key: 'positive', label: 'Positif', icon: Smile },
                  { key: 'negative', label: 'Negatif', icon: Frown },
                  { key: 'verified', label: 'Terverifikasi', icon: BadgeCheck },
                ].map((filter) => (
                  <Button
                    key={filter.key}
                    variant={reviewFilter === filter.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReviewFilter(filter.key as typeof reviewFilter)}
                  >
                    {filter.icon && <filter.icon className="h-4 w-4 mr-1" />}
                    {filter.label}
                  </Button>
                ))}
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {filteredReviews.length > 0 ? (
                  filteredReviews.map((review) => (
                    <div key={review.id} className="p-4 rounded-xl bg-muted/30 border border-border">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-semibold text-primary">
                              {review.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{review.userName}</span>
                              <PlatformBadge platform={review.platform} size="sm" />
                              {review.verified && (
                                <Badge variant="outline" className="text-success border-success/30 bg-success/10">
                                  <BadgeCheck className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-3 w-3 ${i < review.rating ? 'fill-warning text-warning' : 'text-muted'}`} 
                                  />
                                ))}
                              </div>
                              <span>•</span>
                              <Clock className="h-3 w-3" />
                              <span>{new Date(review.date).toLocaleDateString('id-ID')}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`p-2 rounded-full ${
                          review.sentiment === 'positive' 
                            ? 'bg-success/10' 
                            : review.sentiment === 'negative'
                            ? 'bg-destructive/10'
                            : 'bg-muted'
                        }`}>
                          <SentimentIcon sentiment={review.sentiment} />
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed">{review.content}</p>
                      {review.suspicious && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-warning">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Review ini terdeteksi mencurigakan</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Tidak ada review untuk filter ini
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Analysis;
