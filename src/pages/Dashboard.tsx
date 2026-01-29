import { Search, Bell, Wallet, Clock, Star, TrendingUp, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { formatPrice } from '@/lib/mockData';
import type { LucideIcon } from 'lucide-react';

const Dashboard = () => {
  const { wishlist, recentSearches } = useStore();

  const stats: { icon: LucideIcon; label: string; value: string | number; subtitle: string; color: string }[] = [
    {
      icon: Search,
      label: 'Produk Dicek',
      value: recentSearches.length || 12,
      subtitle: 'Total analisis',
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: Bell,
      label: 'Alert Diterima',
      value: wishlist.filter(item => item.alertEnabled).length || 3,
      subtitle: 'Notifikasi penting',
      color: 'bg-secondary/10 text-secondary',
    },
    {
      icon: Wallet,
      label: 'Estimasi Hemat',
      value: formatPrice(2450000),
      subtitle: 'Dari price tracking',
      color: 'bg-success/10 text-success',
    },
  ];

  const activities: { action: string; product: string; time: string; icon: LucideIcon }[] = [
    { action: 'Menganalisis', product: 'iPhone 15 Pro Max', time: '2 jam lalu', icon: Search },
    { action: 'Menyimpan ke wishlist', product: 'MacBook Air M3', time: '5 jam lalu', icon: Star },
    { action: 'Membandingkan', product: '3 produk smartphone', time: '1 hari lalu', icon: TrendingUp },
    { action: 'Mengaktifkan alert', product: 'Sony WH-1000XM5', time: '2 hari lalu', icon: Bell },
    { action: 'Menganalisis', product: 'Samsung Galaxy S24', time: '3 hari lalu', icon: Search },
  ];

  const benefits = [
    'Unlimited product analysis',
    'Real-time price alerts',
    'Historical price data 1 tahun',
    'Export data ke Excel',
    'Priority support',
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Ringkasan aktivitas dan statistik kamu
            </p>
          </div>

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

          <div className="grid md:grid-cols-2 gap-6">
            {/* Activity Timeline */}
            <Card className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Aktivitas Terakhir
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map((activity, index) => {
                    const IconComponent = activity.icon;
                    return (
                      <div 
                        key={index} 
                        className="flex items-start gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">
                            {activity.action}{' '}
                            <span className="text-primary">{activity.product}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button variant="ghost" className="w-full mt-4">
                  Lihat Semua Aktivitas
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Pro Card */}
            <Card className="gradient-hero border-primary/20 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-warning" />
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
                <Button variant="hero" className="w-full">
                  <Star className="h-4 w-4" />
                  Upgrade ke Pro
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
