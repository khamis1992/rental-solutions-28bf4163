
import { supabase } from '@/lib/supabase';

/**
 * Translate text using the Google Translate edge function
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
    if (!text || text.trim() === '') {
      return text;
    }
    
    console.log(`Translating from ${sourceLang} to ${targetLang}: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
    
    const { data, error } = await supabase.functions.invoke('translate', {
      body: { text, sourceLang, targetLang },
    });
    
    if (error) {
      console.error('Translation function error:', error);
      throw new Error(`Translation failed: ${error.message}`);
    }
    
    if (!data || !data.translatedText) {
      console.warn('No translation data returned');
      return text;
    }
    
    console.log('Translation successful');
    return data.translatedText;
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
    if (!texts || texts.length === 0) {
      return texts;
    }
    
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

/**
 * Translate a JSON object by translating all string values
 * @param obj Object with string values to translate
 * @param sourceLang Source language code
 * @param targetLang Target language code
 * @returns Promise with translated object
 */
export const translateObject = async <T extends Record<string, unknown>>(
  obj: T,
  sourceLang: string = 'auto',
  targetLang: string
): Promise<T> => {
  try {
    const result = { ...obj } as T;
    const keys = Object.keys(obj);
    const values = Object.values(obj).filter(v => typeof v === 'string') as string[];
    
    if (values.length === 0) {
      return obj;
    }
    
    const translatedValues = await batchTranslate(values, sourceLang, targetLang);
    let valueIndex = 0;
    
    for (const key of keys) {
      if (typeof obj[key] === 'string') {
        // Use type assertion to avoid the TypeScript error
        (result as Record<string, unknown>)[key] = translatedValues[valueIndex++];
      }
    }
    
    return result;
  } catch (error) {
    console.error('Object translation error:', error);
    return obj;
  }
};
