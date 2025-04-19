
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
      console.log(`Processing Arabic text: "${text}" with context: ${context}`);
      
      const { data, error } = await supabase.functions.invoke('process-arabic-text', {
        body: { text, context }
      });

      if (error) {
        console.error('Error processing Arabic text:', error);
        return text;
      }

      if (data?.success && data?.processedText) {
        // Cache the result for future use
        if (useCache) {
          this.cache.set(cacheKey, data.processedText);
        }
        
        console.log(`Arabic text processed successfully: "${data.processedText}"`);
        return data.processedText;
      }

      return text;
    } catch (error) {
      console.error('Exception while processing Arabic text:', error);
      return text;
    }
  }

  /**
   * Process multiple texts in batch
   */
  static async processBatch(texts: string[], context: string = ''): Promise<string[]> {
    const results: string[] = [];
    
    for (const text of texts) {
      const processed = await this.processText(text, context);
      results.push(processed);
    }
    
    return results;
  }
}

/**
 * Check if text contains Arabic characters
 */
function containsArabicCharacters(text: string): boolean {
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text);
}
