
import { supabase } from '@/integrations/supabase/client';

const transliterationCache = new Map<string, string>();

export const translateArabicName = async (text: string): Promise<string> => {
  try {
    // Check if the text contains Arabic characters
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    if (!hasArabic) return text;

    // Check cache first
    const cached = transliterationCache.get(text);
    if (cached) return cached;

    const { data, error } = await supabase.functions.invoke('translate-text', {
      body: { text },
    });

    if (error) {
      console.error('Transliteration error:', error);
      return text;
    }

    const transliterated = data.translatedText || text;
    
    // Cache the result
    transliterationCache.set(text, transliterated);
    
    return transliterated;
  } catch (err) {
    console.error('Error transliterating text:', err);
    return text;
  }
};
