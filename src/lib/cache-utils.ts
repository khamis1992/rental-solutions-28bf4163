
import { useState, useEffect } from 'react';

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  lastAccessed: number;
  accessCount: number;
  size: number;
};

type CacheStats = {
  hits: number;
  misses: number;
  totalEntries: number;
  totalSize: number;
  oldestEntry: number;
};

export class CacheManager {
  private static cache = new Map<string, CacheEntry<any>>();
  private static TTL = 5 * 60 * 1000; // 5 minutes
  private static MAX_CACHE_SIZE = 100; // Maximum number of entries
  private static MAX_MEMORY_SIZE = 50 * 1024 * 1024; // 50MB in bytes
  private static stats: CacheStats = {
    hits: 0,
    misses: 0,
    totalEntries: 0,
    totalSize: 0,
    oldestEntry: Date.now()
  };

  private static calculateSize(data: any): number {
    try {
      const str = JSON.stringify(data);
      return str.length * 2; // Approximate size in bytes
    } catch {
      return 1000; // Fallback size for non-serializable data
    }
  }

  private static evictByPolicy(policy: 'LRU' | 'LFU' = 'LRU') {
    const entries = Array.from(this.cache.entries());
    
    if (policy === 'LRU') {
      entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    } else {
      entries.sort(([, a], [, b]) => a.accessCount - b.accessCount);
    }

    while (
      this.stats.totalSize > this.MAX_MEMORY_SIZE || 
      this.stats.totalEntries > this.MAX_CACHE_SIZE
    ) {
      const [key, entry] = entries.shift() || [];
      if (key) {
        this.cache.delete(key);
        this.stats.totalSize -= entry.size;
        this.stats.totalEntries--;
      }
    }
  }

  static set<T>(key: string, data: T, ttl?: number): void {
    const size = this.calculateSize(data);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
      size
    };

    this.stats.totalSize += size;
    this.stats.totalEntries++;
    this.evictByPolicy();
    
    this.cache.set(key, entry);
  }

  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      this.stats.totalSize -= entry.size;
      this.stats.totalEntries--;
      this.stats.misses++;
      return null;
    }

    entry.lastAccessed = Date.now();
    entry.accessCount++;
    this.stats.hits++;
    
    return entry.data as T;
  }

  static getStats(): CacheStats {
    return { ...this.stats };
  }

  static clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      totalEntries: 0,
      totalSize: 0,
      oldestEntry: Date.now()
    };
  }

  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          resolve(func(...args));
        }, wait);
      });
    };
  }
}

// React hook for using cached data
export function useCachedData<T>(
  key: string,
  fetchData: () => Promise<T>,
  ttl?: number
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        let cachedData = CacheManager.get<T>(key);
        
        if (!cachedData) {
          setLoading(true);
          cachedData = await fetchData();
          CacheManager.set(key, cachedData, ttl);
        }
        
        setData(cachedData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [key, ttl]);

  return { data, loading, error };
}

export const createRequestDebouncer = () => {
  const pending = new Map<string, Promise<any>>();
  
  return async <T>(
    key: string,
    request: () => Promise<T>,
    ttl = 2000
  ): Promise<T> => {
    const existing = pending.get(key);
    if (existing) return existing;
    
    const promise = request().finally(() => {
      setTimeout(() => pending.delete(key), ttl);
    });
    
    pending.set(key, promise);
    return promise;
  };
};
