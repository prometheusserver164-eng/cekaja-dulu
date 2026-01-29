import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Link2, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useStore } from '@/store/useStore';
import { analyzeProduct } from '@/lib/api/analyzeProduct';
import { toast } from 'sonner';

interface SearchBarProps {
  size?: 'default' | 'large';
}

export function SearchBar({ size = 'default' }: SearchBarProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);
  const navigate = useNavigate();
  const { addRecentSearch, setCurrentAnalysis } = useStore();

  const detectPlatform = (inputUrl: string) => {
    if (inputUrl.includes('tokopedia.com')) return 'tokopedia';
    if (inputUrl.includes('shopee.co.id') || inputUrl.includes('shopee.com')) return 'shopee';
    if (inputUrl.includes('bukalapak.com')) return 'bukalapak';
    if (inputUrl.includes('lazada.co.id') || inputUrl.includes('lazada.com')) return 'lazada';
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    setDetectedPlatform(detectPlatform(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    addRecentSearch(url);
    
    try {
      const result = await analyzeProduct(url);
      
      if (result.success && result.data) {
        setCurrentAnalysis(result.data);
        toast.success('Analisis berhasil!', {
          description: 'Data review berhasil dikumpulkan dari berbagai sumber.',
        });
        navigate(`/analisis/${result.data.product.id}`);
      } else {
        toast.error('Gagal menganalisis', {
          description: result.error || 'Coba lagi dengan URL yang valid.',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Terjadi kesalahan', {
        description: 'Pastikan URL produk valid dan coba lagi.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = size === 'large' 
    ? 'h-14 text-lg pl-12 pr-4 rounded-2xl' 
    : 'h-11 pl-10 pr-4 rounded-xl';

  const buttonClasses = size === 'large'
    ? 'h-14 px-8 text-lg rounded-2xl'
    : 'h-11 px-6 rounded-xl';

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Link2 className={`absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground ${size === 'large' ? 'h-5 w-5' : 'h-4 w-4'}`} />
          <Input
            type="url"
            placeholder="Tempel link produk dari Tokopedia, Shopee, atau marketplace lainnya..."
            value={url}
            onChange={handleInputChange}
            className={`${inputClasses} bg-card border-2 border-border focus:border-primary transition-colors`}
          />
          {detectedPlatform && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <span className="text-xs font-medium text-success capitalize animate-fade-in">
                ✓ {detectedPlatform}
              </span>
            </div>
          )}
        </div>
        <Button
          type="submit"
          variant="hero"
          className={buttonClasses}
          disabled={isLoading || !url.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Menganalisis...</span>
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              <span>Cek Sekarang</span>
            </>
          )}
        </Button>
      </div>
      {isLoading && (
        <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Sedang mengumpulkan dan menganalisis review dari berbagai sumber...</span>
        </div>
      )}
    </form>
  );
}
