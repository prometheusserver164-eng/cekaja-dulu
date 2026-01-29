/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Extract product image from scraped HTML/markdown
function extractProductImage(html: string, markdown: string, url: string): string | null {
  // Common patterns for e-commerce product images
  const imagePatterns = [
    // Shopee CDN patterns
    /https?:\/\/(?:down-id\.img\.susercontent\.com|cf\.shopee\.co\.id)\/file\/[a-zA-Z0-9_-]+(?:_tn)?/gi,
    // Tokopedia CDN patterns
    /https?:\/\/images\.tokopedia\.net\/img\/cache\/\d+(?:-square)?\/[^\s"'<>]+/gi,
    // Generic high-res product image patterns
    /https?:\/\/[^\s"'<>]+(?:product|item|goods)[^\s"'<>]*\.(?:jpg|jpeg|png|webp)/gi,
  ];

  // Try to find images in HTML first (more reliable)
  for (const pattern of imagePatterns) {
    const matches = html.match(pattern);
    if (matches && matches.length > 0) {
      // Return the first match (usually the main product image)
      let imageUrl = matches[0];
      // Clean up URL if needed
      imageUrl = imageUrl.replace(/_tn$/, ''); // Remove thumbnail suffix for Shopee
      console.log('Found product image from HTML:', imageUrl);
      return imageUrl;
    }
  }

  // Try markdown as fallback
  for (const pattern of imagePatterns) {
    const matches = markdown.match(pattern);
    if (matches && matches.length > 0) {
      let imageUrl = matches[0];
      imageUrl = imageUrl.replace(/_tn$/, '');
      console.log('Found product image from markdown:', imageUrl);
      return imageUrl;
    }
  }

  // Extract any image URL from og:image or similar meta tags
  const ogImageMatch = html.match(/og:image[^>]*content=["']([^"']+)["']/i);
  if (ogImageMatch) {
    console.log('Found og:image:', ogImageMatch[1]);
    return ogImageMatch[1];
  }

  // Try to find any large image
  const anyImageMatch = html.match(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]*)?/gi);
  if (anyImageMatch) {
    // Filter out small images (icons, etc.)
    const largeImage = anyImageMatch.find(img => 
      !img.includes('icon') && 
      !img.includes('logo') && 
      !img.includes('avatar') &&
      !img.includes('flag') &&
      (img.includes('product') || img.includes('item') || img.includes('cache') || img.includes('file'))
    );
    if (largeImage) {
      console.log('Found potential product image:', largeImage);
      return largeImage;
    }
  }

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
    
    if (FIRECRAWL_API_KEY) {
      console.log('Scraping product page with Firecrawl...');
      try {
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: url,
            formats: ['html', 'markdown'],
            onlyMainContent: false,
            waitFor: 3000, // Wait for JS to load
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          const html = scrapeData.data?.html || scrapeData.html || '';
          const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
          
          console.log('Firecrawl scrape successful, extracting image...');
          scrapedImage = extractProductImage(html, markdown, url);
          
          if (scrapedImage) {
            console.log('Successfully extracted product image:', scrapedImage);
          } else {
            console.log('Could not extract product image from scraped content');
          }
        } else {
          console.error('Firecrawl scrape failed:', scrapeResponse.status);
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

    // Add platform, URL, and scraped image to the result
    analysisData.product = {
      ...analysisData.product,
      id: crypto.randomUUID(),
      platform,
      url,
      // Use scraped image if available, otherwise use a placeholder
      image: scrapedImage || `https://placehold.co/400x400/1a1a2e/ffffff?text=${encodeURIComponent(platform.charAt(0).toUpperCase() + platform.slice(1))}`,
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

    console.log('Analysis complete, image:', analysisData.product.image);

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
