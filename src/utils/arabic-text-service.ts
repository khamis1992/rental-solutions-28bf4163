
import { supabase } from '@/lib/supabase';

/**
 * Service to process Arabic text using DeepSeek AI to fix rendering issues
 */
export class ArabicTextService {
  private static cache: Map<string, string> = new Map();

  /**
   * Process Arabic text to fix rendering issues for PDF reports
   * @param text The text to be processed
   * @param context Optional context about the document
   * @param useCache Whether to use the cache (default: true)
   * @returns The processed text with fixes for PDF rendering
   */
  static async processText(text: string, context: string = '', useCache: boolean = true): Promise<string> {
    // For very short texts or non-Arabic text, skip processing
    if (!text || text.length < 3 || !containsArabicCharacters(text)) {
      return text;
    }

    // Check cache if enabled
    const cacheKey = `${text}-${context}`;
    if (useCache && this.cache.has(cacheKey)) {
      console.log('Using cached processed Arabic text');
      return this.cache.get(cacheKey) || text;
    }

    try {
      const { data, error } = await supabase.functions.invoke('process-arabic-text', {
        body: { text, context }
      });

      if (error) {
        console.error('Error processing Arabic text:', error);
        return text; // Return original text on error
      }

      if (data?.success && data?.processedText) {
        // Cache the result for future use
        if (useCache) {
          this.cache.set(cacheKey, data.processedText);
        }
        
        console.log(`Arabic text processed - ${data.correctedChars || 0} characters corrected`);
        return data.processedText;
      }

      return text; // Return original text if processing was unsuccessful
    } catch (error) {
      console.error('Exception while processing Arabic text:', error);
      return text; // Return original text on exception
    }
  }

  /**
   * Process multiple texts in batch
   * @param texts Array of texts to process
   * @param context Context about the documents
   * @returns Array of processed texts
   */
  static async processBatch(texts: string[], context: string = ''): Promise<string[]> {
    const results: string[] = [];
    
    // Process in chunks of 5 to avoid overloading the API
    const chunkSize = 5;
    for (let i = 0; i < texts.length; i += chunkSize) {
      const chunk = texts.slice(i, i + chunkSize);
      const promises = chunk.map(text => this.processText(text, context));
      const processed = await Promise.all(promises);
      results.push(...processed);
    }
    
    return results;
  }

  /**
   * Clear the cache
   */
  static clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Check if text contains Arabic characters
 * @param text Text to check
 * @returns True if the text contains Arabic characters
 */
function containsArabicCharacters(text: string): boolean {
  // Arabic Unicode range: \u0600-\u06FF
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text);
}
