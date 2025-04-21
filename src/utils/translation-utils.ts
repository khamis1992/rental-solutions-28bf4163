
import { supabase } from '@/integrations/supabase/client';

export const translateArabicName = async (text: string): Promise<string> => {
  try {
    // Check if the text contains Arabic characters
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    if (!hasArabic) return text;

    const { data, error } = await supabase.functions.invoke('translate-text', {
      body: { text },
    });

    if (error) {
      console.error('Translation error:', error);
      return text;
    }

    return data.translatedText || text;
  } catch (err) {
    console.error('Error translating text:', err);
    return text;
  }
};
