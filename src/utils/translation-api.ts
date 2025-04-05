
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
    
    // Skip translation for text that looks like it's already in the target language
    // This avoids unnecessary translation API calls and potential quality loss from multiple translations
    if (text.includes('ال') && targetLang === 'ar') {
      console.log(`Text appears to be already in Arabic, skipping translation: "${text}"`);
      return text;
    }
    
    // Skip translation for UI text that should come from locale files
    // Check if the text starts with common UI labels that should come from i18n
    if (
      (text.startsWith('Agreement') && text.includes('Details')) || 
      text.startsWith('View details') ||
      text === 'Details' ||
      text === 'Agreement Details' ||
      text === 'View agreement details'
    ) {
      console.log(`Skipping translation for UI text that should come from locale files: "${text}"`);
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
 * Using simplified generic type to avoid excessive type instantiation
 * @param obj Object with string values to translate
 * @param sourceLang Source language code
 * @param targetLang Target language code
 * @returns Promise with translated object
 */
export const translateObject = async <T extends Record<string, unknown>>(
  obj: T,
  sourceLang: string = 'auto',
  targetLang: string
): Promise<Record<string, unknown>> => {
  try {
    // Create a simple plain object to avoid type recursion
    const result: Record<string, unknown> = {};
    const keys = Object.keys(obj);
    const stringValues: string[] = [];
    const stringKeys: string[] = [];
    
    // First pass: collect all string values and their keys
    for (const key of keys) {
      if (typeof obj[key] === 'string') {
        stringValues.push(obj[key] as string);
        stringKeys.push(key);
      } else {
        // Copy non-string values directly
        result[key] = obj[key];
      }
    }
    
    if (stringValues.length === 0) {
      return obj; // No strings to translate
    }
    
    // Translate all string values in a batch
    const translatedValues = await batchTranslate(stringValues, sourceLang, targetLang);
    
    // Second pass: assign translated values
    for (let i = 0; i < stringKeys.length; i++) {
      result[stringKeys[i]] = translatedValues[i];
    }
    
    // Cast back to original type - this is safe as we've preserved the structure
    return result as unknown as T;
  } catch (error) {
    console.error('Object translation error:', error);
    return obj; // Return original object on error
  }
};
