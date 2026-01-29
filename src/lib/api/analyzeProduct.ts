import { supabase } from '@/integrations/supabase/client';
import { AnalysisResult } from '@/lib/mockData';

export interface AnalyzeProductResponse {
  success: boolean;
  data?: AnalysisResult;
  citations?: string[];
  error?: string;
}

export const analyzeProduct = async (url: string): Promise<AnalyzeProductResponse> => {
  try {
    console.log('Analyzing product URL:', url);
    
    const { data, error } = await supabase.functions.invoke('analyze-product', {
      body: { url },
    });

    if (error) {
      console.error('Error from edge function:', error);
      return { 
        success: false, 
        error: error.message || 'Gagal menganalisis produk' 
      };
    }

    if (!data.success) {
      return { 
        success: false, 
        error: data.error || 'Gagal menganalisis produk' 
      };
    }

    return {
      success: true,
      data: data.data,
      citations: data.citations,
    };
  } catch (error) {
    console.error('Error analyzing product:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Terjadi kesalahan' 
    };
  }
};
