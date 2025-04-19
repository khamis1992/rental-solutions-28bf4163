
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
   * Check if the Edge Function service is available
   */
  static async checkServiceAvailability(forceCheck = false): Promise<boolean> {
    const now = Date.now();
    if (!forceCheck && this.isServiceAvailable !== null && now - this.lastCheckTime < this.SERVICE_CHECK_INTERVAL) {
      return this.isServiceAvailable;
    }

    try {
      console.log("Checking DeepSeek AI Arabic text processing service availability");
      const { data, error } = await supabase.functions.invoke('process-arabic-text', {
        body: { text: 'test', context: 'service-check' }
      });
      
      this.isServiceAvailable = !error && data?.success;
      this.lastCheckTime = now;
      
      console.log(`DeepSeek AI service is ${this.isServiceAvailable ? 'available' : 'unavailable'}`);
      
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('arabic_text_service_available', JSON.stringify({
          available: this.isServiceAvailable,
          timestamp: now
        }));
      }
      
      return this.isServiceAvailable;
    } catch (error) {
      console.error("Error checking DeepSeek AI service availability:", error);
      this.isServiceAvailable = false;
      this.lastCheckTime = now;
      
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('arabic_text_service_available', JSON.stringify({
          available: false,
          timestamp: now
        }));
      }
      
      return false;
    }
  }

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

    // Check service availability
    const isAvailable = await this.checkServiceAvailability();
    if (!isAvailable) {
      console.warn('DeepSeek AI Arabic text processing service is unavailable. Using original text.');
      return text;
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
    // Check if service is available before processing batch
    const isAvailable = await this.checkServiceAvailability();
    if (!isAvailable) {
      console.warn('DeepSeek AI Arabic text processing service is unavailable. Using original texts.');
      return texts;
    }

    const results: string[] = [];
    
    for (const text of texts) {
      const processed = await this.processText(text, context);
      results.push(processed);
    }
    
    return results;
  }

  /**
   * Get service status for UI display
   */
  static async getServiceStatus(): Promise<{available: boolean, lastCheck: Date}> {
    if (typeof sessionStorage !== 'undefined') {
      const cached = sessionStorage.getItem('arabic_text_service_available');
      if (cached) {
        try {
          const { available, timestamp } = JSON.parse(cached);
          const now = Date.now();
          
          // If the cache is less than 5 minutes old, use it
          if (now - timestamp < 300000) {
            return { 
              available, 
              lastCheck: new Date(timestamp)
            };
          }
        } catch (e) {
          console.warn('Error parsing cached Arabic text service status:', e);
        }
      }
    }
    
    // No valid cache, check service
    const available = await this.checkServiceAvailability(true);
    return {
      available,
      lastCheck: new Date()
    };
  }
}

/**
 * Check if text contains Arabic characters
 */
function containsArabicCharacters(text: string): boolean {
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text);
}
