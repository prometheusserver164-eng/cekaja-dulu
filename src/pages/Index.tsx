import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { RecentProductsSection } from '@/components/home/RecentProductsSection';
import { CTASection } from '@/components/home/CTASection';
import { SEOHead } from '@/components/SEOHead';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title="CekLagi - Cek Review Produk Sebelum Beli | Analisis Terpercaya"
        description="Platform analisis review produk e-commerce Indonesia. Deteksi review palsu, analisis sentimen, tracking harga dari Tokopedia, Shopee, Lazada & Bukalapak. 100% Gratis!"
        keywords="cek review produk, analisis review, review palsu, Tokopedia, Shopee, Lazada, Bukalapak, belanja online, e-commerce Indonesia, tracking harga, detector fake review"
        url="https://ceklagi.id/"
      />
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <HowItWorksSection />
        <RecentProductsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
