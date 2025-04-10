
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
