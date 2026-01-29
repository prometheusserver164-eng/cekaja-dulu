import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, AnalysisResult } from '@/lib/mockData';

interface WishlistItem extends Product {
  alertEnabled: boolean;
  addedAt: string;
}

interface AppState {
  // Wishlist
  wishlist: WishlistItem[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  toggleAlert: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  
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
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Wishlist
      wishlist: [],
      addToWishlist: (product) => {
        const item: WishlistItem = {
          ...product,
          alertEnabled: false,
          addedAt: new Date().toISOString(),
        };
        set((state) => ({
          wishlist: [...state.wishlist, item],
        }));
      },
      removeFromWishlist: (productId) => {
        set((state) => ({
          wishlist: state.wishlist.filter((item) => item.id !== productId),
        }));
      },
      toggleAlert: (productId) => {
        set((state) => ({
          wishlist: state.wishlist.map((item) =>
            item.id === productId
              ? { ...item, alertEnabled: !item.alertEnabled }
              : item
          ),
        }));
      },
      isInWishlist: (productId) => {
        return get().wishlist.some((item) => item.id === productId);
      },
      
      // Comparison
      comparisonProducts: [],
      addToComparison: (product) => {
        const current = get().comparisonProducts;
        if (current.length < 3 && !current.find((p) => p.id === product.id)) {
          set({ comparisonProducts: [...current, product] });
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
      },
    }),
    {
      name: 'cekdulu-storage',
      partialize: (state) => ({
        wishlist: state.wishlist,
        recentSearches: state.recentSearches,
      }),
    }
  )
);
