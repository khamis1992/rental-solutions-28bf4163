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
    // Check if the text matches common UI labels or contains translation keys
    const uiTextsToSkip = [
      'Agreement Details',
      'View details',
      'View agreement details', 
      'Details',
      'No payments found',
      'No payment records exist for this agreement.',
      'Delete Payment',
      'Are you sure you want to delete this payment?',
      'This action cannot be undone.',
      'Payment History',
      'Record Payment',
      'Amount',
      'Payment Date',
      'Payment Method',
      'Reference Number',
      'Notes',
      'Customer Information',
      'Details about the customer',
      'Vehicle Information',
      'Details about the rented vehicle',
      'Agreement Details',
      'Rental terms and payment information',
      'Traffic Fines',
      'Violations during the rental period',
      'Legal Cases',
      'Case Management',
      'Edit',
      'Agreement Copy',
      'Generate Document',
      'Delete',
      'Confirm Deletion',
      'Are you sure you want to delete agreement',
      'This action cannot be undone',
      'Cancel',
      'Yes',
      'No',
      'Vehicle',
      'Refresh',
      'Fixing...',
      'Fix Payments',
      'Track all payments for this agreement',
      'No payments recorded for this agreement yet.',
      'Confirm Payment Deletion',
      'Actions',
      'Traffic Fines Management',
      'Record, track, and manage traffic violations',
      'Fines List',
      'Record New Fine',
      'Fine Analytics',
      // Vehicle form texts to skip
      'Add New Vehicle',
      'Edit Vehicle',
      'Add Vehicle',
      'Update Vehicle',
      'Vehicle Image',
      'Make',
      'Model',
      'Year',
      'License Plate',
      'VIN',
      'Color',
      'Mileage',
      'Location',
      'Description',
      'Insurance Company',
      'Insurance Expiry Date',
      'Daily Rate',
      'Vehicle Type',
      'Select vehicle type',
      'None',
      'Loading',
      'Invalid date',
      'Pick a date',
      // Vehicle form placeholders
      'Enter make',
      'Enter model',
      'Enter license plate',
      'Enter VIN',
      'Enter color',
      'Enter location',
      'Enter description',
      'Enter insurance company',
      // Vehicle status options
      'Available',
      'Rented',
      'Reserved',
      'In Maintenance',
      'At Police Station',
      'In Accident',
      'Stolen',
      'Retired',
      'Select status'
    ];
    
    // Skip translation for text containing placeholder notation like {duration}
    if (text.includes('{') && text.includes('}')) {
      console.log(`Skipping translation for text with placeholders: "${text}"`);
      return text;
    }
    
    // Skip translation if text contains a translation key pattern (e.g., common.no or trafficFines.status.paid)
    if (/^[a-zA-Z0-9]+\.[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*$/.test(text)) {
      console.log(`Skipping translation for what appears to be a translation key: "${text}"`);
      return text;
    }
    
    if (uiTextsToSkip.some(uiText => text === uiText)) {
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
