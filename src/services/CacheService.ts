interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheStats {
  hits: number;
  misses: number;
  totalRequests: number;
  hitRate: number;
}

export class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    hitRate: 0
  };

  // Default TTL values (in milliseconds)
  private readonly DEFAULT_TTL = {
    FINANCIAL_SUMMARY: 5 * 60 * 1000, // 5 minutes
    INSTALLMENT_SUMMARY: 3 * 60 * 1000, // 3 minutes
    CONTRACT_DETAILS: 10 * 60 * 1000, // 10 minutes
    PAYMENT_LIST: 2 * 60 * 1000, // 2 minutes
    REPORTS: 15 * 60 * 1000, // 15 minutes
    ANALYTICS: 30 * 60 * 1000, // 30 minutes
  };

  // Set cache item with TTL
  set<T>(key: string, data: T, ttl?: number): void {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL.FINANCIAL_SUMMARY
    };
    
    this.cache.set(key, cacheItem);
    this.cleanupExpired();
  }

  // Get cache item if not expired
  get<T>(key: string): T | null {
    this.stats.totalRequests++;
    
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    this.stats.hits++;
    this.updateHitRate();
    return item.data as T;
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Delete specific cache key
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.resetStats();
  }

  // Get or set pattern - if not in cache, execute function and cache result
  async getOrSet<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFunction();
    this.set(key, data, ttl);
    return data;
  }

  // Invalidate cache by pattern
  invalidatePattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }

  // Specific cache methods for // installments - removed unused variable// Cache financial summary
  setFinancialSummary(userId: string, data: any): void {
    this.set(`financial_summary_${userId}`, data, this.DEFAULT_TTL.FINANCIAL_SUMMARY);
  }

  getFinancialSummary(userId: string): any | null {
    return this.get(`financial_summary_${userId}`);
  }

  // Cache installment summary
  setInstallmentSummary(userId: string, data: any): void {
    this.set(`installment_summary_${userId}`, data, this.DEFAULT_TTL.INSTALLMENT_SUMMARY);
  }

  getInstallmentSummary(userId: string): any | null {
    return this.get(`installment_summary_${userId}`);
  }

  // Cache contract details
  setContractDetails(contractId: string, data: any): void {
    this.set(`contract_${contractId}`, data, this.DEFAULT_TTL.CONTRACT_DETAILS);
  }

  getContractDetails(contractId: string): any | null {
    return this.get(`contract_${contractId}`);
  }

  // Cache contract payments
  setContractPayments(contractId: string, data: any): void {
    this.set(`payments_${contractId}`, data, this.DEFAULT_TTL.PAYMENT_LIST);
  }

  getContractPayments(contractId: string): any | null {
    return this.get(`payments_${contractId}`);
  }

  // Cache reports
  setReport(reportKey: string, data: any): void {
    this.set(`report_${reportKey}`, data, this.DEFAULT_TTL.REPORTS);
  }

  getReport(reportKey: string): any | null {
    return this.get(`report_${reportKey}`);
  }

  // Cache analytics
  setAnalytics(analyticsKey: string, data: any): void {
    this.set(`analytics_${analyticsKey}`, data, this.DEFAULT_TTL.ANALYTICS);
  }

  getAnalytics(analyticsKey: string): any | null {
    return this.get(`analytics_${analyticsKey}`);
  }

  // Invalidate related caches when data changes
  invalidateContractCache(contractId: string): void {
    this.delete(`contract_${contractId}`);
    this.delete(`payments_${contractId}`);
    this.invalidatePattern(`financial_summary_.*`);
    this.invalidatePattern(`installment_summary_.*`);
  }

  invalidateFinancialCaches(): void {
    this.invalidatePattern(`financial_summary_.*`);
    this.invalidatePattern(`installment_summary_.*`);
    this.invalidatePattern(`report_.*`);
    this.invalidatePattern(`analytics_.*`);
  }

  // Cleanup expired items
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Update hit rate
  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0;
  }

  // Reset statistics
  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      hitRate: 0
    };
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Get cache size
  getSize(): number {
    return this.cache.size;
  }

  // Get cache info for debugging
  getCacheInfo(): {
    size: number;
    stats: CacheStats;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      stats: this.getStats(),
      keys: Array.from(this.cache.keys())
    };
  }

  // Preload common data
  async preloadCommonData(userId: string): Promise<void> {
    try {
      // This would typically preload frequently accessed data
      console.log(`Preloading cache for user ${userId}`);
      
      // Example: preload financial summary, installment summary, etc.
      // These would be actual service calls
      
    } catch (error) {
      console.error('Error preloading cache:', error);
    }
  }
}

export const cacheService = new CacheService(); 