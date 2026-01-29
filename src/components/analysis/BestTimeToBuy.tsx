import { useMemo, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, TrendingDown, TrendingUp, Calendar, 
  Zap, ShoppingCart, AlertCircle, CheckCircle2
} from 'lucide-react';
import { formatPrice } from '@/lib/mockData';

interface PricePoint {
  date: string;
  price: number;
}

interface BestTimeToBuyProps {
  priceHistory: PricePoint[];
  currentPrice: number;
}

interface BuyRecommendation {
  recommendation: 'buy_now' | 'wait' | 'good_deal';
  confidence: number;
  reason: string;
  potentialSavings?: number;
  bestDay?: string;
  priceDirection: 'up' | 'down' | 'stable';
  avgPrice: number;
  lowestPrice: number;
  highestPrice: number;
}

function analyzePriceHistory(priceHistory: PricePoint[], currentPrice: number): BuyRecommendation {
  // Handle invalid currentPrice
  const safeCurrentPrice = typeof currentPrice === 'number' && !isNaN(currentPrice) ? currentPrice : 0;
  
  if (!priceHistory || priceHistory.length < 2 || safeCurrentPrice === 0) {
    return {
      recommendation: 'buy_now',
      confidence: 50,
      reason: 'Data harga tidak cukup untuk analisis mendalam.',
      priceDirection: 'stable',
      avgPrice: safeCurrentPrice,
      lowestPrice: safeCurrentPrice,
      highestPrice: safeCurrentPrice,
    };
  }

  const prices = priceHistory.map(p => p.price);
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const lowestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);
  
  // Find the date of lowest price
  const lowestPriceEntry = priceHistory.find(p => p.price === lowestPrice);
  const bestDay = lowestPriceEntry 
    ? new Date(lowestPriceEntry.date).toLocaleDateString('id-ID', { weekday: 'long' })
    : undefined;

  // Calculate price direction trend (last 3 data points)
  const recentPrices = prices.slice(-3);
  let priceDirection: 'up' | 'down' | 'stable' = 'stable';
  if (recentPrices.length >= 2) {
    const diff = recentPrices[recentPrices.length - 1] - recentPrices[0];
    const percentChange = (diff / recentPrices[0]) * 100;
    if (percentChange > 2) priceDirection = 'up';
    else if (percentChange < -2) priceDirection = 'down';
  }

  // Determine recommendation
  const priceVsAvg = ((currentPrice - avgPrice) / avgPrice) * 100;
  const priceVsLowest = ((currentPrice - lowestPrice) / lowestPrice) * 100;

  let recommendation: 'buy_now' | 'wait' | 'good_deal';
  let confidence: number;
  let reason: string;
  let potentialSavings: number | undefined;

  if (priceVsLowest <= 5) {
    // Current price is within 5% of lowest - great deal
    recommendation = 'buy_now';
    confidence = 90;
    reason = `Harga saat ini mendekati harga terendah dalam 30 hari terakhir. Ini waktu yang sangat tepat untuk membeli!`;
  } else if (priceVsAvg < -5) {
    // Below average price - good deal
    recommendation = 'good_deal';
    confidence = 75;
    reason = `Harga saat ini ${Math.abs(Math.round(priceVsAvg))}% lebih murah dari rata-rata. Lumayan worth it untuk dibeli sekarang.`;
    potentialSavings = avgPrice - currentPrice;
  } else if (priceVsAvg > 10 || priceDirection === 'down') {
    // Above average or trending down - wait
    recommendation = 'wait';
    confidence = 70;
    potentialSavings = currentPrice - lowestPrice;
    const savingsFormatted = potentialSavings > 0 ? formatPrice(potentialSavings) : 'beberapa rupiah';
    if (priceDirection === 'down') {
      reason = `Harga sedang tren turun. Tunggu beberapa hari lagi untuk potensi hemat hingga ${savingsFormatted}.`;
    } else {
      reason = `Harga saat ini ${Math.round(priceVsAvg)}% di atas rata-rata. Pertimbangkan untuk menunggu promo atau flash sale.`;
    }
  } else {
    // Around average - neutral
    recommendation = 'good_deal';
    confidence = 60;
    reason = 'Harga saat ini wajar dan mendekati rata-rata. Aman untuk dibeli kalau memang butuh.';
  }

  return {
    recommendation,
    confidence,
    reason,
    potentialSavings,
    bestDay,
    priceDirection,
    avgPrice,
    lowestPrice,
    highestPrice,
  };
}

export const BestTimeToBuy = forwardRef<HTMLDivElement, BestTimeToBuyProps>(
  ({ priceHistory, currentPrice }, ref) => {
  const analysis = useMemo(() => 
    analyzePriceHistory(priceHistory, currentPrice), 
    [priceHistory, currentPrice]
  );

  const getRecommendationStyle = () => {
    switch (analysis.recommendation) {
      case 'buy_now':
        return {
          bg: 'bg-success/10',
          border: 'border-success/30',
          icon: <Zap className="h-6 w-6 text-success" />,
          badge: <Badge className="bg-success text-success-foreground">Beli Sekarang!</Badge>,
          iconBg: 'bg-success/20',
        };
      case 'good_deal':
        return {
          bg: 'bg-primary/10',
          border: 'border-primary/30',
          icon: <ShoppingCart className="h-6 w-6 text-primary" />,
          badge: <Badge className="bg-primary text-primary-foreground">Deal Bagus</Badge>,
          iconBg: 'bg-primary/20',
        };
      case 'wait':
        return {
          bg: 'bg-warning/10',
          border: 'border-warning/30',
          icon: <Clock className="h-6 w-6 text-warning" />,
          badge: <Badge className="bg-warning text-warning-foreground">Tunggu Dulu</Badge>,
          iconBg: 'bg-warning/20',
        };
    }
  };

  const style = getRecommendationStyle();

  return (
    <Card ref={ref} className={`${style.bg} ${style.border} animate-fade-in-up`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Analisis Waktu Beli Terbaik
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Recommendation */}
        <div className={`flex items-start gap-4 p-4 rounded-xl ${style.bg} border ${style.border}`}>
          <div className={`w-12 h-12 rounded-full ${style.iconBg} flex items-center justify-center flex-shrink-0`}>
            {style.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {style.badge}
              <span className="text-sm text-muted-foreground">
                Confidence: {analysis.confidence}%
              </span>
            </div>
            <p className="text-foreground font-medium">{analysis.reason}</p>
          </div>
        </div>

        {/* Price Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-xl bg-card border">
            <TrendingDown className="h-5 w-5 mx-auto mb-2 text-success" />
            <div className="text-sm text-muted-foreground mb-1">Terendah</div>
            <div className="font-bold text-success">{formatPrice(analysis.lowestPrice)}</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-card border">
            <div className="h-5 w-5 mx-auto mb-2 flex items-center justify-center">
              <span className="text-muted-foreground">~</span>
            </div>
            <div className="text-sm text-muted-foreground mb-1">Rata-rata</div>
            <div className="font-bold">{formatPrice(analysis.avgPrice)}</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-card border">
            <TrendingUp className="h-5 w-5 mx-auto mb-2 text-destructive" />
            <div className="text-sm text-muted-foreground mb-1">Tertinggi</div>
            <div className="font-bold text-destructive">{formatPrice(analysis.highestPrice)}</div>
          </div>
        </div>

        {/* Additional Insights */}
        <div className="space-y-3">
          {/* Price Trend */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border">
            {analysis.priceDirection === 'down' ? (
              <TrendingDown className="h-5 w-5 text-success" />
            ) : analysis.priceDirection === 'up' ? (
              <TrendingUp className="h-5 w-5 text-destructive" />
            ) : (
              <div className="h-5 w-5 flex items-center justify-center text-muted-foreground">—</div>
            )}
            <div>
              <div className="text-sm font-medium">Tren Harga</div>
              <div className="text-sm text-muted-foreground">
                {analysis.priceDirection === 'down' && 'Harga sedang turun'}
                {analysis.priceDirection === 'up' && 'Harga sedang naik'}
                {analysis.priceDirection === 'stable' && 'Harga stabil'}
              </div>
            </div>
          </div>

          {/* Best Day */}
          {analysis.bestDay && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium">Hari Termurah</div>
                <div className="text-sm text-muted-foreground">
                  Harga terendah tercatat di hari <span className="font-medium text-foreground">{analysis.bestDay}</span>
                </div>
              </div>
            </div>
          )}

          {/* Potential Savings */}
          {analysis.potentialSavings && analysis.potentialSavings > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border">
              {analysis.recommendation === 'wait' ? (
                <AlertCircle className="h-5 w-5 text-warning" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-success" />
              )}
              <div>
                <div className="text-sm font-medium">
                  {analysis.recommendation === 'wait' ? 'Potensi Hemat' : 'Kamu Hemat'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {analysis.recommendation === 'wait' 
                    ? `Tunggu untuk potensi hemat hingga ${formatPrice(analysis.potentialSavings)}`
                    : `${formatPrice(analysis.potentialSavings)} dari harga rata-rata`
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

BestTimeToBuy.displayName = 'BestTimeToBuy';
