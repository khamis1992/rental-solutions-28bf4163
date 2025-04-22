
import { supabase } from '@/integrations/supabase/client';

const transliterationCache = new Map<string, string>();

// Enhanced regex to detect Arabic and other non-Latin characters that might need transliteration
const needsTransliterationRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u0870-\u089F\u08F0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * Checks if text contains characters that need transliteration
 */
const needsTransliteration = (text: string): boolean => {
  if (!text) return false;
  return needsTransliterationRegex.test(text);
};

/**
 * Transliterates Arabic text to English
 * @param text Text to transliterate
 * @returns Transliterated text in English
 */
export const transliterateArabicName = async (text: string): Promise<string> => {
  try {
    // Return early if text is empty or doesn't need transliteration
    if (!text || text.trim() === '') return text;
    if (!needsTransliteration(text)) return text;
    
    // Check cache first for performance
    const cached = transliterationCache.get(text);
    if (cached) return cached;

    console.log(`Transliterating text: ${text}`);
    
    const { data, error } = await supabase.functions.invoke('translate-text', {
      body: { text, mode: 'transliteration' },
    });

    if (error) {
      console.error('Transliteration error:', error);
      return text; // Return original on error
    }

    const transliterated = data?.translatedText || text;
    
    // Cache the result for future use
    transliterationCache.set(text, transliterated);
    
    console.log(`Transliteration result: ${transliterated}`);
    return transliterated;
  } catch (err) {
    console.error('Error transliterating text:', err);
    return text; // Return original on error
  }
};

/**
 * Transliterates all text fields in an object
 * @param obj Object with text fields to transliterate
 * @returns New object with transliterated text fields
 */
export const transliterateTextFields = async <T extends Record<string, any>>(obj: T): Promise<T> => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = { ...obj } as T;
  
  // Process each property in the object
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && needsTransliteration(value)) {
      // Transliterate string values
      result[key as keyof T] = await transliterateArabicName(value) as any;
    } else if (Array.isArray(value)) {
      // Process arrays recursively
      result[key as keyof T] = await Promise.all(
        value.map(async item => 
          typeof item === 'object' && item !== null ? await transliterateTextFields(item) : item
        )
      ) as any;
    } else if (value && typeof value === 'object' && value !== null) {
      // Process nested objects recursively
      result[key as keyof T] = await transliterateTextFields(value) as any;
    }
  }
  
  return result;
};

/**
 * Processes a dataset for reports, ensuring all text fields are transliterated
 * @param data Array of objects to process
 * @returns Processed data with transliterated text
 */
export const prepareReportData = async <T extends Record<string, any>[]>(data: T): Promise<T> => {
  if (!data || !data.length) return data;
  
  // Process each item in the dataset
  const transliteratedData = await Promise.all(
    data.map(async item => await transliterateTextFields(item))
  );
  
  return transliteratedData as T;
};

/**
 * Analyzes an agreement using AI to recommend a status
 * @param agreementData Agreement data to analyze
 * @returns Analysis results with status recommendation
 */
export const analyzeAgreementStatus = async (agreementData: any): Promise<{
  recommendedStatus: string;
  confidence: number;
  explanation: string;
  riskLevel: 'low' | 'medium' | 'high';
  actionItems: string[];
  agreementId: string;
  analyzedAt: string;
  currentStatus: string;
}> => {
  try {
    console.log(`Analyzing agreement status for ID: ${agreementData.id}`);
    
    // Get payments data for this agreement
    const { data: payments, error: paymentsError } = await supabase
      .from('unified_payments')
      .select('*')
      .eq('lease_id', agreementData.id);
      
    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
      throw new Error(`Failed to fetch payment data: ${paymentsError.message}`);
    }
    
    // Enrich agreement data with payments
    const enrichedData = {
      ...agreementData,
      payments: payments || []
    };
    
    // Call the AI service to analyze the agreement
    const { data, error } = await supabase.functions.invoke('translate-text', {
      body: { 
        mode: 'agreement_analysis',
        agreementData: enrichedData
      },
    });

    if (error) {
      console.error('Agreement analysis error:', error);
      throw new Error(`Failed to analyze agreement: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error('Error analyzing agreement status:', err);
    throw err;
  }
};
