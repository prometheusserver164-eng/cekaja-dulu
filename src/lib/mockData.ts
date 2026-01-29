export interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating: number;
  totalReviews: number;
  platform: 'tokopedia' | 'shopee' | 'bukalapak' | 'lazada' | 'blibli';
  category: string;
  seller: string;
  url: string;
}

export interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  date: string;
  content: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  platform: 'tokopedia' | 'shopee' | 'bukalapak' | 'lazada' | 'blibli';
  verified: boolean;
  suspicious: boolean;
  images?: string[];
}

export interface AnalysisResult {
  product: Product;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  summary: string;
  suspiciousPercentage: number;
  pros: string[];
  cons: string[];
  priceHistory: { date: string; price: number }[];
  reviews: Review[];
}

export const platformColors = {
  tokopedia: '#00AA5B',
  shopee: '#EE4D2D',
  bukalapak: '#E31E52',
  lazada: '#0F1689',
  blibli: '#0095DA',
};

export const platformNames = {
  tokopedia: 'Tokopedia',
  shopee: 'Shopee',
  bukalapak: 'Bukalapak',
  lazada: 'Lazada',
  blibli: 'Blibli',
};

export const recentProducts: Product[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro Max 256GB - Natural Titanium',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400',
    price: 21999000,
    originalPrice: 24999000,
    rating: 4.8,
    totalReviews: 2847,
    platform: 'tokopedia',
    category: 'Smartphone',
    seller: 'Apple Official Store',
    url: 'https://tokopedia.com/example',
  },
  {
    id: '2',
    name: 'Samsung Galaxy S24 Ultra 512GB',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400',
    price: 19499000,
    rating: 4.7,
    totalReviews: 1923,
    platform: 'shopee',
    category: 'Smartphone',
    seller: 'Samsung Official',
    url: 'https://shopee.co.id/example',
  },
  {
    id: '3',
    name: 'MacBook Air M3 15" 256GB',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    price: 20999000,
    rating: 4.9,
    totalReviews: 892,
    platform: 'tokopedia',
    category: 'Laptop',
    seller: 'iBox Indonesia',
    url: 'https://tokopedia.com/example',
  },
  {
    id: '4',
    name: 'Sony WH-1000XM5 Wireless Headphones',
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400',
    price: 4999000,
    originalPrice: 5499000,
    rating: 4.8,
    totalReviews: 3241,
    platform: 'lazada',
    category: 'Audio',
    seller: 'Sony Indonesia',
    url: 'https://lazada.co.id/example',
  },
  {
    id: '5',
    name: 'Nintendo Switch OLED Model',
    image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400',
    price: 5299000,
    rating: 4.6,
    totalReviews: 1547,
    platform: 'bukalapak',
    category: 'Gaming',
    seller: 'Game Master Store',
    url: 'https://bukalapak.com/example',
  },
];

export const mockAnalysisResult: AnalysisResult = {
  product: recentProducts[0],
  sentiment: {
    positive: 78,
    neutral: 15,
    negative: 7,
  },
  summary: '78% pembeli puas banget sama produk ini! Kualitas build premium dan performa kamera yang luar biasa jadi poin plus utama. Tapi 7% ada yang komplain soal harga yang terlalu tinggi dan baterai yang kurang awet untuk heavy users.',
  suspiciousPercentage: 3,
  pros: [
    'Kamera dengan teknologi terbaru, hasil foto profesional',
    'Build quality titanium yang premium dan ringan',
    'Performa A17 Pro chip sangat cepat',
    'Display ProMotion 120Hz super smooth',
    'Fitur Action Button yang customizable',
  ],
  cons: [
    'Harga cukup tinggi dibanding kompetitor',
    'Baterai kurang awet untuk power users',
    'Charger tidak termasuk dalam box',
    'Pilihan warna terbatas',
  ],
  priceHistory: [
    { date: '2024-01-01', price: 24999000 },
    { date: '2024-01-05', price: 24499000 },
    { date: '2024-01-10', price: 23999000 },
    { date: '2024-01-15', price: 23499000 },
    { date: '2024-01-20', price: 22999000 },
    { date: '2024-01-25', price: 22499000 },
    { date: '2024-02-01', price: 21999000 },
  ],
  reviews: [
    {
      id: 'r1',
      userName: 'Budi Santoso',
      rating: 5,
      date: '2024-01-28',
      content: 'Mantap banget iPhone 15 Pro Max ini! Kamera-nya gila, foto malam hari jadi kaya siang. Build quality titanium-nya berasa premium banget. Worth every penny!',
      sentiment: 'positive',
      platform: 'tokopedia',
      verified: true,
      suspicious: false,
    },
    {
      id: 'r2',
      userName: 'Siti Rahayu',
      rating: 4,
      date: '2024-01-27',
      content: 'Overall bagus sih, tapi sayang baterai agak boros kalo main game. Sisanya perfect!',
      sentiment: 'positive',
      platform: 'tokopedia',
      verified: true,
      suspicious: false,
    },
    {
      id: 'r3',
      userName: 'Ahmad Wijaya',
      rating: 3,
      date: '2024-01-26',
      content: 'Produknya oke, tapi harganya kemahalan. Samsung S24 Ultra lebih worth it menurut gue.',
      sentiment: 'neutral',
      platform: 'shopee',
      verified: true,
      suspicious: false,
    },
    {
      id: 'r4',
      userName: 'Maya Putri',
      rating: 5,
      date: '2024-01-25',
      content: 'Best purchase ever! Action button berguna banget, bisa custom buat buka kamera langsung.',
      sentiment: 'positive',
      platform: 'tokopedia',
      verified: true,
      suspicious: false,
    },
    {
      id: 'r5',
      userName: 'Buyer12345',
      rating: 5,
      date: '2024-01-24',
      content: 'Bagus bagus bagus sangat bagus sekali recommended!',
      sentiment: 'positive',
      platform: 'shopee',
      verified: false,
      suspicious: true,
    },
  ],
};

export const formatPrice = (price: number | undefined | null): string => {
  if (price === undefined || price === null || isNaN(price)) {
    return 'Rp -';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const getDiscountPercentage = (original: number | undefined | null, current: number | undefined | null): number => {
  if (!original || !current || isNaN(original) || isNaN(current) || original === 0) {
    return 0;
  }
  return Math.round(((original - current) / original) * 100);
};
