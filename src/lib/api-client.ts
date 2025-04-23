import { createClient } from '@supabase/supabase-js';

// Implement request batching and caching for Supabase client
class OptimizedSupabaseClient {
  private client;
  private cache = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes cache
  
  constructor(supabaseUrl, supabaseKey) {
    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      // Enable HTTP request cache control
      global: {
        headers: {
          'Cache-Control': 'max-age=300', // 5 minutes
        },
      },
    });
  }
  
  async fetchWithCache(key, fetchFn) {
    const cacheKey = JSON.stringify(key);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    
    const result = await fetchFn();
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });
    
    return result;
  }
  
  // Expose optimized methods that match original client API
  get auth() {
    return this.client.auth;
  }
  
  from(table) {
    return this.client.from(table);
  }
  
  // Add batch processing for multiple requests
  async batchProcess(operations) {
    // Implementation would depend on needs, but could wrap multiple
    // operations in a transaction or parallel processing
    return Promise.all(operations.map(op => op()));
  }
}

// Export singleton instance
export const supabaseClient = new OptimizedSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);