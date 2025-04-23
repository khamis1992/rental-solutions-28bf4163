
/**
 * Simple in-memory cache manager for data caching
 */
export class CacheManager {
  private static cache: Record<string, { data: any; timestamp: number }> = {};
  private static TTL: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Set a value in cache
   * @param key Cache key
   * @param value Data to cache
   * @param ttl Optional TTL in ms
   */
  static set(key: string, value: any, ttl?: number): void {
    this.cache[key] = {
      data: value,
      timestamp: Date.now(),
    };
  }

  /**
   * Get a value from cache
   * @param key Cache key
   * @returns The cached value or null if not found or expired
   */
  static get(key: string): any | null {
    const cached = this.cache[key];
    
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > this.TTL) {
      this.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Delete a cached item
   * @param key Cache key
   */
  static delete(key: string): void {
    delete this.cache[key];
  }

  /**
   * Clear entire cache
   */
  static clear(): void {
    this.cache = {};
  }
}
