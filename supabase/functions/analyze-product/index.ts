/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Check if image URL is a valid product image (not UI element, logo, etc.)
function isValidProductImage(imageUrl: string, platform: string): boolean {
  if (!imageUrl || imageUrl.length < 10) return false;
  
  // Must be a valid URL
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) return false;
  
  // Common patterns to EXCLUDE (UI elements, logos, banners)
  const excludePatterns = [
    /logo\./i,
    /\/logo\//i,
    /banner/i,
    /icon[\._-]/i,
    /\/icons?\//i,
    /favicon/i,
    /avatar/i,
    /profile/i,
    /wallet/i,
    /voucher/i,
    /promo-banner/i,
    /placeholder/i,
    /loading/i,
    /spinner/i,
    /default-avatar/i,
    /empty-state/i,
    /no-image/i,
    /noimage/i,
    /blank\./i,
    /\.svg$/i,
    /1x1\./i,
    /pixel\./i,
    /tracking/i,
    /analytics/i,
    /flash-sale-badge/i,
    /campaign-badge/i,
    /shopee-coins/i,
    /free-shipping/i,
  ];
  
  for (const pattern of excludePatterns) {
    if (pattern.test(imageUrl)) {
      console.log('Image excluded by pattern:', pattern.toString(), imageUrl.substring(0, 100));
      return false;
    }
  }
  
  // Platform-specific CDN validation
  if (platform === 'shopee') {
    // Shopee product images: cf.shopee.co.id, down-id.img.susercontent.com, etc
    const validShopeePatterns = [
      /cf\.shopee\./i,
      /down-[a-z]+\.img\.susercontent\.com/i,
      /f\.shopee\./i,
    ];
    const hasValidCdn = validShopeePatterns.some(p => p.test(imageUrl));
    if (!hasValidCdn) {
      console.log('Shopee image rejected - not from valid CDN:', imageUrl.substring(0, 100));
      return false;
    }
    // Must have file path pattern for product images
    if (imageUrl.includes('/file/') || imageUrl.includes('/product/') || /\/[a-f0-9]{24,}/i.test(imageUrl)) {
      return true;
    }
    return false;
  }
  
  if (platform === 'tokopedia') {
    // Tokopedia images from images.tokopedia.net
    if (imageUrl.includes('images.tokopedia.net')) {
      // Product images usually have /img/cache/ or /product/ path
      return true;
    }
    // Also accept ecs7.tokopedia.net for product images
    if (imageUrl.includes('ecs7.tokopedia.net')) {
      return true;
    }
    console.log('Tokopedia image rejected - not from valid CDN:', imageUrl.substring(0, 100));
    return false;
  }
  
  if (platform === 'lazada') {
    // Lazada uses alicdn.com and lazada CDNs
    const validLazadaPatterns = [
      /\.alicdn\.com/i,
      /lzd-img/i,
      /sg-live\.slatic/i,
      /id-live\.slatic/i,
      /my-live\.slatic/i,
    ];
    const hasValidCdn = validLazadaPatterns.some(p => p.test(imageUrl));
    if (!hasValidCdn) {
      console.log('Lazada image rejected - not from valid CDN:', imageUrl.substring(0, 100));
      return false;
    }
    return true;
  }
  
  if (platform === 'bukalapak') {
    // Bukalapak uses s3.bukalapak.com, images.bukalapak.com
    const validBukalapakPatterns = [
      /s[0-9]*\.bukalapak\.com/i,
      /images\.bukalapak\.com/i,
      /bukalapak.*\/images\//i,
    ];
    const hasValidCdn = validBukalapakPatterns.some(p => p.test(imageUrl));
    if (!hasValidCdn) {
      console.log('Bukalapak image rejected - not from valid CDN:', imageUrl.substring(0, 100));
      return false;
    }
    return true;
  }
  
  if (platform === 'blibli') {
    // Blibli uses static.bmdstatic.com
    const validBlibliPatterns = [
      /static\.bmdstatic\.com/i,
      /www\.static-src\.com/i,
    ];
    const hasValidCdn = validBlibliPatterns.some(p => p.test(imageUrl));
    if (!hasValidCdn) {
      console.log('Blibli image rejected - not from valid CDN:', imageUrl.substring(0, 100));
      return false;
    }
    return true;
  }
  
  // For unknown platform, accept any image URL
  return true;
}

// Extract product image from scraped HTML with improved patterns
function extractProductImage(html: string, url: string): string | null {
  // Detect platform
  let platform = 'unknown';
  if (url.includes('shopee')) platform = 'shopee';
  else if (url.includes('tokopedia')) platform = 'tokopedia';
  else if (url.includes('lazada')) platform = 'lazada';
  else if (url.includes('bukalapak')) platform = 'bukalapak';
  else if (url.includes('blibli')) platform = 'blibli';
  
  const candidates: string[] = [];
  
  try {
    // ============ SHOPEE ============
    if (platform === 'shopee') {
      // Method 1: Look for image hash in JSON data
      const imageHashPatterns = [
        /"image"\s*:\s*"([a-f0-9]{32})"/gi,
        /"primary_image"\s*:\s*"([a-f0-9]{32})"/gi,
        /"cover"\s*:\s*"([a-f0-9]{32})"/gi,
        /"images"\s*:\s*\[\s*"([a-f0-9]{32})"/gi,
      ];
      
      for (const pattern of imageHashPatterns) {
        const match = pattern.exec(html);
        if (match && match[1]) {
          const imageId = match[1];
          // Try different Shopee CDN URLs
          candidates.push(`https://down-id.img.susercontent.com/file/${imageId}`);
          candidates.push(`https://cf.shopee.co.id/file/${imageId}`);
          console.log('Found Shopee image hash:', imageId);
          break;
        }
      }
      
      // Method 2: Direct image URLs in JSON
      const jsonImagePattern = /"(https?:\/\/(?:down-[a-z]+\.img\.susercontent\.com|cf\.shopee\.[a-z.]+)\/[^"]+)"/gi;
      let match;
      while ((match = jsonImagePattern.exec(html)) !== null) {
        candidates.push(match[1]);
      }
      
      // Method 3: og:image meta tag
      const ogMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/i) ||
                      html.match(/content="([^"]+)"[^>]*property="og:image"/i);
      if (ogMatch && ogMatch[1] && (ogMatch[1].includes('susercontent') || ogMatch[1].includes('shopee'))) {
        candidates.push(ogMatch[1]);
      }
      
      // Method 4: Look for image in img tags with susercontent
      const imgTagPattern = /<img[^>]+src="(https?:\/\/(?:down-[a-z]+\.img\.susercontent\.com|cf\.shopee\.[a-z.]+)\/file\/[^"]+)"/gi;
      while ((match = imgTagPattern.exec(html)) !== null) {
        candidates.push(match[1]);
      }
    }

    // ============ TOKOPEDIA ============
    if (platform === 'tokopedia') {
      // Method 1: JSON patterns for product images
      const jsonPatterns = [
        /"image(?:URL|Original|300|700)?"\s*:\s*"(https?:\/\/images\.tokopedia\.net\/[^"]+)"/gi,
        /"picture"\s*:\s*\{[^}]*"original"\s*:\s*"(https?:\/\/images\.tokopedia\.net[^"]+)"/gi,
        /"thumbnailURL"\s*:\s*"(https?:\/\/images\.tokopedia\.net[^"]+)"/gi,
        /"media"\s*:\s*\[\s*\{[^}]*"URLOriginal"\s*:\s*"(https?:\/\/images\.tokopedia\.net[^"]+)"/gi,
        /"primaryImage"\s*:\s*"(https?:\/\/images\.tokopedia\.net[^"]+)"/gi,
      ];
      
      for (const pattern of jsonPatterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          candidates.push(match[1]);
        }
      }
      
      // Method 2: og:image from Tokopedia CDN
      const ogMatch = html.match(/property="og:image"[^>]*content="(https?:\/\/images\.tokopedia\.net[^"]+)"/i) ||
                      html.match(/content="(https?:\/\/images\.tokopedia\.net[^"]+)"[^>]*property="og:image"/i);
      if (ogMatch && ogMatch[1]) {
        candidates.push(ogMatch[1]);
      }
      
      // Method 3: Look for images.tokopedia.net in any URL
      const genericPattern = /"(https?:\/\/images\.tokopedia\.net\/img\/[^"]+)"/gi;
      let match;
      while ((match = genericPattern.exec(html)) !== null) {
        candidates.push(match[1]);
      }
      
      // Method 4: ecs7.tokopedia.net images
      const ecs7Pattern = /"(https?:\/\/ecs7\.tokopedia\.net\/[^"]+)"/gi;
      while ((match = ecs7Pattern.exec(html)) !== null) {
        candidates.push(match[1]);
      }
    }

    // ============ LAZADA ============
    if (platform === 'lazada') {
      // Method 1: og:image
      const ogMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/i) ||
                      html.match(/content="([^"]+)"[^>]*property="og:image"/i);
      if (ogMatch && ogMatch[1]) {
        candidates.push(ogMatch[1]);
      }
      
      // Method 2: JSON patterns for Lazada (alicdn)
      const jsonPatterns = [
        /"image"\s*:\s*"(https?:\/\/[^"]+\.alicdn\.com[^"]+)"/gi,
        /"gallery"\s*:\s*\["(https?:\/\/[^"]+\.alicdn\.com[^"]+)"/gi,
        /"originalUrl"\s*:\s*"(https?:\/\/[^"]+\.alicdn\.com[^"]+)"/gi,
      ];
      
      for (const pattern of jsonPatterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          candidates.push(match[1]);
        }
      }
      
      // Method 3: slatic.net CDN
      const slaticPattern = /"(https?:\/\/[a-z]+-live\.slatic\.net[^"]+)"/gi;
      let match;
      while ((match = slaticPattern.exec(html)) !== null) {
        candidates.push(match[1]);
      }
    }

    // ============ BUKALAPAK ============
    if (platform === 'bukalapak') {
      // Method 1: og:image
      const ogMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/i) ||
                      html.match(/content="([^"]+)"[^>]*property="og:image"/i);
      if (ogMatch && ogMatch[1]) {
        candidates.push(ogMatch[1]);
      }
      
      // Method 2: Bukalapak image patterns
      const jsonPatterns = [
        /"large_url"\s*:\s*"(https?:\/\/[^"]+bukalapak[^"]+)"/gi,
        /"medium_url"\s*:\s*"(https?:\/\/[^"]+bukalapak[^"]+)"/gi,
        /"images"\s*:\s*\{[^}]*"large_urls"\s*:\s*\["(https?:\/\/[^"]+)"/gi,
        /"primary_image_url"\s*:\s*"(https?:\/\/[^"]+)"/gi,
      ];
      
      for (const pattern of jsonPatterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          candidates.push(match[1]);
        }
      }
      
      // Method 3: s[number].bukalapak.com pattern
      const s3Pattern = /"(https?:\/\/s[0-9]+\.bukalapak\.com[^"]+)"/gi;
      let match;
      while ((match = s3Pattern.exec(html)) !== null) {
        candidates.push(match[1]);
      }
    }

    // ============ BLIBLI ============
    if (platform === 'blibli') {
      // Method 1: og:image
      const ogMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/i) ||
                      html.match(/content="([^"]+)"[^>]*property="og:image"/i);
      if (ogMatch && ogMatch[1]) {
        candidates.push(ogMatch[1]);
      }
      
      // Method 2: Blibli/bmdstatic image patterns
      const jsonPatterns = [
        /"imageUrl"\s*:\s*"(https?:\/\/[^"]+static\.bmdstatic\.com[^"]+)"/gi,
        /"images"\s*:\s*\["(https?:\/\/[^"]+static\.bmdstatic\.com[^"]+)"/gi,
        /"mainImage"\s*:\s*"(https?:\/\/[^"]+)"/gi,
      ];
      
      for (const pattern of jsonPatterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          candidates.push(match[1]);
        }
      }
      
      // Method 3: static-src.com pattern
      const staticSrcPattern = /"(https?:\/\/www\.static-src\.com[^"]+)"/gi;
      let match;
      while ((match = staticSrcPattern.exec(html)) !== null) {
        candidates.push(match[1]);
      }
    }

    // ============ GENERIC FALLBACK ============
    if (candidates.length === 0) {
      // Try og:image as last resort
      const ogMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/i) ||
                      html.match(/content="([^"]+)"[^>]*property="og:image"/i);
      if (ogMatch && ogMatch[1]) {
        candidates.push(ogMatch[1]);
      }
    }
    
    // Remove duplicates and validate
    const uniqueCandidates = [...new Set(candidates)];
    console.log(`Found ${uniqueCandidates.length} unique image candidates for ${platform}`);
    
    for (const candidate of uniqueCandidates) {
      // Clean up the URL (remove escape sequences)
      const cleanUrl = candidate.replace(/\\u002F/g, '/').replace(/\\/g, '');
      
      if (isValidProductImage(cleanUrl, platform)) {
        console.log('Valid product image found:', cleanUrl.substring(0, 150));
        return cleanUrl;
      }
    }
    
    // Log candidates for debugging
    if (uniqueCandidates.length > 0) {
      console.log('All candidates rejected. First few:', uniqueCandidates.slice(0, 3).map(c => c.substring(0, 100)));
    }
    
    console.log('No valid product image found from candidates');
    
  } catch (error) {
    console.error('Error extracting product image:', error);
  }

  console.log('Could not find product image in HTML - will use placeholder');
  return null;
}

// Try to get product image via alternative methods (API calls, URL patterns)
async function fetchProductImageFallback(url: string, platform: string): Promise<string | null> {
  try {
    // ============ TOKOPEDIA ============
    if (platform === 'tokopedia') {
      // Tokopedia blocks most API requests, so we'll try an alternative approach
      // Try to fetch the page with a simple GET and extract og:image
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
          },
          redirect: 'follow',
        });
        
        if (response.ok) {
          const html = await response.text();
          console.log('Got Tokopedia HTML via direct fetch, length:', html.length);
          
          // Try to extract og:image from HTML
          const ogMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/i) ||
                          html.match(/content="([^"]+)"[^>]*property="og:image"/i);
          if (ogMatch && ogMatch[1] && ogMatch[1].includes('tokopedia.net')) {
            console.log('Got Tokopedia image from direct fetch og:image');
            return ogMatch[1];
          }
          
          // Try other patterns
          const imagePatterns = [
            /"image(?:Original|700)?"\s*:\s*"(https?:\/\/images\.tokopedia\.net[^"]+)"/i,
            /"primaryImage"\s*:\s*"(https?:\/\/images\.tokopedia\.net[^"]+)"/i,
            /"URLOriginal"\s*:\s*"(https?:\/\/images\.tokopedia\.net[^"]+)"/i,
          ];
          
          for (const pattern of imagePatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
              console.log('Got Tokopedia image from pattern:', pattern.toString());
              return match[1];
            }
          }
        }
      } catch (directFetchError) {
        console.log('Tokopedia direct fetch failed:', directFetchError);
      }
    }
    
    // ============ LAZADA ============
    if (platform === 'lazada') {
      // Try direct fetch for Lazada
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          },
          redirect: 'follow',
        });
        
        if (response.ok) {
          const html = await response.text();
          console.log('Got Lazada HTML via direct fetch, length:', html.length);
          
          // Try og:image
          const ogMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/i) ||
                          html.match(/content="([^"]+)"[^>]*property="og:image"/i);
          if (ogMatch && ogMatch[1] && (ogMatch[1].includes('alicdn') || ogMatch[1].includes('slatic'))) {
            console.log('Got Lazada image from direct fetch');
            return ogMatch[1];
          }
        }
      } catch (directFetchError) {
        console.log('Lazada direct fetch failed:', directFetchError);
      }
    }
    
    // ============ BUKALAPAK ============
    if (platform === 'bukalapak') {
      // Try direct fetch for Bukalapak
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          },
          redirect: 'follow',
        });
        
        if (response.ok) {
          const html = await response.text();
          console.log('Got Bukalapak HTML via direct fetch, length:', html.length);
          
          // Try og:image
          const ogMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/i) ||
                          html.match(/content="([^"]+)"[^>]*property="og:image"/i);
          if (ogMatch && ogMatch[1] && ogMatch[1].includes('bukalapak')) {
            console.log('Got Bukalapak image from direct fetch');
            return ogMatch[1];
          }
        }
      } catch (directFetchError) {
        console.log('Bukalapak direct fetch failed:', directFetchError);
      }
    }
    
  } catch (error) {
    console.error('Error in image fallback:', error);
  }
  
  return null;
}

// Extract product variants (size, color, category) from HTML
interface ProductVariant {
  type: string; // 'size', 'color', 'category', etc.
  name: string;
  options: string[];
  selectedOption?: string;
}

interface VariantInfo {
  hasVariants: boolean;
  variants: ProductVariant[];
  priceRange?: { min: number; max: number };
  selectedVariantPrice?: number;
}

function extractVariants(html: string, url: string): VariantInfo {
  const result: VariantInfo = {
    hasVariants: false,
    variants: [],
  };

  try {
    // ============ SHOPEE ============
    if (url.includes('shopee')) {
      // Look for tier variations (Shopee's variant structure)
      const tierVariationsMatch = html.match(/"tier_variations"\s*:\s*(\[[\s\S]*?\](?=,\s*"[a-z]))/);
      if (tierVariationsMatch) {
        try {
          const variationsStr = tierVariationsMatch[1];
          
          // Extract each variation object
          const variationBlocks = variationsStr.match(/\{[^{}]*"name"[^{}]*"options"[^{}]*\[.*?\][^{}]*\}/g) || [];
          
          for (const block of variationBlocks) {
            const nameMatch = block.match(/"name"\s*:\s*"([^"]+)"/);
            const optionsMatch = block.match(/"options"\s*:\s*\[(.*?)\]/);
            
            if (nameMatch && optionsMatch) {
              const variantName = nameMatch[1];
              const optionsStr = optionsMatch[1];
              const options = (optionsStr.match(/"([^"]+)"/g) || []).map(o => o.replace(/"/g, ''));
              
              if (options.length > 0) {
                const lowerName = variantName.toLowerCase();
                let type = 'other';
                
                if (lowerName.includes('warna') || lowerName.includes('color') || lowerName.includes('colour')) {
                  type = 'color';
                } else if (lowerName.includes('ukuran') || lowerName.includes('size') || lowerName.match(/^[smlx]+$/)) {
                  type = 'size';
                } else if (lowerName.includes('model') || lowerName.includes('tipe') || lowerName.includes('type') || lowerName.includes('varian')) {
                  type = 'category';
                } else if (lowerName.includes('berat') || lowerName.includes('weight') || lowerName.includes('gram') || lowerName.includes('kg')) {
                  type = 'weight';
                }
                
                result.variants.push({
                  type,
                  name: variantName,
                  options: options.slice(0, 20), // Limit to 20 options
                });
              }
            }
          }
          
          if (result.variants.length > 0) {
            result.hasVariants = true;
            console.log('Found Shopee variants:', JSON.stringify(result.variants));
          }
        } catch (e) {
          console.error('Error parsing Shopee tier_variations:', e);
        }
      }
      
      // Look for price range in models
      const priceMinMatch = html.match(/"price_min"\s*:\s*(\d+)/);
      const priceMaxMatch = html.match(/"price_max"\s*:\s*(\d+)/);
      
      if (priceMinMatch && priceMaxMatch) {
        const min = parseInt(priceMinMatch[1]);
        const max = parseInt(priceMaxMatch[1]);
        // Shopee stores prices in cents (x100000), normalize
        const normalizedMin = min > 100000000 ? Math.round(min / 100000) : min;
        const normalizedMax = max > 100000000 ? Math.round(max / 100000) : max;
        
        if (normalizedMin !== normalizedMax && normalizedMin > 0 && normalizedMax > normalizedMin) {
          result.priceRange = { min: normalizedMin, max: normalizedMax };
          result.hasVariants = true;
          console.log('Found Shopee price range:', result.priceRange);
        }
      }
    }

    // ============ TOKOPEDIA ============
    if (url.includes('tokopedia')) {
      // Method 1: Look for variant structure in GraphQL data
      const variantMatch = html.match(/"variant"\s*:\s*(\{[\s\S]*?"children"[\s\S]*?\})/);
      if (variantMatch) {
        try {
          // Extract variant names
          const variantNamesMatches = html.matchAll(/"identifier"\s*:\s*"([^"]+)"/g);
          const optionNamesMatches = html.matchAll(/"option"\s*:\s*\[\s*\{[^}]*"value"\s*:\s*"([^"]+)"/g);
          
          const seenNames = new Set<string>();
          const variants: ProductVariant[] = [];
          
          for (const match of variantNamesMatches) {
            const name = match[1];
            if (!seenNames.has(name) && name.length < 50) {
              seenNames.add(name);
              const lowerName = name.toLowerCase();
              let type = 'other';
              
              if (lowerName.includes('warna') || lowerName.includes('color')) {
                type = 'color';
              } else if (lowerName.includes('ukuran') || lowerName.includes('size')) {
                type = 'size';
              } else if (lowerName.includes('model') || lowerName.includes('tipe')) {
                type = 'category';
              }
              
              variants.push({
                type,
                name,
                options: [],
              });
            }
          }
          
          // Try to get options from children
          const childrenMatch = html.match(/"children"\s*:\s*\[([\s\S]*?)\](?=\s*[,}])/);
          if (childrenMatch && variants.length > 0) {
            const optionMatches = childrenMatch[1].matchAll(/"optionName"\s*:\s*\[([^\]]+)\]/g);
            for (const match of optionMatches) {
              const options = (match[1].match(/"([^"]+)"/g) || []).map(o => o.replace(/"/g, ''));
              if (options.length > 0 && variants[0]) {
                variants[0].options = [...new Set([...variants[0].options, ...options])].slice(0, 20);
              }
            }
          }
          
          if (variants.length > 0 && variants.some(v => v.options.length > 0)) {
            result.variants = variants.filter(v => v.options.length > 0);
            result.hasVariants = true;
            console.log('Found Tokopedia variants:', JSON.stringify(result.variants));
          }
        } catch (e) {
          console.error('Error parsing Tokopedia variants:', e);
        }
      }
      
      // Method 2: Look for price variations in children
      if (!result.hasVariants) {
        const childMatch = html.match(/"children"\s*:\s*\[([\s\S]*?)\](?=\s*[,}])/);
        if (childMatch) {
          const prices: number[] = [];
          const priceMatches = childMatch[1].matchAll(/"price"\s*:\s*(\d+)/g);
          for (const match of priceMatches) {
            const price = parseInt(match[1]);
            if (price > 1000 && price < 100000000) {
              prices.push(price);
            }
          }
          
          if (prices.length > 1) {
            const uniquePrices = [...new Set(prices)];
            if (uniquePrices.length > 1) {
              const min = Math.min(...uniquePrices);
              const max = Math.max(...uniquePrices);
              result.priceRange = { min, max };
              result.hasVariants = true;
              console.log('Found Tokopedia price range from children:', result.priceRange);
            }
          }
        }
      }
    }

    // ============ LAZADA ============
    if (url.includes('lazada')) {
      try {
        // Lazada stores variant data in skuInfos
        const skuInfoMatch = html.match(/"skuInfos"\s*:\s*(\[[\s\S]*?\])(?=\s*[,}])/);
        if (skuInfoMatch) {
          const prices: number[] = [];
          const priceMatches = skuInfoMatch[1].matchAll(/"price"\s*:\s*(\d+(?:\.\d+)?)/g);
          for (const match of priceMatches) {
            const price = Math.round(parseFloat(match[1]));
            if (price > 1000 && price < 100000000) {
              prices.push(price);
            }
          }
          
          if (prices.length > 1) {
            const uniquePrices = [...new Set(prices)];
            if (uniquePrices.length > 1) {
              result.priceRange = { min: Math.min(...uniquePrices), max: Math.max(...uniquePrices) };
              result.hasVariants = true;
            }
          }
        }
        
        // Look for properties (color, size, etc)
        const propsMatch = html.match(/"properties"\s*:\s*(\[[\s\S]*?\])(?=\s*[,}])/);
        if (propsMatch) {
          const propBlocks = propsMatch[1].match(/\{[^{}]*"name"[^{}]*"values"[^{}]*\}/g) || [];
          
          for (const block of propBlocks) {
            const nameMatch = block.match(/"name"\s*:\s*"([^"]+)"/);
            const valuesMatch = block.match(/"values"\s*:\s*\[(.*?)\]/);
            
            if (nameMatch && valuesMatch) {
              const name = nameMatch[1];
              const values = (valuesMatch[1].match(/"([^"]+)"/g) || []).map(v => v.replace(/"/g, ''));
              
              if (values.length > 0) {
                const lowerName = name.toLowerCase();
                let type = 'other';
                if (lowerName.includes('color') || lowerName.includes('warna')) type = 'color';
                else if (lowerName.includes('size') || lowerName.includes('ukuran')) type = 'size';
                
                result.variants.push({ type, name, options: values.slice(0, 20) });
                result.hasVariants = true;
              }
            }
          }
        }
        
        if (result.hasVariants) {
          console.log('Found Lazada variants:', JSON.stringify(result.variants));
        }
      } catch (e) {
        console.error('Error parsing Lazada variants:', e);
      }
    }

    // ============ BUKALAPAK ============
    if (url.includes('bukalapak')) {
      try {
        // Look for variant_options
        const variantMatch = html.match(/"variant_options"\s*:\s*(\[[\s\S]*?\])(?=\s*[,}])/);
        if (variantMatch) {
          const optionBlocks = variantMatch[1].match(/\{[^{}]*"name"[^{}]*"values"[^{}]*\}/g) || [];
          
          for (const block of optionBlocks) {
            const nameMatch = block.match(/"name"\s*:\s*"([^"]+)"/);
            const valuesMatch = block.match(/"values"\s*:\s*\[(.*?)\]/);
            
            if (nameMatch && valuesMatch) {
              const name = nameMatch[1];
              const values = (valuesMatch[1].match(/"([^"]+)"/g) || []).map(v => v.replace(/"/g, ''));
              
              if (values.length > 0) {
                const lowerName = name.toLowerCase();
                let type = 'other';
                if (lowerName.includes('warna') || lowerName.includes('color')) type = 'color';
                else if (lowerName.includes('ukuran') || lowerName.includes('size')) type = 'size';
                
                result.variants.push({ type, name, options: values.slice(0, 20) });
                result.hasVariants = true;
              }
            }
          }
        }
        
        // Look for price variations
        const variantSkusMatch = html.match(/"variant_skus"\s*:\s*(\[[\s\S]*?\])(?=\s*[,}])/);
        if (variantSkusMatch) {
          const prices: number[] = [];
          const priceMatches = variantSkusMatch[1].matchAll(/"price"\s*:\s*(\d+)/g);
          for (const match of priceMatches) {
            prices.push(parseInt(match[1]));
          }
          
          if (prices.length > 1) {
            const uniquePrices = [...new Set(prices)].filter(p => p > 1000);
            if (uniquePrices.length > 1) {
              result.priceRange = { min: Math.min(...uniquePrices), max: Math.max(...uniquePrices) };
              result.hasVariants = true;
            }
          }
        }
        
        if (result.hasVariants) {
          console.log('Found Bukalapak variants:', JSON.stringify(result.variants));
        }
      } catch (e) {
        console.error('Error parsing Bukalapak variants:', e);
      }
    }

    // ============ BLIBLI ============
    if (url.includes('blibli')) {
      try {
        // Blibli uses itemVariants
        const variantMatch = html.match(/"itemVariants"\s*:\s*(\[[\s\S]*?\])(?=\s*[,}])/);
        if (variantMatch) {
          const optionBlocks = variantMatch[1].match(/\{[^{}]*"variantName"[^{}]*"options"[^{}]*\}/g) || [];
          
          for (const block of optionBlocks) {
            const nameMatch = block.match(/"variantName"\s*:\s*"([^"]+)"/);
            const optionsMatch = block.match(/"options"\s*:\s*\[(.*?)\]/);
            
            if (nameMatch && optionsMatch) {
              const name = nameMatch[1];
              const options = (optionsMatch[1].match(/"([^"]+)"/g) || []).map(o => o.replace(/"/g, ''));
              
              if (options.length > 0) {
                const lowerName = name.toLowerCase();
                let type = 'other';
                if (lowerName.includes('warna') || lowerName.includes('color')) type = 'color';
                else if (lowerName.includes('ukuran') || lowerName.includes('size')) type = 'size';
                
                result.variants.push({ type, name, options: options.slice(0, 20) });
                result.hasVariants = true;
              }
            }
          }
        }
        
        // Look for price range
        const pricesMatch = html.match(/"itemSkus"\s*:\s*(\[[\s\S]*?\])(?=\s*[,}])/);
        if (pricesMatch) {
          const prices: number[] = [];
          const priceMatches = pricesMatch[1].matchAll(/"salePrice"\s*:\s*(\d+)/g);
          for (const match of priceMatches) {
            prices.push(parseInt(match[1]));
          }
          
          if (prices.length > 1) {
            const uniquePrices = [...new Set(prices)].filter(p => p > 1000);
            if (uniquePrices.length > 1) {
              result.priceRange = { min: Math.min(...uniquePrices), max: Math.max(...uniquePrices) };
              result.hasVariants = true;
            }
          }
        }
        
        if (result.hasVariants) {
          console.log('Found Blibli variants:', JSON.stringify(result.variants));
        }
      } catch (e) {
        console.error('Error parsing Blibli variants:', e);
      }
    }

    // ============ GENERIC FALLBACK ============
    if (!result.hasVariants) {
      // Try generic patterns that work across platforms
      const genericVariantPatterns = [
        /"variants?"\s*:\s*\[([\s\S]*?)\](?=\s*[,}])/i,
        /"options?"\s*:\s*\[([\s\S]*?)\](?=\s*[,}])/i,
        /"selections?"\s*:\s*\[([\s\S]*?)\](?=\s*[,}])/i,
      ];
      
      for (const pattern of genericVariantPatterns) {
        const match = pattern.exec(html);
        if (match) {
          // Look for names inside
          const nameMatches = match[1].matchAll(/"(?:name|label|title)"\s*:\s*"([^"]+)"/g);
          const foundNames: string[] = [];
          
          for (const nameMatch of nameMatches) {
            if (nameMatch[1] && nameMatch[1].length < 50 && !foundNames.includes(nameMatch[1])) {
              foundNames.push(nameMatch[1]);
            }
          }
          
          if (foundNames.length > 1) {
            result.variants.push({
              type: 'other',
              name: 'Varian',
              options: foundNames.slice(0, 20),
            });
            result.hasVariants = true;
            console.log('Found generic variants:', foundNames);
            break;
          }
        }
      }
    }

  } catch (error) {
    console.error('Error in extractVariants:', error);
    // Return empty result on error, don't crash
  }

  return result;
}

// Extract price from scraped HTML - prioritize this for accuracy
function extractPrice(html: string, url: string, variantInfo?: VariantInfo): { 
  price: number; 
  originalPrice: number | null;
  priceRange?: { min: number; max: number };
} | null {
  let price: number | null = null;
  let originalPrice: number | null = null;
  let priceRange: { min: number; max: number } | undefined = variantInfo?.priceRange;

  try {
    // ============ SHOPEE ============
    if (url.includes('shopee')) {
      // If there's a price range, use the minimum as the display price
      if (priceRange) {
        price = priceRange.min;
      } else {
        // Look for price in JSON data - try multiple patterns (Shopee has many formats)
        const pricePatterns = [
          /"price"\s*:\s*(\d+)/,
          /"final_price"\s*:\s*(\d+)/,
          /"current_price"\s*:\s*(\d+)/,
          /"item_basic"[\s\S]*?"price"\s*:\s*(\d+)/,
          /"flash_sale"[\s\S]*?"price"\s*:\s*(\d+)/,
          /"discount_price"\s*:\s*(\d+)/,
        ];
        
        for (const pattern of pricePatterns) {
          const match = pattern.exec(html);
          if (match && match[1]) {
            let parsed = parseInt(match[1]);
            // Shopee stores prices in cents (x100000), normalize if needed
            if (parsed > 100000000) {
              parsed = Math.round(parsed / 100000);
            }
            if (parsed > 1000 && parsed < 100000000) {
              if (!price || parsed < price) {
                price = parsed;
              }
            }
          }
        }
        
        // Also try to extract from meta tags
        if (!price) {
          const metaPrice = html.match(/property="product:price:amount"[^>]*content="(\d+)"/i);
          if (metaPrice && metaPrice[1]) {
            const parsed = parseInt(metaPrice[1]);
            if (parsed > 1000 && parsed < 100000000) {
              price = parsed;
            }
          }
        }
      }
      
      // Look for original/before discount price
      const origPatterns = [
        /"price_before_discount"\s*:\s*(\d+)/,
        /"origin_price"\s*:\s*(\d+)/,
        /"list_price"\s*:\s*(\d+)/,
      ];
      
      for (const pattern of origPatterns) {
        const origMatch = pattern.exec(html);
        if (origMatch && origMatch[1]) {
          let parsed = parseInt(origMatch[1]);
          if (parsed > 100000000) {
            parsed = Math.round(parsed / 100000);
          }
          if (parsed > (price || 0)) {
            originalPrice = parsed;
            break;
          }
        }
      }
    }

    // ============ TOKOPEDIA ============
    if (url.includes('tokopedia')) {
      if (priceRange) {
        price = priceRange.min;
      } else {
        // Tokopedia typically has price in meta tags or JSON-LD
        const metaPriceMatch = html.match(/property="product:price:amount"[^>]*content="(\d+)"/i) ||
                               html.match(/content="(\d+)"[^>]*property="product:price:amount"/i);
        if (metaPriceMatch && metaPriceMatch[1]) {
          price = parseInt(metaPriceMatch[1]);
        }
        
        // Try JSON patterns
        if (!price) {
          const jsonPriceMatch = /"price"\s*:\s*(\d+)/.exec(html);
          if (jsonPriceMatch && jsonPriceMatch[1]) {
            const parsed = parseInt(jsonPriceMatch[1]);
            if (parsed > 1000 && parsed < 100000000) {
              price = parsed;
            }
          }
        }
      }
      
      // Look for original price (slashed price)
      const origPriceMatch = /"originalPrice"\s*:\s*(\d+)/.exec(html) ||
                             /"slashPrice"\s*:\s*(\d+)/.exec(html);
      if (origPriceMatch && origPriceMatch[1]) {
        const parsed = parseInt(origPriceMatch[1]);
        if (parsed > (price || 0)) {
          originalPrice = parsed;
        }
      }
    }

    // ============ LAZADA ============
    if (url.includes('lazada')) {
      if (priceRange) {
        price = priceRange.min;
      } else {
        // Lazada has various price formats
        const pricePatterns = [
          /"priceCurrency":\s*"IDR"[\s\S]*?"price"\s*:\s*"?(\d+(?:\.\d+)?)"?/,
          /"price"\s*:\s*"?(\d+(?:\.\d+)?)"?/,
          /"salePrice"\s*:\s*"?(\d+(?:\.\d+)?)"?/,
          /"specialPrice"\s*:\s*"?(\d+(?:\.\d+)?)"?/,
          /"priceInfo"[\s\S]*?"price"\s*:\s*"?(\d+(?:\.\d+)?)"?/,
          /"priceShow"\s*:\s*"Rp\s*([\d.,]+)"/,
        ];
        
        for (const pattern of pricePatterns) {
          const match = pattern.exec(html);
          if (match && match[1]) {
            // Handle price with dots/commas (e.g., "1.500.000")
            const cleanPrice = match[1].replace(/\./g, '').replace(/,/g, '');
            const parsed = Math.round(parseFloat(cleanPrice));
            if (parsed > 1000 && parsed < 100000000) {
              price = parsed;
              break;
            }
          }
        }
        
        // Try meta tags
        if (!price) {
          const metaPrice = html.match(/property="product:price:amount"[^>]*content="(\d+)"/i);
          if (metaPrice && metaPrice[1]) {
            const parsed = parseInt(metaPrice[1]);
            if (parsed > 1000 && parsed < 100000000) {
              price = parsed;
            }
          }
        }
      }
      
      // Original price
      const origPatterns = [
        /"originalPrice"\s*:\s*"?(\d+(?:\.\d+)?)"?/,
        /"priceBefore"\s*:\s*"?(\d+(?:\.\d+)?)"?/,
      ];
      
      for (const pattern of origPatterns) {
        const origMatch = pattern.exec(html);
        if (origMatch && origMatch[1]) {
          const parsed = Math.round(parseFloat(origMatch[1]));
          if (parsed > (price || 0)) {
            originalPrice = parsed;
            break;
          }
        }
      }
    }

    // ============ BUKALAPAK ============
    if (url.includes('bukalapak')) {
      if (priceRange) {
        price = priceRange.min;
      } else {
        // Bukalapak price patterns
        const pricePatterns = [
          /"price"\s*:\s*(\d+)/,
          /"discounted_price"\s*:\s*(\d+)/,
          /"min_price"\s*:\s*(\d+)/,
          /"current_price"\s*:\s*(\d+)/,
          /"deal_price"\s*:\s*(\d+)/,
          /"amount"\s*:\s*(\d+)/,
        ];
        
        for (const pattern of pricePatterns) {
          const match = pattern.exec(html);
          if (match && match[1]) {
            const parsed = parseInt(match[1]);
            if (parsed > 1000 && parsed < 100000000) {
              price = parsed;
              break;
            }
          }
        }
        
        // Try meta tags
        if (!price) {
          const metaPrice = html.match(/property="product:price:amount"[^>]*content="(\d+)"/i) ||
                            html.match(/itemprop="price"[^>]*content="(\d+)"/i);
          if (metaPrice && metaPrice[1]) {
            const parsed = parseInt(metaPrice[1]);
            if (parsed > 1000 && parsed < 100000000) {
              price = parsed;
            }
          }
        }
      }
      
      // Original price
      const origPatterns = [
        /"original_price"\s*:\s*(\d+)/,
        /"normal_price"\s*:\s*(\d+)/,
        /"list_price"\s*:\s*(\d+)/,
      ];
      
      for (const pattern of origPatterns) {
        const origMatch = pattern.exec(html);
        if (origMatch && origMatch[1]) {
          const parsed = parseInt(origMatch[1]);
          if (parsed > (price || 0)) {
            originalPrice = parsed;
            break;
          }
        }
      }
    }

    // ============ BLIBLI ============
    if (url.includes('blibli')) {
      if (priceRange) {
        price = priceRange.min;
      } else {
        const pricePatterns = [
          /"salePrice"\s*:\s*(\d+)/,
          /"price"\s*:\s*(\d+)/,
          /"displayPrice"\s*:\s*(\d+)/,
        ];
        
        for (const pattern of pricePatterns) {
          const match = pattern.exec(html);
          if (match && match[1]) {
            const parsed = parseInt(match[1]);
            if (parsed > 1000 && parsed < 100000000) {
              price = parsed;
              break;
            }
          }
        }
      }
      
      // Original price
      const origMatch = /"regularPrice"\s*:\s*(\d+)/.exec(html) ||
                        /"originalPrice"\s*:\s*(\d+)/.exec(html);
      if (origMatch && origMatch[1]) {
        const parsed = parseInt(origMatch[1]);
        if (parsed > (price || 0)) {
          originalPrice = parsed;
        }
      }
    }

    // ============ GENERIC FALLBACK ============
    if (!price) {
      // Try meta tags first (most reliable)
      const metaPatterns = [
        /property="product:price:amount"[^>]*content="(\d+)"/i,
        /content="(\d+)"[^>]*property="product:price:amount"/i,
        /itemprop="price"[^>]*content="(\d+)"/i,
      ];
      
      for (const pattern of metaPatterns) {
        const match = pattern.exec(html);
        if (match && match[1]) {
          const parsed = parseInt(match[1]);
          if (parsed > 1000 && parsed < 100000000) {
            price = parsed;
            break;
          }
        }
      }
      
      // Try JSON patterns
      if (!price) {
        const jsonPatterns = [
          /"price"\s*:\s*"?(\d+)"?/,
          /"currentPrice"\s*:\s*"?(\d+)"?/,
        ];
        
        for (const pattern of jsonPatterns) {
          const match = pattern.exec(html);
          if (match && match[1]) {
            const parsed = parseInt(match[1]);
            if (parsed > 1000 && parsed < 100000000) {
              price = parsed;
              break;
            }
          }
        }
      }
    }

    if (price) {
      console.log('Extracted price from HTML:', price, 'Original:', originalPrice, 'Range:', priceRange);
      return { price, originalPrice, priceRange };
    }
  } catch (error) {
    console.error('Error extracting price:', error);
  }
  
  console.log('Could not extract price from HTML');
  return null;
}

// Extract rating, review count, and sold count from HTML
interface RatingInfo {
  rating: number;
  totalReviews: number;
  soldCount?: number;
}

function extractRating(html: string, url: string): RatingInfo | null {
  let rating: number | null = null;
  let totalReviews: number | null = null;
  let soldCount: number | null = null;

  try {
    // ============ SHOPEE ============
    if (url.includes('shopee')) {
      // Multiple rating patterns for Shopee
      const ratingPatterns = [
        /"rating"\s*:\s*([\d.]+)/,
        /"item_rating"[\s\S]*?"rating_star"\s*:\s*([\d.]+)/,
        /"rating_star"\s*:\s*([\d.]+)/,
      ];
      
      for (const pattern of ratingPatterns) {
        const ratingMatch = pattern.exec(html);
        if (ratingMatch && ratingMatch[1]) {
          const parsed = parseFloat(ratingMatch[1]);
          if (parsed >= 0 && parsed <= 5) {
            rating = parsed;
            break;
          }
        }
      }
      
      // Review count patterns
      const reviewPatterns = [
        /"cmt_count"\s*:\s*(\d+)/,
        /"rating_count"\s*:\s*\[?(\d+)/,
        /"rcount_with_context"\s*:\s*(\d+)/,
      ];
      
      for (const pattern of reviewPatterns) {
        const reviewMatch = pattern.exec(html);
        if (reviewMatch && reviewMatch[1]) {
          const count = parseInt(reviewMatch[1]);
          if (count > 0) {
            totalReviews = count;
            break;
          }
        }
      }
      
      // Sold count patterns for Shopee
      const soldPatterns = [
        /"sold"\s*:\s*(\d+)/,
        /"historical_sold"\s*:\s*(\d+)/,
        /"real_sold"\s*:\s*(\d+)/,
      ];
      
      for (const pattern of soldPatterns) {
        const soldMatch = pattern.exec(html);
        if (soldMatch && soldMatch[1]) {
          const count = parseInt(soldMatch[1]);
          if (count > 0) {
            soldCount = count;
            break;
          }
        }
      }
    }

    // ============ TOKOPEDIA ============
    if (url.includes('tokopedia')) {
      const ratingMatch = /"ratingScore"\s*:\s*([\d.]+)/.exec(html) ||
                          /"rating"\s*:\s*([\d.]+)/.exec(html);
      if (ratingMatch && ratingMatch[1]) {
        const parsed = parseFloat(ratingMatch[1]);
        if (parsed >= 0 && parsed <= 5) {
          rating = parsed;
        }
      }
      const reviewMatch = /"reviewCount"\s*:\s*(\d+)/.exec(html) ||
                          /"countReview"\s*:\s*(\d+)/.exec(html) ||
                          /"totalReview"\s*:\s*(\d+)/.exec(html);
      if (reviewMatch && reviewMatch[1]) {
        totalReviews = parseInt(reviewMatch[1]);
      }
      
      // Sold count for Tokopedia
      const soldMatch = /"countSold"\s*:\s*(\d+)/.exec(html) ||
                        /"soldCount"\s*:\s*(\d+)/.exec(html) ||
                        /"txSuccess"\s*:\s*(\d+)/.exec(html);
      if (soldMatch && soldMatch[1]) {
        soldCount = parseInt(soldMatch[1]);
      }
    }

    // ============ LAZADA ============
    if (url.includes('lazada')) {
      // Multiple rating patterns for Lazada
      const ratingPatterns = [
        /"average"\s*:\s*([\d.]+)/,
        /"ratingScore"\s*:\s*([\d.]+)/,
        /"averageScore"\s*:\s*([\d.]+)/,
        /"rating"\s*:\s*([\d.]+)/,
      ];
      
      for (const pattern of ratingPatterns) {
        const ratingMatch = pattern.exec(html);
        if (ratingMatch && ratingMatch[1]) {
          const parsed = parseFloat(ratingMatch[1]);
          if (parsed >= 0 && parsed <= 5) {
            rating = parsed;
            break;
          }
        }
      }
      
      // Review count patterns
      const reviewPatterns = [
        /"ratingCount"\s*:\s*(\d+)/,
        /"reviewCount"\s*:\s*(\d+)/,
        /"totalRatings"\s*:\s*(\d+)/,
      ];
      
      for (const pattern of reviewPatterns) {
        const reviewMatch = pattern.exec(html);
        if (reviewMatch && reviewMatch[1]) {
          totalReviews = parseInt(reviewMatch[1]);
          break;
        }
      }
      
      // Sold count for Lazada
      const soldMatch = /"itemSoldCntShow"\s*:\s*"?(\d+)"?/.exec(html) ||
                        /"sold"\s*:\s*(\d+)/.exec(html);
      if (soldMatch && soldMatch[1]) {
        soldCount = parseInt(soldMatch[1]);
      }
    }

    // ============ BUKALAPAK ============
    if (url.includes('bukalapak')) {
      // Multiple rating patterns for Bukalapak
      const ratingPatterns = [
        /"average_rate"\s*:\s*([\d.]+)/,
        /"rating"\s*:\s*([\d.]+)/,
        /"averageRating"\s*:\s*([\d.]+)/,
        /"score"\s*:\s*([\d.]+)/,
      ];
      
      for (const pattern of ratingPatterns) {
        const ratingMatch = pattern.exec(html);
        if (ratingMatch && ratingMatch[1]) {
          const parsed = parseFloat(ratingMatch[1]);
          if (parsed >= 0 && parsed <= 5) {
            rating = parsed;
            break;
          }
        }
      }
      
      // Review count patterns
      const reviewPatterns = [
        /"review_count"\s*:\s*(\d+)/,
        /"reviews_count"\s*:\s*(\d+)/,
        /"total_reviews"\s*:\s*(\d+)/,
      ];
      
      for (const pattern of reviewPatterns) {
        const reviewMatch = pattern.exec(html);
        if (reviewMatch && reviewMatch[1]) {
          totalReviews = parseInt(reviewMatch[1]);
          break;
        }
      }
      
      // Sold count for Bukalapak
      const soldMatch = /"sold_count"\s*:\s*(\d+)/.exec(html) ||
                        /"success_sold"\s*:\s*(\d+)/.exec(html);
      if (soldMatch && soldMatch[1]) {
        soldCount = parseInt(soldMatch[1]);
      }
    }

    // ============ BLIBLI ============
    if (url.includes('blibli')) {
      const ratingMatch = /"averageRating"\s*:\s*([\d.]+)/.exec(html) ||
                          /"rating"\s*:\s*([\d.]+)/.exec(html);
      if (ratingMatch && ratingMatch[1]) {
        const parsed = parseFloat(ratingMatch[1]);
        if (parsed >= 0 && parsed <= 5) {
          rating = parsed;
        }
      }
      const reviewMatch = /"totalReview"\s*:\s*(\d+)/.exec(html) ||
                          /"reviewCount"\s*:\s*(\d+)/.exec(html);
      if (reviewMatch && reviewMatch[1]) {
        totalReviews = parseInt(reviewMatch[1]);
      }
      
      // Sold count for Blibli
      const soldMatch = /"soldCount"\s*:\s*(\d+)/.exec(html);
      if (soldMatch && soldMatch[1]) {
        soldCount = parseInt(soldMatch[1]);
      }
    }

    // ============ GENERIC FALLBACK ============
    if (rating === null) {
      // Try generic rating patterns
      const genericRatingPatterns = [
        /"aggregateRating"[^}]*"ratingValue"\s*:\s*"?([\d.]+)"?/i,
        /"ratingValue"\s*:\s*"?([\d.]+)"?/i,
        /itemprop="ratingValue"[^>]*content="([\d.]+)"/i,
      ];
      
      for (const pattern of genericRatingPatterns) {
        const match = pattern.exec(html);
        if (match && match[1]) {
          const parsed = parseFloat(match[1]);
          if (parsed >= 0 && parsed <= 5) {
            rating = parsed;
            break;
          }
        }
      }
    }
    
    if (totalReviews === null) {
      const genericReviewPatterns = [
        /"reviewCount"\s*:\s*"?(\d+)"?/i,
        /"ratingCount"\s*:\s*"?(\d+)"?/i,
        /itemprop="reviewCount"[^>]*content="(\d+)"/i,
      ];
      
      for (const pattern of genericReviewPatterns) {
        const match = pattern.exec(html);
        if (match && match[1]) {
          totalReviews = parseInt(match[1]);
          break;
        }
      }
    }

    if (rating !== null) {
      console.log('Extracted rating from HTML:', rating, 'Reviews:', totalReviews, 'Sold:', soldCount);
      return { rating, totalReviews: totalReviews || 0, soldCount: soldCount || undefined };
    }
  } catch (error) {
    console.error('Error extracting rating:', error);
  }
  
  return null;
}

// Extract category from HTML
function extractCategory(html: string, url: string): string | null {
  try {
    // ============ SHOPEE ============
    if (url.includes('shopee')) {
      // Look for category in breadcrumb or JSON data
      const categoryPatterns = [
        /"categories"\s*:\s*\[[\s\S]*?"display_name"\s*:\s*"([^"]+)"/,
        /"category_name"\s*:\s*"([^"]+)"/,
        /"catName"\s*:\s*"([^"]+)"/,
      ];
      
      for (const pattern of categoryPatterns) {
        const match = pattern.exec(html);
        if (match && match[1] && match[1].length > 2) {
          console.log('Extracted Shopee category:', match[1]);
          return match[1];
        }
      }
    }

    // ============ TOKOPEDIA ============
    if (url.includes('tokopedia')) {
      const categoryPatterns = [
        /"categoryName"\s*:\s*"([^"]+)"/,
        /"category"\s*:\s*"([^"]+)"/,
        /"breadcrumbs"[\s\S]*?"name"\s*:\s*"([^"]+)"/,
      ];
      
      for (const pattern of categoryPatterns) {
        const match = pattern.exec(html);
        if (match && match[1] && match[1].length > 2) {
          console.log('Extracted Tokopedia category:', match[1]);
          return match[1];
        }
      }
    }

    // ============ LAZADA ============
    if (url.includes('lazada')) {
      const categoryPatterns = [
        /"categoryName"\s*:\s*"([^"]+)"/,
        /"category"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/,
        /"breadcrumb"[\s\S]*?"name"\s*:\s*"([^"]+)"/,
      ];
      
      for (const pattern of categoryPatterns) {
        const match = pattern.exec(html);
        if (match && match[1] && match[1].length > 2) {
          console.log('Extracted Lazada category:', match[1]);
          return match[1];
        }
      }
    }

    // ============ BUKALAPAK ============
    if (url.includes('bukalapak')) {
      const categoryPatterns = [
        /"category"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/,
        /"category_name"\s*:\s*"([^"]+)"/,
      ];
      
      for (const pattern of categoryPatterns) {
        const match = pattern.exec(html);
        if (match && match[1] && match[1].length > 2) {
          console.log('Extracted Bukalapak category:', match[1]);
          return match[1];
        }
      }
    }

    // ============ BLIBLI ============
    if (url.includes('blibli')) {
      const categoryPatterns = [
        /"categoryName"\s*:\s*"([^"]+)"/,
        /"category"\s*:\s*"([^"]+)"/,
      ];
      
      for (const pattern of categoryPatterns) {
        const match = pattern.exec(html);
        if (match && match[1] && match[1].length > 2) {
          console.log('Extracted Blibli category:', match[1]);
          return match[1];
        }
      }
    }

  } catch (error) {
    console.error('Error extracting category:', error);
  }
  
  return null;
}

// Extract seller name from HTML
function extractSeller(html: string, url: string): string | null {
  try {
    // ============ SHOPEE ============
    if (url.includes('shopee')) {
      const sellerPatterns = [
        /"shop_name"\s*:\s*"([^"]+)"/,
        /"shopName"\s*:\s*"([^"]+)"/,
        /"name"\s*:\s*"([^"]+)"[^}]*"shop_id"/,
      ];
      
      for (const pattern of sellerPatterns) {
        const match = pattern.exec(html);
        if (match && match[1] && match[1].length > 1) {
          console.log('Extracted Shopee seller:', match[1]);
          return match[1];
        }
      }
    }

    // ============ TOKOPEDIA ============
    if (url.includes('tokopedia')) {
      const sellerPatterns = [
        /"shopName"\s*:\s*"([^"]+)"/,
        /"shop"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/,
      ];
      
      for (const pattern of sellerPatterns) {
        const match = pattern.exec(html);
        if (match && match[1] && match[1].length > 1) {
          console.log('Extracted Tokopedia seller:', match[1]);
          return match[1];
        }
      }
    }

    // ============ LAZADA ============
    if (url.includes('lazada')) {
      const sellerPatterns = [
        /"sellerName"\s*:\s*"([^"]+)"/,
        /"seller"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/,
        /"shopName"\s*:\s*"([^"]+)"/,
      ];
      
      for (const pattern of sellerPatterns) {
        const match = pattern.exec(html);
        if (match && match[1] && match[1].length > 1) {
          console.log('Extracted Lazada seller:', match[1]);
          return match[1];
        }
      }
    }

    // ============ BUKALAPAK ============
    if (url.includes('bukalapak')) {
      const sellerPatterns = [
        /"store"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/,
        /"seller_name"\s*:\s*"([^"]+)"/,
        /"store_name"\s*:\s*"([^"]+)"/,
      ];
      
      for (const pattern of sellerPatterns) {
        const match = pattern.exec(html);
        if (match && match[1] && match[1].length > 1) {
          console.log('Extracted Bukalapak seller:', match[1]);
          return match[1];
        }
      }
    }

    // ============ BLIBLI ============
    if (url.includes('blibli')) {
      const sellerPatterns = [
        /"merchantName"\s*:\s*"([^"]+)"/,
        /"storeName"\s*:\s*"([^"]+)"/,
      ];
      
      for (const pattern of sellerPatterns) {
        const match = pattern.exec(html);
        if (match && match[1] && match[1].length > 1) {
          console.log('Extracted Blibli seller:', match[1]);
          return match[1];
        }
      }
    }

  } catch (error) {
    console.error('Error extracting seller:', error);
  }
  
  return null;
}

// Extract real reviews from HTML
interface ScrapedReview {
  userName: string;
  rating: number;
  date: string;
  content: string;
  images?: string[];
}

function extractReviews(html: string, url: string): ScrapedReview[] {
  const reviews: ScrapedReview[] = [];
  
  try {
    // ============ SHOPEE ============
    if (url.includes('shopee')) {
      // Look for ratings array in JSON data
      const ratingsMatch = html.match(/"ratings"\s*:\s*(\[[\s\S]*?\])(?=\s*[,}])/);
      if (ratingsMatch) {
        try {
          // Extract individual reviews
          const reviewBlocks = ratingsMatch[1].match(/\{[^{}]*"comment"[^{}]*\}/g) || [];
          
          for (const block of reviewBlocks.slice(0, 10)) {
            const userMatch = block.match(/"author_username"\s*:\s*"([^"]+)"/) ||
                              block.match(/"username"\s*:\s*"([^"]+)"/);
            const ratingMatch = block.match(/"rating_star"\s*:\s*(\d+)/);
            const contentMatch = block.match(/"comment"\s*:\s*"([^"]+)"/);
            const timeMatch = block.match(/"ctime"\s*:\s*(\d+)/);
            
            if (userMatch && contentMatch && contentMatch[1].length > 5) {
              reviews.push({
                userName: userMatch[1] || 'Pembeli Shopee',
                rating: ratingMatch ? parseInt(ratingMatch[1]) : 5,
                date: timeMatch ? new Date(parseInt(timeMatch[1]) * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                content: contentMatch[1],
              });
            }
          }
        } catch (e) {
          console.error('Error parsing Shopee reviews:', e);
        }
      }
    }

    // ============ TOKOPEDIA ============
    if (url.includes('tokopedia')) {
      const reviewsMatch = html.match(/"productReviews"\s*:\s*(\[[\s\S]*?\])(?=\s*[,}])/);
      if (reviewsMatch) {
        try {
          const reviewBlocks = reviewsMatch[1].match(/\{[^{}]*"message"[^{}]*\}/g) || [];
          
          for (const block of reviewBlocks.slice(0, 10)) {
            const userMatch = block.match(/"reviewerName"\s*:\s*"([^"]+)"/) ||
                              block.match(/"name"\s*:\s*"([^"]+)"/);
            const ratingMatch = block.match(/"rating"\s*:\s*(\d+)/);
            const contentMatch = block.match(/"message"\s*:\s*"([^"]+)"/);
            
            if (userMatch && contentMatch && contentMatch[1].length > 5) {
              reviews.push({
                userName: userMatch[1] || 'Pembeli Tokopedia',
                rating: ratingMatch ? parseInt(ratingMatch[1]) : 5,
                date: new Date().toISOString().split('T')[0],
                content: contentMatch[1],
              });
            }
          }
        } catch (e) {
          console.error('Error parsing Tokopedia reviews:', e);
        }
      }
    }

    // ============ LAZADA ============
    if (url.includes('lazada')) {
      const reviewsMatch = html.match(/"reviews"\s*:\s*(\[[\s\S]*?\])(?=\s*[,}])/);
      if (reviewsMatch) {
        try {
          const reviewBlocks = reviewsMatch[1].match(/\{[^{}]*"reviewContent"[^{}]*\}/g) || [];
          
          for (const block of reviewBlocks.slice(0, 10)) {
            const userMatch = block.match(/"buyerName"\s*:\s*"([^"]+)"/) ||
                              block.match(/"reviewer"\s*:\s*"([^"]+)"/);
            const ratingMatch = block.match(/"rating"\s*:\s*(\d+)/);
            const contentMatch = block.match(/"reviewContent"\s*:\s*"([^"]+)"/);
            
            if (contentMatch && contentMatch[1].length > 5) {
              reviews.push({
                userName: userMatch ? userMatch[1] : 'Pembeli Lazada',
                rating: ratingMatch ? parseInt(ratingMatch[1]) : 5,
                date: new Date().toISOString().split('T')[0],
                content: contentMatch[1],
              });
            }
          }
        } catch (e) {
          console.error('Error parsing Lazada reviews:', e);
        }
      }
    }

    // ============ BUKALAPAK ============
    if (url.includes('bukalapak')) {
      const reviewsMatch = html.match(/"reviews"\s*:\s*(\[[\s\S]*?\])(?=\s*[,}])/);
      if (reviewsMatch) {
        try {
          const reviewBlocks = reviewsMatch[1].match(/\{[^{}]*"content"[^{}]*\}/g) || [];
          
          for (const block of reviewBlocks.slice(0, 10)) {
            const userMatch = block.match(/"sender_name"\s*:\s*"([^"]+)"/) ||
                              block.match(/"reviewer"\s*:\s*"([^"]+)"/);
            const ratingMatch = block.match(/"rate"\s*:\s*(\d+)/) ||
                                block.match(/"rating"\s*:\s*(\d+)/);
            const contentMatch = block.match(/"content"\s*:\s*"([^"]+)"/);
            
            if (contentMatch && contentMatch[1].length > 5) {
              reviews.push({
                userName: userMatch ? userMatch[1] : 'Pembeli Bukalapak',
                rating: ratingMatch ? parseInt(ratingMatch[1]) : 5,
                date: new Date().toISOString().split('T')[0],
                content: contentMatch[1],
              });
            }
          }
        } catch (e) {
          console.error('Error parsing Bukalapak reviews:', e);
        }
      }
    }

    // ============ BLIBLI ============
    if (url.includes('blibli')) {
      const reviewsMatch = html.match(/"reviews"\s*:\s*(\[[\s\S]*?\])(?=\s*[,}])/);
      if (reviewsMatch) {
        try {
          const reviewBlocks = reviewsMatch[1].match(/\{[^{}]*"content"[^{}]*\}/g) || [];
          
          for (const block of reviewBlocks.slice(0, 10)) {
            const userMatch = block.match(/"reviewerName"\s*:\s*"([^"]+)"/);
            const ratingMatch = block.match(/"rating"\s*:\s*(\d+)/);
            const contentMatch = block.match(/"content"\s*:\s*"([^"]+)"/);
            
            if (contentMatch && contentMatch[1].length > 5) {
              reviews.push({
                userName: userMatch ? userMatch[1] : 'Pembeli Blibli',
                rating: ratingMatch ? parseInt(ratingMatch[1]) : 5,
                date: new Date().toISOString().split('T')[0],
                content: contentMatch[1],
              });
            }
          }
        } catch (e) {
          console.error('Error parsing Blibli reviews:', e);
        }
      }
    }

    console.log('Extracted', reviews.length, 'reviews from HTML');
    
  } catch (error) {
    console.error('Error extracting reviews:', error);
  }
  
  return reviews;
}

// Patterns that indicate we got a blocked/login/error page instead of product page
const BLOCKED_PAGE_PATTERNS = [
  /^login/i,
  /masuk.*akun/i,
  /^recaptcha$/i,
  /^captcha$/i,
  /^verify/i,
  /^verifikasi/i,
  /^www\./i,
  /^https?:\/\//i,
  /\.com$/i,
  /\.co\.id$/i,
  /not found/i,
  /404/i,
  /error/i,
  /access denied/i,
  /forbidden/i,
  /silakan login/i,
  /please login/i,
  /sign in/i,
  /daftar sekarang/i,
  /berbelanja/i,
  /mulai belanja/i,
];

function isValidProductName(name: string): boolean {
  if (!name || name.length < 3) return false;
  if (name.length > 300) return false;
  
  // Check against blocked patterns
  for (const pattern of BLOCKED_PAGE_PATTERNS) {
    if (pattern.test(name.trim())) {
      console.log('Product name matches blocked pattern:', pattern.toString(), name);
      return false;
    }
  }
  
  // Name should have at least some meaningful content (not just special chars)
  const alphanumCount = (name.match(/[a-zA-Z0-9]/g) || []).length;
  if (alphanumCount < 3) return false;
  
  return true;
}

// Detect if we got a blocked page (login, captcha, error)
function isBlockedPage(html: string): { blocked: boolean; reason: string } {
  // Check for login page indicators
  const loginIndicators = [
    /login.*form|form.*login/i,
    /input.*password|password.*input/i,
    /masuk.*akun|akun.*masuk/i,
    /silakan.*login|login.*silakan/i,
    /Login sekarang untuk mulai berbelanja/i,
    /Daftar dan login untuk berbelanja/i,
  ];
  
  for (const pattern of loginIndicators) {
    if (pattern.test(html)) {
      return { blocked: true, reason: 'login_page' };
    }
  }
  
  // Check for captcha
  const captchaIndicators = [
    /<title[^>]*>reCAPTCHA<\/title>/i,
    /class="g-recaptcha"/i,
    /captcha-container/i,
    /verify.*human/i,
    /bukan robot/i,
  ];
  
  for (const pattern of captchaIndicators) {
    if (pattern.test(html)) {
      return { blocked: true, reason: 'captcha' };
    }
  }
  
  // Check for error pages
  const errorIndicators = [
    /<title[^>]*>404/i,
    /<title[^>]*>Error/i,
    /page not found/i,
    /halaman tidak ditemukan/i,
    /access denied/i,
    /forbidden/i,
  ];
  
  for (const pattern of errorIndicators) {
    if (pattern.test(html)) {
      return { blocked: true, reason: 'error_page' };
    }
  }
  
  return { blocked: false, reason: '' };
}

// Extract product name from URL as fallback
function extractProductNameFromUrl(url: string): string | null {
  try {
    // Extract the product slug from URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);
    
    // Find the product slug (usually the longest meaningful part)
    let productSlug = '';
    
    for (const part of pathParts.reverse()) {
      // Skip common non-product parts
      if (/^(p|products?|item|i|detail|\d+)$/i.test(part)) continue;
      if (/^i\.\d+\.\d+$/.test(part)) continue; // Shopee item ID pattern
      
      // Clean up the slug
      let cleaned = part
        .split(/[-_.]/)
        // Filter out: pure numbers, product IDs (alphanumeric codes), common stop words
        .filter(s => {
          if (s.length === 0) return false;
          if (/^\d+$/.test(s)) return false; // Pure numbers
          if (/^[a-z0-9]{5,10}$/i.test(s) && /\d/.test(s) && /[a-z]/i.test(s)) return false; // Alphanumeric IDs like "34xw3e4"
          if (/^i\d+$/.test(s)) return false; // Lazada ID pattern like "i2959626489"
          if (/^html?$/.test(s)) return false; // File extensions
          return true;
        })
        .join(' ');
        
      if (cleaned.length > 10) {
        productSlug = cleaned;
        break;
      }
    }
    
    // Additional cleanup: remove "jual" prefix if it starts with it
    let cleanedSlug = productSlug.trim();
    cleanedSlug = cleanedSlug.replace(/^jual\s+/i, '');
    
    if (cleanedSlug && cleanedSlug.length > 5) {
      // Capitalize first letter of each word
      const formatted = cleanedSlug.replace(/\b\w/g, c => c.toUpperCase());
      console.log('Extracted product name from URL:', formatted);
      return formatted;
    }
  } catch (e) {
    console.error('Error extracting name from URL:', e);
  }
  return null;
}

// Extract product name from HTML
function extractProductName(html: string, url: string): string | null {
  try {
    // First check if this is a blocked page
    const blockCheck = isBlockedPage(html);
    if (blockCheck.blocked) {
      console.log('Blocked page detected:', blockCheck.reason);
      // Fall back to URL extraction
      return extractProductNameFromUrl(url);
    }
    
    let extractedName: string | null = null;
    
    // Platform-specific extraction for more accurate names
    if (url.includes('shopee')) {
      // Shopee: Try JSON data first (most accurate)
      const namePatterns = [
        /"name"\s*:\s*"([^"]{10,200})"/,
        /"item_basic"[^}]*"name"\s*:\s*"([^"]+)"/,
        /"product_name"\s*:\s*"([^"]+)"/,
      ];
      for (const pattern of namePatterns) {
        const match = pattern.exec(html);
        if (match && match[1] && isValidProductName(match[1])) {
          extractedName = match[1];
          console.log('Extracted Shopee product name from JSON:', extractedName);
          break;
        }
      }
    }
    
    if (url.includes('lazada')) {
      // Lazada: Try JSON data
      const namePatterns = [
        /"name"\s*:\s*"([^"]{10,200})"/,
        /"title"\s*:\s*"([^"]{10,200})"/,
        /"productTitle"\s*:\s*"([^"]+)"/,
      ];
      for (const pattern of namePatterns) {
        const match = pattern.exec(html);
        if (match && match[1] && isValidProductName(match[1])) {
          extractedName = match[1];
          console.log('Extracted Lazada product name from JSON:', extractedName);
          break;
        }
      }
    }
    
    if (url.includes('bukalapak')) {
      // Bukalapak: Try JSON data
      const namePatterns = [
        /"name"\s*:\s*"([^"]{10,200})"/,
        /"product_name"\s*:\s*"([^"]+)"/,
        /"title"\s*:\s*"([^"]{10,200})"/,
      ];
      for (const pattern of namePatterns) {
        const match = pattern.exec(html);
        if (match && match[1] && isValidProductName(match[1])) {
          extractedName = match[1];
          console.log('Extracted Bukalapak product name from JSON:', extractedName);
          break;
        }
      }
    }
    
    // If platform-specific extraction didn't work, try generic methods
    if (!extractedName) {
      // Try og:title first
      const ogTitleMatch = html.match(/property="og:title"[^>]*content="([^"]+)"/i) ||
                           html.match(/content="([^"]+)"[^>]*property="og:title"/i);
      if (ogTitleMatch && ogTitleMatch[1]) {
        let title = ogTitleMatch[1];
        // Clean up common suffixes for all platforms
        title = title.replace(/\s*[-|]\s*(Shopee|Tokopedia|Lazada|Bukalapak|Blibli|Indonesia).*$/i, '');
        title = title.replace(/\s*\|\s*$/i, '');
        if (isValidProductName(title)) {
          extractedName = title;
          console.log('Extracted product name from og:title:', extractedName);
        }
      }
    }
    
    if (!extractedName) {
      // Try meta title
      const titleMatch = html.match(/<title[^>]*>([^<]+)</i);
      if (titleMatch && titleMatch[1]) {
        let title = titleMatch[1];
        title = title.replace(/\s*[-|]\s*(Shopee|Tokopedia|Lazada|Bukalapak|Blibli|Indonesia).*$/i, '');
        title = title.replace(/\s*\|\s*$/i, '');
        if (isValidProductName(title)) {
          extractedName = title;
          console.log('Extracted product name from title:', extractedName);
        }
      }
    }
    
    if (!extractedName) {
      // Try JSON-LD with validation
      const jsonLdMatch = html.match(/"name"\s*:\s*"([^"]+)"/);
      if (jsonLdMatch && jsonLdMatch[1] && isValidProductName(jsonLdMatch[1])) {
        extractedName = jsonLdMatch[1];
        console.log('Extracted product name from JSON-LD:', extractedName);
      }
    }
    
    // Final validation
    if (extractedName && isValidProductName(extractedName)) {
      return extractedName;
    }
    
    // Fall back to URL extraction if all else fails
    console.log('No valid product name found in HTML, falling back to URL');
    return extractProductNameFromUrl(url);
    
  } catch (error) {
    console.error('Error extracting product name:', error);
  }

  return extractProductNameFromUrl(url);
}

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function getRateLimitKey(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetIn: RATE_WINDOW };
  }
  
  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetIn: record.resetAt - now };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count, resetIn: record.resetAt - now };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Apply rate limiting
  const rateLimitKey = getRateLimitKey(req);
  const rateLimit = checkRateLimit(rateLimitKey);
  
  if (!rateLimit.allowed) {
    console.log('Rate limit exceeded for:', rateLimitKey);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Terlalu banyak permintaan. Coba lagi dalam ' + Math.ceil(rateLimit.resetIn / 1000) + ' detik.' 
      }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(rateLimit.resetIn / 1000).toString(),
        } 
      }
    );
  }

  try {
    const { url } = await req.json();
    console.log('Analyzing product URL:', url);

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL produk diperlukan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!PERPLEXITY_API_KEY) {
      console.error('PERPLEXITY_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Perplexity API tidak dikonfigurasi' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Detect platform from URL - support all major Indonesian marketplaces
    let platform: string = 'unknown';
    if (url.includes('tokopedia.com')) platform = 'tokopedia';
    else if (url.includes('shopee.co.id') || url.includes('shopee.com') || url.includes('shopee.sg')) platform = 'shopee';
    else if (url.includes('bukalapak.com')) platform = 'bukalapak';
    else if (url.includes('lazada.co.id') || url.includes('lazada.com') || url.includes('lazada.sg')) platform = 'lazada';
    else if (url.includes('blibli.com')) platform = 'blibli';

    console.log('Detected platform:', platform);

    // Step 1: Use Firecrawl to scrape the actual product page for accurate data
    let scrapedImage: string | null = null;
    let scrapedPrice: { price: number; originalPrice: number | null; priceRange?: { min: number; max: number } } | null = null;
    let scrapedRating: RatingInfo | null = null;
    let scrapedName: string | null = null;
    let scrapedCategory: string | null = null;
    let scrapedSeller: string | null = null;
    let scrapedReviews: ScrapedReview[] = [];
    let variantInfo: VariantInfo | null = null;
    
    if (FIRECRAWL_API_KEY) {
      console.log('Scraping product page with Firecrawl...');
      
      // Platform-specific settings
      const platformSettings: Record<string, { waitFor: number; useMobile?: boolean }> = {
        shopee: { waitFor: 8000, useMobile: true }, // Shopee needs longer wait and mobile UA works better
        lazada: { waitFor: 8000 },
        bukalapak: { waitFor: 6000 },
        tokopedia: { waitFor: 5000 },
        blibli: { waitFor: 5000 },
        unknown: { waitFor: 5000 },
      };
      
      const settings = platformSettings[platform] || platformSettings.unknown;
      
      try {
        // First try to get HTML for data extraction
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: url,
            formats: ['rawHtml'],
            onlyMainContent: false,
            waitFor: settings.waitFor,
            // Use mobile view for Shopee as it sometimes bypasses restrictions
            ...(settings.useMobile ? { mobile: true } : {}),
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          const html = scrapeData.data?.rawHtml || scrapeData.rawHtml || '';
          
          console.log('Firecrawl scrape successful for', platform);
          console.log('HTML length:', html.length);
          
          // Check if we got blocked (login page, captcha, etc.)
          const isBlocked = html.includes('login') && html.includes('password') && html.length < 50000;
          const isCaptcha = html.includes('captcha') || html.includes('verify');
          
          if (isBlocked || isCaptcha) {
            console.log('Detected blocking mechanism:', isBlocked ? 'login page' : 'captcha');
          }
          
          // Extract ALL product data from HTML for accuracy
          if (html && html.length > 1000) {
            scrapedImage = extractProductImage(html, url);
            
            // Extract variants FIRST to help with price extraction
            variantInfo = extractVariants(html, url);
            console.log('Variant info:', JSON.stringify(variantInfo));
            
            // Extract price with variant info for accurate pricing
            scrapedPrice = extractPrice(html, url, variantInfo);
            scrapedRating = extractRating(html, url);
            scrapedName = extractProductName(html, url);
            
            // Extract additional data: category, seller, reviews
            scrapedCategory = extractCategory(html, url);
            scrapedSeller = extractSeller(html, url);
            scrapedReviews = extractReviews(html, url);
            
            console.log('Scraped data summary:', {
              platform,
              hasPrice: !!scrapedPrice,
              price: scrapedPrice?.price,
              hasRating: !!scrapedRating,
              rating: scrapedRating?.rating,
              soldCount: scrapedRating?.soldCount,
              hasName: !!scrapedName,
              hasCategory: !!scrapedCategory,
              hasSeller: !!scrapedSeller,
              reviewCount: scrapedReviews.length,
              hasVariants: variantInfo?.hasVariants,
              hasImage: !!scrapedImage,
            });
          } else {
            console.log('HTML too short or empty, skipping extraction');
          }
          
          if (scrapedImage) {
            console.log('Successfully extracted product image from HTML');
          } else {
            // Try fallback method (API calls)
            console.log('No product image from HTML - trying API fallback...');
            scrapedImage = await fetchProductImageFallback(url, platform);
            
            if (scrapedImage) {
              console.log('Got product image from API fallback');
            } else {
              console.log('No product image found - will use styled placeholder');
            }
          }
        } else {
          const errorText = await scrapeResponse.text();
          console.error('Firecrawl scrape failed:', scrapeResponse.status, errorText);
          
          // Log specific error for debugging
          if (scrapeResponse.status === 403) {
            console.log('Platform may be blocking scraping requests');
          } else if (scrapeResponse.status === 429) {
            console.log('Rate limited by Firecrawl');
          }
          
          // Still try API fallback even if scraping failed
          console.log('Trying API fallback for image...');
          scrapedImage = await fetchProductImageFallback(url, platform);
          if (scrapedImage) {
            console.log('Got product image from API fallback despite scrape failure');
          }
        }
      } catch (scrapeError) {
        console.error('Firecrawl error:', scrapeError);
        
        // Still try API fallback
        console.log('Trying API fallback after Firecrawl error...');
        scrapedImage = await fetchProductImageFallback(url, platform);
        if (scrapedImage) {
          console.log('Got product image from API fallback after error');
        }
      }
    } else {
      console.log('FIRECRAWL_API_KEY not configured, trying direct API fallback');
      scrapedImage = await fetchProductImageFallback(url, platform);
      if (scrapedImage) {
        console.log('Got product image from direct API fallback');
      }
    }

    // Step 2: Use Perplexity for review analysis - also request image URL as fallback
    const prompt = `Analisis produk dari URL e-commerce Indonesia ini: ${url}

PENTING: SELALU berikan respons dalam format JSON VALID tanpa penjelasan tambahan.
Jika tidak bisa mengakses URL, tetap berikan estimasi berdasarkan informasi yang tersedia.

PENTING untuk gambar produk:
- Cari URL gambar produk asli dari CDN marketplace (images.tokopedia.net, susercontent.com, alicdn.com, bukalapak.com, bmdstatic.com)
- URL gambar harus dari CDN resmi, bukan placeholder atau screenshot
- Jika tidak ditemukan, berikan null

Format JSON yang HARUS diikuti:
{
  "product": {
    "name": "nama produk (estimasi jika tidak tersedia)",
    "price": 100000,
    "originalPrice": null,
    "rating": 4.5,
    "totalReviews": 10,
    "category": "kategori produk",
    "seller": "nama toko",
    "imageUrl": "https://images.tokopedia.net/... atau null jika tidak tersedia"
  },
  "sentiment": {
    "positive": 70,
    "neutral": 20,
    "negative": 10
  },
  "summary": "Ringkasan singkat tentang produk dalam bahasa Indonesia.",
  "suspiciousPercentage": 5,
  "pros": ["kelebihan 1", "kelebihan 2"],
  "cons": ["kekurangan 1"],
  "reviews": [
    {
      "userName": "Pembeli",
      "rating": 5,
      "date": "2025-01-01",
      "content": "Review produk",
      "sentiment": "positive",
      "verified": true,
      "suspicious": false
    }
  ]
}

Jangan berikan teks apapun di luar JSON. Langsung mulai dengan { dan akhiri dengan }`;

    console.log('Sending request to Perplexity API...');

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { 
            role: 'system', 
            content: 'Kamu adalah API yang HANYA mengembalikan JSON valid. Tidak boleh ada teks penjelasan. Langsung output JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: `API Error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Perplexity response received');

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error('No content in response');
      return new Response(
        JSON.stringify({ success: false, error: 'Tidak ada respons dari sistem' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JSON from the response
    let analysisData;
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create default data from URL
        console.log('No JSON in response, creating fallback data');
        console.log('Raw content:', content.substring(0, 500));
        
        // Extract product name from URL
        const urlParts = url.split('/');
        const productSlug = urlParts[urlParts.length - 1]?.split('?')[0] || 'Produk';
        const productName = productSlug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        
        analysisData = {
          product: {
            name: productName,
            price: 0,
            originalPrice: null,
            rating: 0,
            totalReviews: 0,
            category: platform === 'tokopedia' ? 'Produk Tokopedia' : 
                      platform === 'shopee' ? 'Produk Shopee' : 'Produk',
            seller: 'Penjual'
          },
          sentiment: { positive: 0, neutral: 0, negative: 0 },
          summary: 'Data produk tidak dapat diambil secara otomatis. Silakan cek langsung di marketplace.',
          suspiciousPercentage: 0,
          pros: [],
          cons: [],
          reviews: []
        };
      }
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      console.log('Raw content:', content.substring(0, 500));
      
      // Create fallback data
      const urlParts = url.split('/');
      const productSlug = urlParts[urlParts.length - 1]?.split('?')[0] || 'Produk';
      const productName = productSlug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      
      analysisData = {
        product: {
          name: productName,
          price: 0,
          originalPrice: null,
          rating: 0,
          totalReviews: 0,
          category: 'Produk',
          seller: 'Penjual'
        },
        sentiment: { positive: 0, neutral: 0, negative: 0 },
        summary: 'Gagal menganalisis produk. Data mungkin tidak tersedia.',
        suspiciousPercentage: 0,
        pros: [],
        cons: [],
        reviews: []
      };
    }

    // Determine the final image URL - NEVER use screenshot as product image
    let finalImage = scrapedImage;
    
    // Fallback 1: Try to use Perplexity's imageUrl if scraping failed
    if (!finalImage && analysisData.product?.imageUrl) {
      const perplexityImage = analysisData.product.imageUrl;
      // Validate it's from a valid CDN
      if (perplexityImage && 
          (perplexityImage.includes('tokopedia.net') || 
           perplexityImage.includes('susercontent.com') ||
           perplexityImage.includes('alicdn.com') ||
           perplexityImage.includes('bukalapak.com') ||
           perplexityImage.includes('bmdstatic.com') ||
           perplexityImage.includes('shopee'))) {
        finalImage = perplexityImage;
        console.log('Using Perplexity image URL:', finalImage);
      }
    }
    
    // Fallback 2: If still no image, use a styled placeholder based on platform
    if (!finalImage) {
      const productName = scrapedName || analysisData.product?.name || 'Product';
      // Create a clean, styled placeholder that looks intentional
      const platformColors: Record<string, string> = {
        tokopedia: '00AA5B',
        shopee: 'EE4D2D', 
        lazada: '0F1689',
        bukalapak: 'E31E52',
        blibli: '0095DA',
        unknown: '6B7280'
      };
      const bgColor = platformColors[platform] || platformColors.unknown;
      // Use first 15 chars of product name to keep it readable
      const shortName = productName.substring(0, 15).replace(/[^a-zA-Z0-9\s]/g, '');
      finalImage = `https://placehold.co/400x400/${bgColor}/ffffff?text=${encodeURIComponent(shortName || platform)}`;
      console.log('Using styled placeholder image:', finalImage);
    }

    // PRIORITIZE scraped data over Perplexity data for accuracy
    // Scraped data comes directly from the marketplace, so it's more accurate
    
    // Determine final product name with validation
    let finalProductName: string;
    
    // Priority 1: Scraped name (if valid)
    if (scrapedName && isValidProductName(scrapedName)) {
      finalProductName = scrapedName;
      console.log('Using scraped product name:', finalProductName);
    }
    // Priority 2: Perplexity name (if valid)
    else if (analysisData.product?.name && isValidProductName(analysisData.product.name)) {
      finalProductName = analysisData.product.name;
      console.log('Using Perplexity product name:', finalProductName);
    }
    // Priority 3: Extract from URL
    else {
      finalProductName = extractProductNameFromUrl(url) || 'Produk';
      console.log('Using URL-extracted product name:', finalProductName);
    }
    
    const finalProduct = {
      ...analysisData.product,
      id: crypto.randomUUID(),
      platform,
      url,
      image: finalImage,
      // Use validated product name
      name: finalProductName,
      // Use scraped price if available (more accurate than Perplexity)
      price: scrapedPrice?.price || analysisData.product.price || 0,
      originalPrice: scrapedPrice?.originalPrice || analysisData.product.originalPrice || null,
      // Include price range for products with variants
      priceRange: scrapedPrice?.priceRange || null,
      // Use scraped rating if available
      rating: scrapedRating?.rating || analysisData.product.rating || 0,
      totalReviews: scrapedRating?.totalReviews || analysisData.product.totalReviews || 0,
      // Use scraped sold count if available
      soldCount: scrapedRating?.soldCount || 0,
      // Use scraped category if available
      category: scrapedCategory || analysisData.product.category || 'Produk',
      // Use scraped seller if available
      seller: scrapedSeller || analysisData.product.seller || 'Penjual',
      // Include variant information
      hasVariants: variantInfo?.hasVariants || false,
      variants: variantInfo?.variants || [],
    };

    console.log('Final product data:', {
      name: finalProduct.name,
      price: finalProduct.price,
      originalPrice: finalProduct.originalPrice,
      priceRange: finalProduct.priceRange,
      rating: finalProduct.rating,
      totalReviews: finalProduct.totalReviews,
      soldCount: finalProduct.soldCount,
      category: finalProduct.category,
      seller: finalProduct.seller,
      hasVariants: finalProduct.hasVariants,
      variants: finalProduct.variants,
      source: scrapedPrice ? 'scraped' : 'perplexity'
    });

    analysisData.product = finalProduct;

    // Use scraped reviews if available, otherwise use Perplexity reviews
    if (scrapedReviews.length > 0) {
      console.log('Using', scrapedReviews.length, 'scraped reviews');
      analysisData.reviews = scrapedReviews.map((review, index) => ({
        id: `review-${index}`,
        userName: review.userName,
        rating: review.rating,
        date: review.date,
        content: review.content,
        sentiment: review.rating >= 4 ? 'positive' : review.rating >= 3 ? 'neutral' : 'negative',
        platform,
        verified: true,
        suspicious: false,
        images: review.images || [],
      }));
    } else if (analysisData.reviews) {
      // Add IDs to Perplexity reviews
      analysisData.reviews = analysisData.reviews.map((review: any, index: number) => ({
        ...review,
        id: `review-${index}`,
        platform,
      }));
    }

    // Generate price history based on ACTUAL current price (last 30 days)
    const currentPrice = analysisData.product.price || 1000000;
    const priceHistory = [];
    for (let i = 30; i >= 0; i -= 5) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const variation = Math.random() * 0.15 - 0.05; // -5% to +10%
      const price = Math.round(currentPrice * (1 + variation));
      priceHistory.push({
        date: date.toISOString().split('T')[0],
        price,
      });
    }
    // Make sure the last entry (today) has the exact current price
    if (priceHistory.length > 0) {
      priceHistory[priceHistory.length - 1].price = currentPrice;
    }
    analysisData.priceHistory = priceHistory;

    console.log('Analysis complete, image type:', finalImage?.startsWith('data:') ? 'screenshot' : 'url');

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: analysisData,
        citations: data.citations || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing product:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
