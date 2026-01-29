import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, AnalysisResult } from '@/lib/mockData';

type Platform = 'tokopedia' | 'shopee' | 'lazada' | 'bukalapak' | 'blibli';

interface WishlistItem {
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

interface ActivityItem {
  id: string;
  action: 'analyze' | 'wishlist' | 'compare' | 'alert';
  productName: string;
  productId?: string;
  timestamp: string;
}

interface AnalysisHistoryItem {
  id: string;
  productName: string;
  productImage?: string;
  platform: string;
  price: number;
  rating: number;
  analyzedAt: string;
  url: string;
}

interface AppState {
  // Wishlist
  wishlist: WishlistItem[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  toggleAlert: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  setWishlistFromDB: (items: WishlistItem[]) => void;
  clearWishlist: () => void;
  
  // Comparison
  comparisonProducts: Product[];
  addToComparison: (product: Product) => void;
  removeFromComparison: (productId: string) => void;
  clearComparison: () => void;
  
  // Recent searches
  recentSearches: string[];
  addRecentSearch: (url: string) => void;
  clearRecentSearches: () => void;
  
  // Current analysis
  currentAnalysis: AnalysisResult | null;
  setCurrentAnalysis: (analysis: AnalysisResult | null) => void;
  
  // Analysis history
  analysisHistory: AnalysisHistoryItem[];
  addToAnalysisHistory: (analysis: AnalysisResult) => void;
  clearAnalysisHistory: () => void;
  setAnalysisHistoryFromDB: (items: AnalysisHistoryItem[]) => void;
  
  // Activity log
  activities: ActivityItem[];
  addActivity: (action: ActivityItem['action'], productName: string, productId?: string) => void;
  clearActivities: () => void;
  
  // Stats
  totalSavings: number;
  addSavings: (amount: number) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Wishlist
      wishlist: [],
      addToWishlist: (product) => {
        const item: WishlistItem = {
          id: product.id,
          name: product.name,
          image: product.image,
          platform: product.platform,
          price: product.price,
          originalPrice: product.originalPrice,
          rating: product.rating,
          totalReviews: product.totalReviews,
          url: product.url,
          category: product.category,
          seller: product.seller,
          alertEnabled: false,
          addedAt: new Date().toISOString(),
        };
        set((state) => ({
          wishlist: [...state.wishlist, item],
        }));
        get().addActivity('wishlist', product.name, product.id);
      },
      removeFromWishlist: (productId) => {
        set((state) => ({
          wishlist: state.wishlist.filter((item) => item.id !== productId),
        }));
      },
      toggleAlert: (productId) => {
        const product = get().wishlist.find(item => item.id === productId);
        set((state) => ({
          wishlist: state.wishlist.map((item) =>
            item.id === productId
              ? { ...item, alertEnabled: !item.alertEnabled }
              : item
          ),
        }));
        if (product && !product.alertEnabled) {
          get().addActivity('alert', product.name, productId);
        }
      },
      isInWishlist: (productId) => {
        return get().wishlist.some((item) => item.id === productId);
      },
      setWishlistFromDB: (items) => {
        set({ wishlist: items });
      },
      clearWishlist: () => {
        set({ wishlist: [] });
      },
      
      // Comparison
      comparisonProducts: [],
      addToComparison: (product) => {
        const current = get().comparisonProducts;
        if (current.length < 3 && !current.find((p) => p.id === product.id)) {
          set({ comparisonProducts: [...current, product] });
          get().addActivity('compare', product.name, product.id);
        }
      },
      removeFromComparison: (productId) => {
        set((state) => ({
          comparisonProducts: state.comparisonProducts.filter((p) => p.id !== productId),
        }));
      },
      clearComparison: () => {
        set({ comparisonProducts: [] });
      },
      
      // Recent searches
      recentSearches: [],
      addRecentSearch: (url) => {
        set((state) => ({
          recentSearches: [url, ...state.recentSearches.filter((u) => u !== url)].slice(0, 10),
        }));
      },
      clearRecentSearches: () => {
        set({ recentSearches: [] });
      },
      
      // Current analysis
      currentAnalysis: null,
      setCurrentAnalysis: (analysis) => {
        set({ currentAnalysis: analysis });
        if (analysis) {
          get().addToAnalysisHistory(analysis);
          get().addActivity('analyze', analysis.product.name, analysis.product.id);
          
          if (analysis.product.originalPrice && analysis.product.originalPrice > analysis.product.price) {
            const savings = analysis.product.originalPrice - analysis.product.price;
            get().addSavings(savings);
          }
        }
      },
      
      // Analysis history
      analysisHistory: [],
      addToAnalysisHistory: (analysis) => {
        const historyItem: AnalysisHistoryItem = {
          id: analysis.product.id,
          productName: analysis.product.name,
          productImage: analysis.product.image,
          platform: analysis.product.platform,
          price: analysis.product.price,
          rating: analysis.product.rating,
          analyzedAt: new Date().toISOString(),
          url: analysis.product.url,
        };
        set((state) => ({
          analysisHistory: [
            historyItem,
            ...state.analysisHistory.filter(item => item.id !== analysis.product.id)
          ].slice(0, 50),
        }));
      },
      clearAnalysisHistory: () => {
        set({ analysisHistory: [] });
      },
      setAnalysisHistoryFromDB: (items) => {
        set({ analysisHistory: items });
      },
      
      // Activity log
      activities: [],
      addActivity: (action, productName, productId) => {
        const activity: ActivityItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          action,
          productName,
          productId,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          activities: [activity, ...state.activities].slice(0, 100),
        }));
      },
      clearActivities: () => {
        set({ activities: [] });
      },
      
      // Stats
      totalSavings: 0,
      addSavings: (amount) => {
        set((state) => ({
          totalSavings: state.totalSavings + amount,
        }));
      },
    }),
    {
      name: 'cekdulu-storage',
      partialize: (state) => ({
        wishlist: state.wishlist,
        recentSearches: state.recentSearches,
        analysisHistory: state.analysisHistory,
        activities: state.activities,
        totalSavings: state.totalSavings,
      }),
    }
  )
);
