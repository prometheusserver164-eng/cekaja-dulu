import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  productData?: {
    name: string;
    price: number;
    currency?: string;
    image?: string;
    rating?: number;
    reviewCount?: number;
    seller?: string;
    platform?: string;
  };
}

export function SEOHead({
  title = 'CekDulu - Cek Review Produk Sebelum Beli',
  description = 'Platform analisis review produk e-commerce Indonesia berbasis AI. Deteksi review palsu, analisis sentimen, dan tracking harga.',
  keywords = 'cek review produk, analisis review, review palsu, Tokopedia, Shopee, e-commerce Indonesia',
  image = '/og-image.png',
  url = 'https://cekdulu.id',
  type = 'website',
  productData,
}: SEOHeadProps) {
  const fullTitle = title.includes('CekDulu') ? title : `${title} | CekDulu`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Canonical */}
      <link rel="canonical" href={url} />

      {/* Product Structured Data */}
      {productData && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: productData.name,
            image: productData.image,
            offers: {
              '@type': 'Offer',
              price: productData.price,
              priceCurrency: productData.currency || 'IDR',
              availability: 'https://schema.org/InStock',
              seller: {
                '@type': 'Organization',
                name: productData.seller,
              },
            },
            ...(productData.rating && productData.reviewCount && {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: productData.rating,
                reviewCount: productData.reviewCount,
              },
            }),
          })}
        </script>
      )}
    </Helmet>
  );
}
