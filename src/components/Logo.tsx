import { Search, CheckCircle } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export function Logo({ size = 'md', showTagline = false }: LogoProps) {
  const sizes = {
    sm: { text: 'text-xl', icon: 16 },
    md: { text: 'text-2xl', icon: 20 },
    lg: { text: 'text-4xl', icon: 28 },
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="gradient-secondary rounded-xl p-2">
          <Search className="text-secondary-foreground" size={sizes[size].icon} />
        </div>
        <CheckCircle 
          className="absolute -bottom-1 -right-1 text-success fill-success-foreground" 
          size={sizes[size].icon * 0.6} 
        />
      </div>
      <div className="flex flex-col">
        <span className={`${sizes[size].text} font-extrabold text-gradient`}>
          CekDulu
        </span>
        {showTagline && (
          <span className="text-xs text-muted-foreground">
            Sebelum Beli, Cek Dulu!
          </span>
        )}
      </div>
    </div>
  );
}
