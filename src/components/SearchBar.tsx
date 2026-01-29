import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Link2, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useStore } from '@/store/useStore';

interface SearchBarProps {
  size?: 'default' | 'large';
}

export function SearchBar({ size = 'default' }: SearchBarProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);
  const navigate = useNavigate();
  const addRecentSearch = useStore((state) => state.addRecentSearch);

  const detectPlatform = (inputUrl: string) => {
    if (inputUrl.includes('tokopedia.com')) return 'tokopedia';
    if (inputUrl.includes('shopee.co.id')) return 'shopee';
    if (inputUrl.includes('bukalapak.com')) return 'bukalapak';
    if (inputUrl.includes('lazada.co.id')) return 'lazada';
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
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    navigate('/analisis/1');
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
    </form>
  );
}
