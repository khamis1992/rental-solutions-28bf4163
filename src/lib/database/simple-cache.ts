/**
 * نظام تخزين مؤقت بسيط مع Database Fallback
 * Simple Cache System with Database Fallback
 */

import { supabase } from '@/lib/supabase';
import { CACHE_KEYS, CACHE_TTL, CACHE_SETTINGS } from './cache-config';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

class SimpleCacheSystem {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    hitRate: 0
  };

  /**
   * الحصول من الكاش
   */
  async get<T>(key: string): Promise<T | null> {
    // أولاً: فحص Memory Cache
    const memoryResult = this.getFromMemory<T>(key);
    if (memoryResult !== null) {
      this.stats.hits++;
      this.updateHitRate();
      return memoryResult;
    }

    // ثانياً: فحص Database Cache
    const dbResult = await this.getFromDatabase<T>(key);
    if (dbResult !== null) {
      // حفظ في Memory للوصول السريع
      this.setInMemory(key, dbResult, CACHE_SETTINGS[key as keyof typeof CACHE_SETTINGS] || CACHE_TTL.MEDIUM);
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }

    this.updateHitRate();
    return dbResult;
  }

  /**
   * حفظ في الكاش
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    const ttl = ttlSeconds || CACHE_SETTINGS[key as keyof typeof CACHE_SETTINGS] || CACHE_TTL.MEDIUM;
    
    // حفظ في Memory
    this.setInMemory(key, value, ttl);
    
    // حفظ في Database
    const dbSuccess = await this.setInDatabase(key, value, ttl);
    
    if (dbSuccess) {
      this.stats.sets++;
    }
    
    return dbSuccess;
  }

  /**
   * حذف من الكاش
   */
  async delete(key: string): Promise<boolean> {
    // حذف من Memory
    this.memoryCache.delete(key);
    
    // حذف من Database
    return this.deleteFromDatabase(key);
  }

  /**
   * الحصول من Memory Cache
   */
  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // فحص انتهاء الصلاحية
    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * حفظ في Memory Cache
   */
  private setInMemory<T>(key: string, value: T, ttlSeconds: number): void {
    const entry: CacheEntry<T> = {
      data: value,
      expiresAt: Date.now() + (ttlSeconds * 1000),
      createdAt: Date.now()
    };
    
    this.memoryCache.set(key, entry);
  }

  /**
   * الحصول من Database Cache
   */
  private async getFromDatabase<T>(key: string): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from('query_cache')
        .select('cache_data')
        .eq('cache_key', key)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return null;
      }

      return data.cache_data as T;
    } catch (error) {
      console.error('Database cache get error:', error);
      return null;
    }
  }

  /**
   * حفظ في Database Cache
   */
  private async setInDatabase<T>(key: string, value: T, ttlSeconds: number): Promise<boolean> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

      const { error } = await supabase
        .from('query_cache')
        .upsert({
          cache_key: key,
          cache_data: value as any,
          expires_at: expiresAt
        });

      return !error;
    } catch (error) {
      console.error('Database cache set error:', error);
      return false;
    }
  }

  /**
   * حذف من Database Cache
   */
  private async deleteFromDatabase(key: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('query_cache')
        .delete()
        .eq('cache_key', key);

      return !error;
    } catch (error) {
      console.error('Database cache delete error:', error);
      return false;
    }
  }

  /**
   * تحديث معدل الإصابة
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * تنظيف Memory Cache
   */
  cleanupMemory(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expiresAt) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * تنظيف Database Cache
   */
  async cleanupDatabase(): Promise<number> {
    try {
      const { error, count } = await supabase
        .from('query_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      return error ? 0 : (count || 0);
    } catch (error) {
      console.error('Database cache cleanup error:', error);
      return 0;
    }
  }

  /**
   * الحصول على الإحصائيات
   */
  getStats() {
    return {
      ...this.stats,
      memorySize: this.memoryCache.size
    };
  }

  /**
   * مسح جميع الكاش
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    await supabase.from('query_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
}

// Instance مشترك
export const simpleCache = new SimpleCacheSystem();

// Helper functions للاستخدام المباشر
export const getCachedData = <T>(key: string) => simpleCache.get<T>(key);
export const setCachedData = <T>(key: string, value: T, ttl?: number) => simpleCache.set(key, value, ttl);
export const deleteCachedData = (key: string) => simpleCache.delete(key);
export const getCacheStats = () => simpleCache.getStats();

// تنظيف دوري كل 5 دقائق
setInterval(() => {
  simpleCache.cleanupMemory();
}, 5 * 60 * 1000); 