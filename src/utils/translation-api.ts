
import { supabase } from '@/lib/supabase';

// Cache translated strings to avoid repeated translations
const translationCache: Record<string, Record<string, string>> = {};

// Pre-compile regex patterns for better performance
const ARABIC_PATTERN = /ال/;
const TRANSLATION_KEY_PATTERN = /^[a-zA-Z0-9]+\.[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*$/;
const PLACEHOLDER_PATTERN = /\{.*?\}/;

// Create a set of UI texts to skip for faster lookups
const uiTextsToSkip = new Set([
  'Agreement Details', 'View details', 'View agreement details', 'Details',
  'No payments found', 'No payment records exist for this agreement.',
  'Delete Payment', 'Are you sure you want to delete this payment?',
  'This action cannot be undone.', 'Payment History', 'Record Payment',
  'Amount', 'Payment Date', 'Payment Method', 'Reference Number', 'Notes',
  'Customer Information', 'Details about the customer', 'Vehicle Information',
  'Details about the rented vehicle', 'Agreement Details', 'Traffic Violations',
  'Violations during the rental period', 'Legal Cases', 'Case Management',
  'Edit', 'Agreement Copy', 'Generate Document', 'Delete', 'Confirm Deletion',
  'Are you sure you want to delete agreement', 'This action cannot be undone',
  'Cancel', 'Yes', 'No', 'None', 'Vehicle', 'Refresh', 'Fixing...', 'Fix Payments',
  'Track all payments for this agreement', 'No payments recorded for this agreement yet.',
  'Confirm Payment Deletion', 'Actions', 'Fines List', 'Record New Fine', 'Fine Analytics',
  'Pick a date', 'Add New Vehicle', 'Edit Vehicle', 'Add Vehicle', 'Update Vehicle',
  'Vehicle Image', 'Make', 'Model', 'Year', 'License Plate', 'VIN', 'Color', 'Mileage',
  'Location', 'Description', 'Insurance Company', 'Insurance Expiry Date', 'Daily Rate',
  'Vehicle Type', 'Select vehicle type', 'None', 'Loading', 'Invalid date', 'Pick a date',
  'Enter make', 'Enter model', 'Enter license plate', 'Enter VIN', 'Enter color',
  'Enter location', 'Enter description', 'Enter insurance company', 'Available', 'Rented',
  'Reserved', 'In Maintenance', 'At Police Station', 'In Accident', 'Stolen', 'Retired',
  'Select status'
]);

/**
 * Translate text using the Google Translate edge function
 * Optimized with caching and early returns
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
    // Early returns for empty text
    if (!text || text.trim() === '') {
      return text;
    }
    
    // Use cached translation if available
    const cacheKey = `${text}_${sourceLang}_${targetLang}`;
    const cacheKeyMap = `${sourceLang}_${targetLang}`;
    
    if (translationCache[cacheKeyMap]?.hasOwnProperty(text)) {
      return translationCache[cacheKeyMap][text];
    }
    
    // Skip translation for text that looks like it's already in the target language
    if (ARABIC_PATTERN.test(text) && targetLang === 'ar') {
      return text;
    }
    
    // Skip translation for translation keys
    if (TRANSLATION_KEY_PATTERN.test(text)) {
      return text;
    }
    
    // Skip text with placeholders like {duration}
    if (PLACEHOLDER_PATTERN.test(text)) {
      return text;
    }
    
    // Skip common UI texts
    if (uiTextsToSkip.has(text)) {
      return text;
    }
    
    // Only log if we're actually going to translate
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
    
    // Cache the translation result
    if (!translationCache[cacheKeyMap]) {
      translationCache[cacheKeyMap] = {};
    }
    translationCache[cacheKeyMap][text] = data.translatedText;
    
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
    
    // Optimize: filter out texts that don't need translation
    const textsToTranslate: string[] = [];
    const indices: number[] = [];
    const results: string[] = new Array(texts.length);
    
    const cacheKeyMap = `${sourceLang}_${targetLang}`;
    
    // Initialize cache for this language pair if needed
    if (!translationCache[cacheKeyMap]) {
      translationCache[cacheKeyMap] = {};
    }
    
    // Pre-process: identify texts that need translation
    texts.forEach((text, i) => {
      // Skip empty text
      if (!text || text.trim() === '') {
        results[i] = text;
        return;
      }
      
      // Use cached translation if available
      if (translationCache[cacheKeyMap][text]) {
        results[i] = translationCache[cacheKeyMap][text];
        return;
      }
      
      // Skip texts that don't need translation
      if ((ARABIC_PATTERN.test(text) && targetLang === 'ar') || 
          TRANSLATION_KEY_PATTERN.test(text) ||
          PLACEHOLDER_PATTERN.test(text) ||
          uiTextsToSkip.has(text)) {
        results[i] = text;
        return;
      }
      
      // This text needs translation
      textsToTranslate.push(text);
      indices.push(i);
    });
    
    // If nothing needs translation, return original array
    if (textsToTranslate.length === 0) {
      return texts;
    }
    
    // Process in batches to avoid overloading the API
    const batchSize = 5;
    
    for (let i = 0; i < textsToTranslate.length; i += batchSize) {
      const batch = textsToTranslate.slice(i, i + batchSize);
      const promises = batch.map(text => translateText(text, sourceLang, targetLang));
      
      const batchResults = await Promise.all(promises);
      
      // Store results and update cache
      batchResults.forEach((translatedText, j) => {
        const originalIndex = indices[i + j];
        results[originalIndex] = translatedText;
        
        // Update cache
        translationCache[cacheKeyMap][textsToTranslate[i + j]] = translatedText;
      });
    }
    
    // Fill in any remaining slots
    for (let i = 0; i < results.length; i++) {
      if (results[i] === undefined) {
        results[i] = texts[i];
      }
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
 * Using improved performance approach
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
    const result: Record<string, unknown> = { ...obj };
    const keys = Object.keys(obj);
    const stringValues: string[] = [];
    const stringKeys: string[] = [];
    
    // First pass: collect all string values and their keys
    for (const key of keys) {
      if (typeof obj[key] === 'string') {
        stringValues.push(obj[key] as string);
        stringKeys.push(key);
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
