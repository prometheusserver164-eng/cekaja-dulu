/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Extract product image from scraped HTML
function extractProductImage(html: string, url: string): string | null {
  try {
    // ============ SHOPEE ============
    if (url.includes('shopee')) {
      // Try og:image first - but only if it's from product CDN (susercontent)
      const ogMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/i) ||
                      html.match(/content="([^"]+)"[^>]*property="og:image"/i);
      if (ogMatch && ogMatch[1]) {
        const imageUrl = ogMatch[1];
        if (imageUrl.includes('susercontent.com') && 
            !imageUrl.includes('shopee-xtra') && 
            !imageUrl.includes('banner') &&
            !imageUrl.includes('logo')) {
          console.log('Found Shopee og:image from CDN:', imageUrl);
          return imageUrl;
        }
      }

      // Try to find product images in JSON data
      const jsonImagePattern = /"image"\s*:\s*"(https?:\/\/[^"]+susercontent\.com\/file\/[^"]+)"/g;
      let match;
      while ((match = jsonImagePattern.exec(html)) !== null) {
        const imageUrl = match[1];
        if (imageUrl && 
            !imageUrl.includes('shopee-xtra') && 
            !imageUrl.includes('banner') && 
            !imageUrl.includes('wallet') &&
            !imageUrl.includes('promo') &&
            !imageUrl.includes('voucher') &&
            !imageUrl.includes('icon')) {
          console.log('Found Shopee JSON product image:', imageUrl);
          return imageUrl;
        }
      }
      
      console.log('Shopee: Could not find product image in HTML, will use screenshot');
      return null;
    }

    // ============ TOKOPEDIA ============
    if (url.includes('tokopedia')) {
      const ogMatch = html.match(/property="og:image"[^>]*content="([^"]+tokopedia\.net[^"]+)"/i) ||
                      html.match(/content="([^"]+tokopedia\.net[^"]+)"[^>]*property="og:image"/i);
      if (ogMatch && ogMatch[1]) {
        console.log('Found Tokopedia og:image:', ogMatch[1]);
        return ogMatch[1];
      }

      const jsonImagePattern = /"image"\s*:\s*"(https?:\/\/images\.tokopedia\.net[^"]+)"/g;
      let match;
      while ((match = jsonImagePattern.exec(html)) !== null) {
        console.log('Found Tokopedia JSON image:', match[1]);
        return match[1];
      }
    }

    // ============ LAZADA ============
    if (url.includes('lazada')) {
      const ogMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/i) ||
                      html.match(/content="([^"]+)"[^>]*property="og:image"/i);
      if (ogMatch && ogMatch[1]) {
        const imageUrl = ogMatch[1];
        if (!imageUrl.includes('logo') && !imageUrl.includes('banner')) {
          console.log('Found Lazada og:image:', imageUrl);
          return imageUrl;
        }
      }
      
      // Lazada images in JSON
      const jsonImagePattern = /"image"\s*:\s*"(https?:\/\/[^"]+lazada[^"]+\/images\/[^"]+)"/g;
      let match;
      while ((match = jsonImagePattern.exec(html)) !== null) {
        console.log('Found Lazada JSON image:', match[1]);
        return match[1];
      }
    }

    // ============ BUKALAPAK ============
    if (url.includes('bukalapak')) {
      const ogMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/i) ||
                      html.match(/content="([^"]+)"[^>]*property="og:image"/i);
      if (ogMatch && ogMatch[1]) {
        const imageUrl = ogMatch[1];
        if (!imageUrl.includes('logo') && !imageUrl.includes('banner')) {
          console.log('Found Bukalapak og:image:', imageUrl);
          return imageUrl;
        }
      }
      
      // Bukalapak images often in s3/bukalapak-prd-*
      const jsonImagePattern = /"(?:small_url|large_url|medium_url)"\s*:\s*"(https?:\/\/[^"]+bukalapak[^"]+)"/g;
      let match;
      while ((match = jsonImagePattern.exec(html)) !== null) {
        console.log('Found Bukalapak JSON image:', match[1]);
        return match[1];
      }
    }

    // ============ BLIBLI ============
    if (url.includes('blibli')) {
      const ogMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/i) ||
                      html.match(/content="([^"]+)"[^>]*property="og:image"/i);
      if (ogMatch && ogMatch[1]) {
        const imageUrl = ogMatch[1];
        if (!imageUrl.includes('logo') && !imageUrl.includes('banner')) {
          console.log('Found Blibli og:image:', imageUrl);
          return imageUrl;
        }
      }
      
      // Blibli CDN images
      const jsonImagePattern = /"(?:images?|imageUrl)"\s*:\s*"(https?:\/\/[^"]+blibli[^"]+)"/g;
      let match;
      while ((match = jsonImagePattern.exec(html)) !== null) {
        if (!match[1].includes('logo') && !match[1].includes('banner')) {
          console.log('Found Blibli JSON image:', match[1]);
          return match[1];
        }
      }
    }

    // ============ GENERIC FALLBACK ============
    const ogImageMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/i) ||
                         html.match(/content="([^"]+)"[^>]*property="og:image"/i);
    if (ogImageMatch && ogImageMatch[1]) {
      const imageUrl = ogImageMatch[1];
      if (!imageUrl.includes('logo') && 
          !imageUrl.includes('banner') &&
          !imageUrl.includes('shopeemobile.com') &&
          !imageUrl.includes('deo.')) {
        console.log('Found generic og:image:', imageUrl);
        return imageUrl;
      }
    }
  } catch (error) {
    console.error('Error extracting product image:', error);
  }

  console.log('Could not find product image in HTML');
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
        // Look for price in JSON data - try multiple patterns
        const pricePatterns = [
          /"price"\s*:\s*(\d+)/,
          /"final_price"\s*:\s*(\d+)/,
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
      }
      
      // Look for original/before discount price
      const origMatch = /"price_before_discount"\s*:\s*(\d+)/.exec(html);
      if (origMatch && origMatch[1]) {
        let parsed = parseInt(origMatch[1]);
        if (parsed > 100000000) {
          parsed = Math.round(parsed / 100000);
        }
        if (parsed > (price || 0)) {
          originalPrice = parsed;
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
        const pricePatterns = [
          /"price"\s*:\s*"?(\d+(?:\.\d+)?)"?/,
          /"salePrice"\s*:\s*"?(\d+(?:\.\d+)?)"?/,
          /"specialPrice"\s*:\s*"?(\d+(?:\.\d+)?)"?/,
        ];
        
        for (const pattern of pricePatterns) {
          const match = pattern.exec(html);
          if (match && match[1]) {
            const parsed = Math.round(parseFloat(match[1]));
            if (parsed > 1000 && parsed < 100000000) {
              price = parsed;
              break;
            }
          }
        }
      }
      
      // Original price
      const origMatch = /"originalPrice"\s*:\s*"?(\d+(?:\.\d+)?)"?/.exec(html);
      if (origMatch && origMatch[1]) {
        const parsed = Math.round(parseFloat(origMatch[1]));
        if (parsed > (price || 0)) {
          originalPrice = parsed;
        }
      }
    }

    // ============ BUKALAPAK ============
    if (url.includes('bukalapak')) {
      if (priceRange) {
        price = priceRange.min;
      } else {
        const pricePatterns = [
          /"price"\s*:\s*(\d+)/,
          /"discounted_price"\s*:\s*(\d+)/,
          /"min_price"\s*:\s*(\d+)/,
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
      const origMatch = /"original_price"\s*:\s*(\d+)/.exec(html) ||
                        /"normal_price"\s*:\s*(\d+)/.exec(html);
      if (origMatch && origMatch[1]) {
        const parsed = parseInt(origMatch[1]);
        if (parsed > (price || 0)) {
          originalPrice = parsed;
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

// Extract rating from HTML
function extractRating(html: string, url: string): { rating: number; totalReviews: number } | null {
  let rating: number | null = null;
  let totalReviews: number | null = null;

  try {
    // ============ SHOPEE ============
    if (url.includes('shopee')) {
      const ratingMatch = /"rating"\s*:\s*([\d.]+)/.exec(html);
      if (ratingMatch && ratingMatch[1]) {
        const parsed = parseFloat(ratingMatch[1]);
        if (parsed >= 0 && parsed <= 5) {
          rating = parsed;
        }
      }
      const reviewMatch = /"rating_count"\s*:\s*\[?(\d+)/.exec(html) ||
                          /"cmt_count"\s*:\s*(\d+)/.exec(html) ||
                          /"sold"\s*:\s*(\d+)/.exec(html);
      if (reviewMatch && reviewMatch[1]) {
        totalReviews = parseInt(reviewMatch[1]);
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
    }

    // ============ LAZADA ============
    if (url.includes('lazada')) {
      const ratingMatch = /"average"\s*:\s*([\d.]+)/.exec(html) ||
                          /"ratingScore"\s*:\s*([\d.]+)/.exec(html);
      if (ratingMatch && ratingMatch[1]) {
        const parsed = parseFloat(ratingMatch[1]);
        if (parsed >= 0 && parsed <= 5) {
          rating = parsed;
        }
      }
      const reviewMatch = /"ratingCount"\s*:\s*(\d+)/.exec(html) ||
                          /"reviewCount"\s*:\s*(\d+)/.exec(html);
      if (reviewMatch && reviewMatch[1]) {
        totalReviews = parseInt(reviewMatch[1]);
      }
    }

    // ============ BUKALAPAK ============
    if (url.includes('bukalapak')) {
      const ratingMatch = /"average_rate"\s*:\s*([\d.]+)/.exec(html) ||
                          /"rating"\s*:\s*([\d.]+)/.exec(html);
      if (ratingMatch && ratingMatch[1]) {
        const parsed = parseFloat(ratingMatch[1]);
        if (parsed >= 0 && parsed <= 5) {
          rating = parsed;
        }
      }
      const reviewMatch = /"review_count"\s*:\s*(\d+)/.exec(html) ||
                          /"reviews_count"\s*:\s*(\d+)/.exec(html);
      if (reviewMatch && reviewMatch[1]) {
        totalReviews = parseInt(reviewMatch[1]);
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
      console.log('Extracted rating from HTML:', rating, 'Reviews:', totalReviews);
      return { rating, totalReviews: totalReviews || 0 };
    }
  } catch (error) {
    console.error('Error extracting rating:', error);
  }
  
  return null;
}

// Extract product name from HTML
function extractProductName(html: string, url: string): string | null {
  try {
    // Try og:title first
    const ogTitleMatch = html.match(/property="og:title"[^>]*content="([^"]+)"/i) ||
                         html.match(/content="([^"]+)"[^>]*property="og:title"/i);
    if (ogTitleMatch && ogTitleMatch[1]) {
      let title = ogTitleMatch[1];
      // Clean up common suffixes for all platforms
      title = title.replace(/\s*[-|]\s*(Shopee|Tokopedia|Lazada|Bukalapak|Blibli|Indonesia).*$/i, '');
      title = title.replace(/\s*\|\s*$/i, ''); // Remove trailing pipe
      if (title.length > 5) {
        console.log('Extracted product name from og:title:', title);
        return title;
      }
    }

    // Try meta title
    const titleMatch = html.match(/<title[^>]*>([^<]+)</i);
    if (titleMatch && titleMatch[1]) {
      let title = titleMatch[1];
      title = title.replace(/\s*[-|]\s*(Shopee|Tokopedia|Lazada|Bukalapak|Blibli|Indonesia).*$/i, '');
      title = title.replace(/\s*\|\s*$/i, '');
      if (title.length > 5) {
        console.log('Extracted product name from title:', title);
        return title;
      }
    }
    
    // Try JSON-LD
    const jsonLdMatch = html.match(/"name"\s*:\s*"([^"]+)"/);
    if (jsonLdMatch && jsonLdMatch[1] && jsonLdMatch[1].length > 5) {
      console.log('Extracted product name from JSON-LD:', jsonLdMatch[1]);
      return jsonLdMatch[1];
    }
  } catch (error) {
    console.error('Error extracting product name:', error);
  }

  return null;
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
    let screenshotBase64: string | null = null;
    let scrapedPrice: { price: number; originalPrice: number | null; priceRange?: { min: number; max: number } } | null = null;
    let scrapedRating: { rating: number; totalReviews: number } | null = null;
    let scrapedName: string | null = null;
    let variantInfo: VariantInfo | null = null;
    
    if (FIRECRAWL_API_KEY) {
      console.log('Scraping product page with Firecrawl...');
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
            formats: ['rawHtml', 'screenshot'],
            onlyMainContent: false,
            waitFor: 5000, // Wait longer for JS to load product data
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          const html = scrapeData.data?.rawHtml || scrapeData.rawHtml || '';
          screenshotBase64 = scrapeData.data?.screenshot || scrapeData.screenshot || null;
          
          console.log('Firecrawl scrape successful');
          console.log('HTML length:', html.length);
          console.log('Screenshot available:', !!screenshotBase64);
          
          // Extract ALL product data from HTML for accuracy
          if (html) {
            scrapedImage = extractProductImage(html, url);
            
            // Extract variants FIRST to help with price extraction
            variantInfo = extractVariants(html, url);
            console.log('Variant info:', variantInfo);
            
            // Extract price with variant info for accurate pricing
            scrapedPrice = extractPrice(html, url, variantInfo);
            scrapedRating = extractRating(html, url);
            scrapedName = extractProductName(html, url);
            
            console.log('Scraped data - Price:', scrapedPrice, 'Rating:', scrapedRating, 'Name:', scrapedName, 'Variants:', variantInfo?.hasVariants);
          }
          
          if (scrapedImage) {
            console.log('Successfully extracted product image:', scrapedImage);
          } else if (screenshotBase64) {
            console.log('Using screenshot as fallback image');
            // Convert base64 to data URL
            scrapedImage = `data:image/png;base64,${screenshotBase64}`;
          }
        } else {
          const errorText = await scrapeResponse.text();
          console.error('Firecrawl scrape failed:', scrapeResponse.status, errorText);
        }
      } catch (scrapeError) {
        console.error('Firecrawl error:', scrapeError);
      }
    } else {
      console.log('FIRECRAWL_API_KEY not configured, skipping scrape');
    }

    // Step 2: Use Perplexity for review analysis
    const prompt = `Analisis produk dari URL e-commerce Indonesia ini: ${url}

PENTING: SELALU berikan respons dalam format JSON VALID tanpa penjelasan tambahan.
Jika tidak bisa mengakses URL, tetap berikan estimasi berdasarkan informasi yang tersedia.

Format JSON yang HARUS diikuti:
{
  "product": {
    "name": "nama produk (estimasi jika tidak tersedia)",
    "price": 100000,
    "originalPrice": null,
    "rating": 4.5,
    "totalReviews": 10,
    "category": "kategori produk",
    "seller": "nama toko"
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

    // Determine the final image URL
    let finalImage = scrapedImage;
    
    // If no image was scraped, use a placeholder with product name
    if (!finalImage) {
      const productName = analysisData.product?.name || platform;
      finalImage = `https://placehold.co/400x400/1a1a2e/ffffff?text=${encodeURIComponent(productName.substring(0, 20))}`;
    }

    // PRIORITIZE scraped data over Perplexity data for accuracy
    // Scraped data comes directly from the marketplace, so it's more accurate
    const finalProduct = {
      ...analysisData.product,
      id: crypto.randomUUID(),
      platform,
      url,
      image: finalImage,
      // Use scraped price if available (more accurate than Perplexity)
      price: scrapedPrice?.price || analysisData.product.price || 0,
      originalPrice: scrapedPrice?.originalPrice || analysisData.product.originalPrice || null,
      // Include price range for products with variants
      priceRange: scrapedPrice?.priceRange || null,
      // Use scraped rating if available
      rating: scrapedRating?.rating || analysisData.product.rating || 0,
      totalReviews: scrapedRating?.totalReviews || analysisData.product.totalReviews || 0,
      // Use scraped name if available
      name: scrapedName || analysisData.product.name,
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
      hasVariants: finalProduct.hasVariants,
      variants: finalProduct.variants,
      source: scrapedPrice ? 'scraped' : 'perplexity'
    });

    analysisData.product = finalProduct;

    // Add IDs to reviews
    if (analysisData.reviews) {
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
