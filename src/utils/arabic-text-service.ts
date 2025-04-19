
import { supabase } from '@/lib/supabase';

/**
 * Service to process Arabic text using DeepSeek AI to fix rendering issues
 */
export class ArabicTextService {
  private static cache: Map<string, string> = new Map();
  private static isServiceAvailable: boolean | null = null;
  private static lastCheckTime: number = 0;
  private static readonly SERVICE_CHECK_INTERVAL = 60000; // 1 minute

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

    // Check if service is available
    if (await this.checkServiceAvailability() === false) {
      console.warn('DeepSeek AI service is unavailable, returning original text');
      return text;
    }

    try {
      console.log(`Sending Arabic text to DeepSeek AI for processing (context: ${context})`);
      
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
      } else {
        console.warn('DeepSeek AI processing returned no results:', data);
      }

      return text; // Return original text if processing was unsuccessful
    } catch (error) {
      console.error('Exception while processing Arabic text:', error);
      return text; // Return original text on exception
    }
  }

  /**
   * Check if the DeepSeek AI service is available
   */
  private static async checkServiceAvailability(): Promise<boolean> {
    const now = Date.now();
    
    // Only check service availability once per minute
    if (this.isServiceAvailable !== null && now - this.lastCheckTime < this.SERVICE_CHECK_INTERVAL) {
      return this.isServiceAvailable;
    }

    try {
      const { data, error } = await supabase.functions.invoke('process-arabic-text', {
        body: { text: 'test', context: 'availability_check' }
      });

      this.lastCheckTime = now;
      
      if (error) {
        console.warn('DeepSeek AI service check failed:', error);
        this.isServiceAvailable = false;
        return false;
      }

      this.isServiceAvailable = data?.success === true;
      console.log(`DeepSeek AI service availability check: ${this.isServiceAvailable ? 'Available' : 'Unavailable'}`);
      return this.isServiceAvailable;
    } catch (error) {
      console.error('Error checking DeepSeek AI service availability:', error);
      this.isServiceAvailable = false;
      this.lastCheckTime = now;
      return false;
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
