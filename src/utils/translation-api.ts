
import { supabase } from '@/lib/supabase';

/**
 * Translate text using the translation edge function
 * @param text Text to translate
 * @param sourceLang Source language code (or 'auto' for auto-detection)
 * @param targetLang Target language code
 * @returns Promise with translated text
 */
export const translateText = async (
  text: string,
  sourceLang: string = 'auto',
  targetLang: string
): Promise<string> => {
  try {
    console.log(`Translating from ${sourceLang} to ${targetLang}: "${text}"`);
    
    const { data, error } = await supabase.functions.invoke('translate', {
      body: { text, sourceLang, targetLang },
    });
    
    if (error) {
      console.error('Translation function error:', error);
      throw new Error(`Translation failed: ${error.message}`);
    }
    
    console.log('Translation result:', data);
    return data.translatedText || text;
  } catch (error) {
    console.error('Translation error:', error);
    // Return original text on error
    return text;
  }
};

/**
 * Batch translate multiple texts
 * @param texts Array of texts to translate
 * @param sourceLang Source language code
 * @param targetLang Target language code
 * @returns Promise with array of translated texts
 */
export const batchTranslate = async (
  texts: string[],
  sourceLang: string = 'auto',
  targetLang: string
): Promise<string[]> => {
  try {
    // Process in batches to avoid overloading the API
    const batchSize = 5;
    const results: string[] = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const promises = batch.map(text => 
        translateText(text, sourceLang, targetLang)
      );
      
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }
    
    return results;
  } catch (error) {
    console.error('Batch translation error:', error);
    // Return original texts on error
    return texts;
  }
};
