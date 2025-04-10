
type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

export class CacheManager {
  private static cache = new Map<string, CacheEntry<any>>();
  private static TTL = 5 * 60 * 1000; // 5 minutes

  static set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  static clear(): void {
    this.cache.clear();
  }
}
