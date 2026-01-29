import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Bell, Wallet, Clock, Star, TrendingUp, ChevronRight,
  History, Trash2, ExternalLink, BarChart3, Package, Sparkles, LogIn, User
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/mockData';
import { PlatformBadge } from '@/components/PlatformBadge';
import { SEOHead } from '@/components/SEOHead';
import type { LucideIcon } from 'lucide-react';

const Dashboard = () => {
  const { 
    wishlist, 
    recentSearches, 
    analysisHistory, 
    activities, 
    totalSavings,
    clearActivities,
    clearAnalysisHistory,
    clearRecentSearches,
  } = useStore();

  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [showAllActivities, setShowAllActivities] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Calculate real stats
  const stats: { icon: LucideIcon; label: string; value: string | number; subtitle: string; color: string }[] = [
    {
      icon: Search,
      label: 'Produk Dicek',
      value: analysisHistory.length,
      subtitle: 'Total analisis',
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: Bell,
      label: 'Alert Aktif',
      value: wishlist.filter(item => item.alertEnabled).length,
      subtitle: `dari ${wishlist.length} wishlist`,
      color: 'bg-secondary/10 text-secondary',
    },
    {
      icon: Wallet,
      label: 'Estimasi Hemat',
      value: formatPrice(totalSavings),
      subtitle: 'Dari price tracking',
      color: 'bg-success/10 text-success',
    },
  ];

  // Format relative time
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return then.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  // Get activity icon and label
  const getActivityInfo = (action: string): { icon: LucideIcon; label: string } => {
    switch (action) {
      case 'analyze':
        return { icon: Search, label: 'Menganalisis' };
      case 'wishlist':
        return { icon: Star, label: 'Menyimpan ke wishlist' };
      case 'compare':
        return { icon: TrendingUp, label: 'Membandingkan' };
      case 'alert':
        return { icon: Bell, label: 'Mengaktifkan alert' };
      default:
        return { icon: Clock, label: 'Aktivitas' };
    }
  };

  const displayedActivities = showAllActivities ? activities : activities.slice(0, 5);
  const displayedHistory = showAllHistory ? analysisHistory : analysisHistory.slice(0, 5);

  const benefits = [
    'Unlimited product analysis',
    'Real-time price alerts',
    'Historical price data 1 tahun',
    'Export data ke Excel',
    'Priority support',
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead 
        title="Dashboard - CekDulu"
        description="Lihat ringkasan aktivitas analisis produk, wishlist, dan statistik penghematan kamu di CekDulu."
        url="https://cekdulu.id/dashboard"
      />
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Ringkasan aktivitas dan statistik kamu
              {isAuthenticated && user && (
                <span className="ml-2 text-primary">
                  • Selamat datang, {user.email?.split('@')[0]}
                </span>
              )}
            </p>
          </div>

          {/* Auth Banner */}
          {!loading && !isAuthenticated && (
            <Card className="mb-6 border-primary/30 bg-primary/5 animate-fade-in">
              <CardContent className="py-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Simpan data ke cloud</p>
                      <p className="text-muted-foreground">
                        Login untuk menyimpan wishlist & histori analisis secara permanen.
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => navigate('/auth')} variant="hero">
                    <LogIn className="h-4 w-4" />
                    Login / Daftar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Card 
                  key={stat.label} 
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold">{stat.value}</p>
                        <p className="text-sm text-muted-foreground mt-1">{stat.subtitle}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Analysis History */}
          <Card className="mb-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Riwayat Analisis
                {!isAuthenticated && analysisHistory.length > 0 && (
                  <Badge variant="outline" className="ml-2 text-xs">Lokal</Badge>
                )}
              </CardTitle>
              {analysisHistory.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAnalysisHistory}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Hapus Semua
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {analysisHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground mb-4">Belum ada produk yang dianalisis</p>
                  <Button variant="hero" asChild>
                    <Link to="/">
                      <Search className="h-4 w-4" />
                      Mulai Analisis Produk
                    </Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {displayedHistory.map((item) => (
                      <div 
                        key={item.id} 
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors border"
                      >
                        <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {item.productImage ? (
                            <img 
                              src={item.productImage} 
                              alt={item.productName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.productName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <PlatformBadge platform={item.platform as any} size="sm" />
                            <span className="text-sm text-muted-foreground">
                              ⭐ {item.rating}
                            </span>
                            <span className="text-sm font-medium text-success">
                              {formatPrice(item.price)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getRelativeTime(item.analyzedAt)}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                  {analysisHistory.length > 5 && (
                    <Button 
                      variant="ghost" 
                      className="w-full mt-4"
                      onClick={() => setShowAllHistory(!showAllHistory)}
                    >
                      {showAllHistory ? 'Tampilkan Lebih Sedikit' : `Lihat Semua (${analysisHistory.length})`}
                      <ChevronRight className={`h-4 w-4 transition-transform ${showAllHistory ? 'rotate-90' : ''}`} />
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Activity Timeline */}
            <Card className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Aktivitas Terakhir
                </CardTitle>
                {activities.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearActivities}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">Belum ada aktivitas</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {displayedActivities.map((activity) => {
                        const { icon: IconComponent, label } = getActivityInfo(activity.action);
                        return (
                          <div 
                            key={activity.id} 
                            className="flex items-start gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <IconComponent className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">
                                {label}{' '}
                                <span className="text-primary truncate">{activity.productName}</span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {getRelativeTime(activity.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {activities.length > 5 && (
                      <Button 
                        variant="ghost" 
                        className="w-full mt-4"
                        onClick={() => setShowAllActivities(!showAllActivities)}
                      >
                        {showAllActivities ? 'Tampilkan Lebih Sedikit' : `Lihat Semua (${activities.length})`}
                        <ChevronRight className={`h-4 w-4 transition-transform ${showAllActivities ? 'rotate-90' : ''}`} />
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Pro Card */}
            <Card className="gradient-hero border-primary/20 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-warning" />
                  CekDulu Pro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className="mb-4 bg-muted text-muted-foreground">Free Tier</Badge>
                <p className="text-muted-foreground mb-6">
                  Upgrade ke Pro untuk fitur premium seperti:
                </p>
                <ul className="space-y-3 mb-6">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                        <Star className="h-3 w-3 text-success" />
                      </div>
                      <span className="text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="hero" className="w-full" disabled>
                  <Sparkles className="h-4 w-4" />
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mt-8 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                  <Link to="/">
                    <Search className="h-5 w-5" />
                    <span>Analisis Baru</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                  <Link to="/wishlist">
                    <Star className="h-5 w-5" />
                    <span>Wishlist ({wishlist.length})</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                  <Link to="/bandingkan">
                    <TrendingUp className="h-5 w-5" />
                    <span>Bandingkan</span>
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={clearRecentSearches}
                  disabled={recentSearches.length === 0}
                >
                  <Trash2 className="h-5 w-5" />
                  <span>Hapus Riwayat</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
