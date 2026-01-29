/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

    // Ask Perplexity to analyze the product
    const prompt = `Analisis produk dari URL ini: ${url}

Tolong berikan informasi dalam format JSON yang valid dengan struktur berikut:
{
  "product": {
    "name": "nama produk lengkap",
    "price": harga dalam rupiah (angka saja tanpa Rp),
    "originalPrice": harga asli jika ada diskon (angka saja, null jika tidak ada),
    "rating": rating produk (angka desimal 1-5),
    "totalReviews": jumlah total review,
    "category": "kategori produk",
    "seller": "nama toko/penjual",
    "image": "URL gambar produk jika tersedia"
  },
  "sentiment": {
    "positive": persentase review positif (0-100),
    "neutral": persentase review netral (0-100),
    "negative": persentase review negatif (0-100)
  },
  "summary": "ringkasan 2-3 kalimat tentang kesimpulan review dalam bahasa Indonesia yang santai dan friendly, contoh: 'X% pembeli puas banget sama produk ini! Kualitas bagus dan sesuai deskripsi. Tapi Y% ada yang komplain soal [masalah spesifik].'",
  "suspiciousPercentage": persentase review yang mencurigakan/palsu (0-100),
  "pros": ["kelebihan 1", "kelebihan 2", "kelebihan 3", "kelebihan 4", "kelebihan 5"],
  "cons": ["kekurangan 1", "kekurangan 2", "kekurangan 3"],
  "reviews": [
    {
      "userName": "nama pembeli",
      "rating": rating 1-5,
      "date": "tanggal review dalam format YYYY-MM-DD",
      "content": "isi review asli",
      "sentiment": "positive/neutral/negative",
      "verified": true/false,
      "suspicious": true/false
    }
  ]
}

Catatan penting:
- Berikan data serealistis mungkin berdasarkan informasi yang tersedia
- Untuk reviews, berikan minimal 5 review representatif
- Gunakan bahasa Indonesia yang natural untuk summary dan review
- Pastikan JSON valid dan bisa di-parse`;

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

    // Add platform and URL to the result
    analysisData.product = {
      ...analysisData.product,
      id: crypto.randomUUID(),
      platform,
      url,
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

    console.log('Analysis complete');

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
