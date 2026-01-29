import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useStore } from '@/store/useStore';
import { AnalysisResult } from '@/lib/mockData';

type Platform = 'tokopedia' | 'shopee' | 'lazada' | 'bukalapak' | 'blibli';

interface DBWishlistItem {
  id: string;
  name: string;
  image: string;
  platform: Platform;
  price: number;
  originalPrice?: number;
  rating: number;
  totalReviews: number;
  url: string;
  category: string;
  seller: string;
  alertEnabled: boolean;
  addedAt: string;
}

export function useSyncData() {
  const { user, isAuthenticated } = useAuth();
  const { 
    setWishlistFromDB,
    setAnalysisHistoryFromDB,
  } = useStore();

  // Fetch wishlist from DB
  const fetchWishlist = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching wishlist:', error);
      return;
    }

    if (data) {
      const items: DBWishlistItem[] = data.map(item => ({
        id: item.product_id,
        name: item.product_name,
        image: item.product_image || '',
        platform: item.platform as Platform,
        price: Number(item.price),
        originalPrice: item.original_price ? Number(item.original_price) : undefined,
        rating: Number(item.rating) || 0,
        totalReviews: item.total_reviews || 0,
        url: item.url,
        category: 'Produk', // Default category since DB doesn't store it
        seller: 'Seller', // Default seller since DB doesn't store it
        alertEnabled: item.alert_enabled || false,
        addedAt: item.added_at,
      }));
      setWishlistFromDB(items);
    }
  }, [user, setWishlistFromDB]);

  // Fetch analysis history from DB
  const fetchAnalysisHistory = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('analysis_history')
      .select('*')
      .eq('user_id', user.id)
      .order('analyzed_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching analysis history:', error);
      return;
    }

    if (data) {
      const items = data.map(item => ({
        id: item.product_id,
        productName: item.product_name,
        productImage: item.product_image || undefined,
        platform: item.platform,
        price: Number(item.price),
        rating: Number(item.rating) || 0,
        analyzedAt: item.analyzed_at,
        url: item.url,
      }));
      setAnalysisHistoryFromDB(items);
    }
  }, [user, setAnalysisHistoryFromDB]);

  // Add to wishlist in DB
  const addToWishlistDB = useCallback(async (product: {
    id: string;
    name: string;
    image?: string;
    platform: string;
    price: number;
    originalPrice?: number;
    rating?: number;
    totalReviews?: number;
    url: string;
  }) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('wishlist')
      .upsert({
        user_id: user.id,
        product_id: product.id,
        product_name: product.name,
        product_image: product.image,
        platform: product.platform,
        price: product.price,
        original_price: product.originalPrice,
        rating: product.rating || 0,
        total_reviews: product.totalReviews || 0,
        url: product.url,
        alert_enabled: false,
      }, {
        onConflict: 'user_id,product_id',
      });
    
    if (error) {
      console.error('Error adding to wishlist:', error);
      return { error };
    }

    await fetchWishlist();
    return { error: null };
  }, [user, fetchWishlist]);

  // Remove from wishlist in DB
  const removeFromWishlistDB = useCallback(async (productId: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);
    
    if (error) {
      console.error('Error removing from wishlist:', error);
      return { error };
    }

    await fetchWishlist();
    return { error: null };
  }, [user, fetchWishlist]);

  // Toggle alert in DB
  const toggleAlertDB = useCallback(async (productId: string, enabled: boolean) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('wishlist')
      .update({ alert_enabled: enabled })
      .eq('user_id', user.id)
      .eq('product_id', productId);
    
    if (error) {
      console.error('Error toggling alert:', error);
      return { error };
    }

    await fetchWishlist();
    return { error: null };
  }, [user, fetchWishlist]);

  // Add to analysis history in DB
  const addToAnalysisHistoryDB = useCallback(async (analysis: AnalysisResult) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('analysis_history')
      .insert({
        user_id: user.id,
        product_id: analysis.product.id,
        product_name: analysis.product.name,
        product_image: analysis.product.image,
        platform: analysis.product.platform,
        price: analysis.product.price,
        rating: analysis.product.rating,
        url: analysis.product.url,
      });
    
    if (error) {
      console.error('Error adding to analysis history:', error);
      return { error };
    }

    await fetchAnalysisHistory();
    return { error: null };
  }, [user, fetchAnalysisHistory]);

  // Sync on auth change
  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
      fetchAnalysisHistory();
    }
  }, [isAuthenticated, fetchWishlist, fetchAnalysisHistory]);

  return {
    addToWishlistDB,
    removeFromWishlistDB,
    toggleAlertDB,
    addToAnalysisHistoryDB,
    fetchWishlist,
    fetchAnalysisHistory,
    isAuthenticated,
  };
}
