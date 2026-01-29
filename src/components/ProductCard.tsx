import * as React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { Product, formatPrice, getDiscountPercentage } from '@/lib/mockData';
import { PlatformBadge } from './PlatformBadge';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { useSyncData } from '@/hooks/useSyncData';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface ProductCardProps {
  product: Product;
  showWishlistButton?: boolean;
}

export function ProductCard({ product, showWishlistButton = true }: ProductCardProps) {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useStore();
  const { isAuthenticated } = useAuth();
  const { addToWishlistDB, removeFromWishlistDB } = useSyncData();
  const inWishlist = isInWishlist(product.id);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (inWishlist) {
      if (isAuthenticated) {
        await removeFromWishlistDB(product.id);
      } else {
        removeFromWishlist(product.id);
      }
    } else {
      if (isAuthenticated) {
        await addToWishlistDB(product);
      }
      // Always add to local store
      addToWishlist(product);
    }
  };

  return (
    <Link to={`/analisis/${product.id}`}>
      <Card className="group overflow-hidden transition-all duration-300 hover:card-shadow-hover hover:-translate-y-1 bg-card">
        <CardContent className="p-0">
          <div className="relative aspect-square overflow-hidden bg-muted">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute top-2 left-2">
              <PlatformBadge platform={product.platform} />
            </div>
            {product.originalPrice && (
              <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground">
                -{getDiscountPercentage(product.originalPrice, product.price)}%
              </Badge>
            )}
            {showWishlistButton && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-2 right-2 bg-card/80 backdrop-blur-sm hover:bg-card"
                onClick={handleWishlistClick}
              >
                {inWishlist ? (
                  <Heart className="h-4 w-4 fill-destructive text-destructive" />
                ) : (
                  <Heart className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-medium line-clamp-2 text-sm mb-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <div className="flex items-center gap-1 mb-2">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="text-sm font-semibold">{product.rating}</span>
              <span className="text-xs text-muted-foreground">
                ({product.totalReviews.toLocaleString('id-ID')} review)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-success">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
