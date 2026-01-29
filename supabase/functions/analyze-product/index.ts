/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Extract product image from scraped HTML
function extractProductImage(html: string, url: string): string | null {
  // For Shopee: Look for the main product image
  if (url.includes('shopee')) {
    // Try og:image first - but only if it's from product CDN (susercontent)
    const ogMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/i) ||
                    html.match(/content="([^"]+)"[^>]*property="og:image"/i);
    if (ogMatch && ogMatch[1]) {
      const imageUrl = ogMatch[1];
      // Only use if it's from susercontent CDN (actual product images)
      // Exclude deo.shopeemobile.com (those are Shopee UI assets, not product images)
      if (imageUrl.includes('susercontent.com') && 
          !imageUrl.includes('shopee-xtra') && 
          !imageUrl.includes('banner') &&
          !imageUrl.includes('logo')) {
        console.log('Found Shopee og:image from CDN:', imageUrl);
        return imageUrl;
      }
    }

    // Try to find product images in JSON data embedded in HTML
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
    
    // Shopee product images often not in HTML due to JS rendering - return null to use screenshot
    console.log('Shopee: Could not find product image in HTML, will use screenshot');
    return null;
  }

  // For Tokopedia: Look for product images
  if (url.includes('tokopedia')) {
    const ogMatch = html.match(/property="og:image"[^>]*content="([^"]+tokopedia\.net[^"]+)"/i) ||
                    html.match(/content="([^"]+tokopedia\.net[^"]+)"[^>]*property="og:image"/i);
    if (ogMatch && ogMatch[1]) {
      console.log('Found Tokopedia og:image:', ogMatch[1]);
      return ogMatch[1];
    }

    // Try JSON pattern
    const jsonImagePattern = /"image"\s*:\s*"(https?:\/\/images\.tokopedia\.net[^"]+)"/g;
    let match;
    while ((match = jsonImagePattern.exec(html)) !== null) {
      console.log('Found Tokopedia JSON image:', match[1]);
      return match[1];
    }
  }

  // Generic og:image fallback - but exclude Shopee UI assets
  const ogImageMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/i) ||
                       html.match(/content="([^"]+)"[^>]*property="og:image"/i);
  if (ogImageMatch && ogImageMatch[1]) {
    const imageUrl = ogImageMatch[1];
    // Skip Shopee mobile assets, logos, banners
    if (!imageUrl.includes('logo') && 
        !imageUrl.includes('banner') &&
        !imageUrl.includes('shopeemobile.com') &&
        !imageUrl.includes('deo.')) {
      console.log('Found generic og:image:', imageUrl);
      return imageUrl;
    }
  }

  console.log('Could not find product image in HTML');
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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

    // Detect platform from URL
    let platform = 'unknown';
    if (url.includes('tokopedia.com')) platform = 'tokopedia';
    else if (url.includes('shopee.co.id') || url.includes('shopee.com')) platform = 'shopee';
    else if (url.includes('bukalapak.com')) platform = 'bukalapak';
    else if (url.includes('lazada.co.id') || url.includes('lazada.com')) platform = 'lazada';

    console.log('Detected platform:', platform);

    // Step 1: Use Firecrawl to scrape the actual product page for images
    let scrapedImage: string | null = null;
    let screenshotBase64: string | null = null;
    
    if (FIRECRAWL_API_KEY) {
      console.log('Scraping product page with Firecrawl...');
      try {
        // First try to get HTML for image extraction
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
            waitFor: 5000, // Wait longer for JS to load product images
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          const html = scrapeData.data?.rawHtml || scrapeData.rawHtml || '';
          screenshotBase64 = scrapeData.data?.screenshot || scrapeData.screenshot || null;
          
          console.log('Firecrawl scrape successful');
          console.log('HTML length:', html.length);
          console.log('Screenshot available:', !!screenshotBase64);
          
          // Try to extract product image from HTML
          if (html) {
            scrapedImage = extractProductImage(html, url);
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
      console.log('FIRECRAWL_API_KEY not configured, skipping image scrape');
    }

    // Step 2: Use Perplexity for review analysis
    const prompt = `Analisis produk dari URL e-commerce Indonesia ini: ${url}

Cari data REAL dari URL tersebut dan berikan dalam format JSON:
{
  "product": {
    "name": "nama produk LENGKAP",
    "price": harga dalam rupiah (angka saja),
    "originalPrice": harga asli sebelum diskon (angka atau null),
    "rating": rating 1-5 (desimal),
    "totalReviews": jumlah review (angka),
    "category": "kategori produk",
    "seller": "nama toko/penjual"
  },
  "sentiment": {
    "positive": persentase positif 0-100,
    "neutral": persentase netral 0-100,
    "negative": persentase negatif 0-100
  },
  "summary": "ringkasan 2-3 kalimat tentang review dalam bahasa Indonesia santai",
  "suspiciousPercentage": persentase review mencurigakan 0-100,
  "pros": ["kelebihan 1", "kelebihan 2", "kelebihan 3"],
  "cons": ["kekurangan 1", "kekurangan 2"],
  "reviews": [
    {
      "userName": "nama pembeli",
      "rating": 1-5,
      "date": "YYYY-MM-DD",
      "content": "isi review",
      "sentiment": "positive/neutral/negative",
      "verified": true/false,
      "suspicious": true/false
    }
  ]
}

Berikan minimal 5 review yang representatif dalam bahasa Indonesia.`;

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
            content: 'Kamu adalah asisten yang menganalisis produk e-commerce Indonesia. Selalu jawab dalam format JSON yang valid. Fokus pada analisis review dan sentimen pembeli.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
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
        JSON.stringify({ success: false, error: 'Tidak ada respons dari AI' }),
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
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      console.log('Raw content:', content);
      return new Response(
        JSON.stringify({ success: false, error: 'Gagal memproses respons AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine the final image URL
    let finalImage = scrapedImage;
    
    // If no image was scraped, use a placeholder with product name
    if (!finalImage) {
      const productName = analysisData.product?.name || platform;
      finalImage = `https://placehold.co/400x400/1a1a2e/ffffff?text=${encodeURIComponent(productName.substring(0, 20))}`;
    }

    // Add platform, URL, and image to the result
    analysisData.product = {
      ...analysisData.product,
      id: crypto.randomUUID(),
      platform,
      url,
      image: finalImage,
    };

    // Add IDs to reviews
    if (analysisData.reviews) {
      analysisData.reviews = analysisData.reviews.map((review: any, index: number) => ({
        ...review,
        id: `review-${index}`,
        platform,
      }));
    }

    // Generate mock price history (last 30 days)
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
