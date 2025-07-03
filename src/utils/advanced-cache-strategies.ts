/**
 * نظام متقدم لاستراتيجيات التخزين المؤقت
 * Advanced caching strategies for optimal performance
 */

// أنواع استراتيجيات التخزين المؤقت
export type CacheStrategy = 
  | 'cache-first' 
  | 'network-first' 
  | 'cache-only' 
  | 'network-only' 
  | 'stale-while-revalidate'
  | 'cache-with-network-fallback'
  | 'network-with-cache-fallback';

// أنواع المحتوى
export type ContentType = 
  | 'static' 
  | 'api' 
  | 'images' 
  | 'documents' 
  | 'fonts' 
  | 'css' 
  | 'js'
  | 'html';

// إعدادات التخزين المؤقت
export interface CacheConfiguration {
  name: string;
  version: string;
  strategy: CacheStrategy;
  maxAge: number; // بالثواني
  maxEntries: number;
  purgeOnQuotaError: boolean;
  networkTimeout: number; // بالميلي ثانية
  updateMode: 'background' | 'immediate' | 'manual';
}

// قواعد التخزين المؤقت
export interface CacheRule {
  pattern: RegExp | string;
  contentType: ContentType;
  config: CacheConfiguration;
  priority: number;
}

// إحصائيات التخزين المؤقت
export interface CacheStats {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  cacheSize: number;
  storageUsage: number;
  lastCleanup: Date;
  performance: {
    averageResponseTime: number;
    cacheHitTime: number;
    networkFetchTime: number;
  };
}

class AdvancedCacheManager {
  private cacheRules: CacheRule[] = [];
  private stats: Map<string, CacheStats> = new Map();
  private cleanupInterval: number | null = null;
  private isServiceWorkerSupported: boolean;

  constructor() {
    this.isServiceWorkerSupported = 'serviceWorker' in navigator;
    this.initializeDefaultRules();
    this.setupCleanupSchedule();
  }

  // تهيئة القواعد الافتراضية
  private initializeDefaultRules(): void {
    this.cacheRules = [
      // ملفات HTML - Network First للحصول على أحدث المحتوى
      {
        pattern: /\.html$/,
        contentType: 'html',
        config: {
          name: 'html-cache',
          version: '1.0',
          strategy: 'network-first',
          maxAge: 300, // 5 دقائق
          maxEntries: 50,
          purgeOnQuotaError: true,
          networkTimeout: 3000,
          updateMode: 'background'
        },
        priority: 1
      },
      
      // الملفات الثابتة - Cache First للأداء السريع
      {
        pattern: /\.(css|js|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf)$/,
        contentType: 'static',
        config: {
          name: 'static-cache',
          version: '1.0',
          strategy: 'cache-first',
          maxAge: 86400, // 24 ساعة
          maxEntries: 200,
          purgeOnQuotaError: true,
          networkTimeout: 5000,
          updateMode: 'background'
        },
        priority: 2
      },

      // الصور - Cache First مع انتهاء صلاحية طويل
      {
        pattern: /\.(jpg|jpeg|png|gif|webp|svg|ico)$/,
        contentType: 'images',
        config: {
          name: 'images-cache',
          version: '1.0',
          strategy: 'cache-first',
          maxAge: 604800, // أسبوع
          maxEntries: 300,
          purgeOnQuotaError: true,
          networkTimeout: 8000,
          updateMode: 'background'
        },
        priority: 3
      },

      // API Calls - Network First مع fallback للكاش
      {
        pattern: /\/api\/|\/rest\/v1\//,
        contentType: 'api',
        config: {
          name: 'api-cache',
          version: '1.0',
          strategy: 'network-first',
          maxAge: 180, // 3 دقائق
          maxEntries: 100,
          purgeOnQuotaError: true,
          networkTimeout: 5000,
          updateMode: 'immediate'
        },
        priority: 4
      },

      // المستندات - Cache First للملفات الكبيرة
      {
        pattern: /\.(pdf|doc|docx|xls|xlsx)$/,
        contentType: 'documents',
        config: {
          name: 'documents-cache',
          version: '1.0',
          strategy: 'cache-first',
          maxAge: 3600, // ساعة
          maxEntries: 50,
          purgeOnQuotaError: true,
          networkTimeout: 15000,
          updateMode: 'background'
        },
        priority: 5
      },

      // الخطوط - Cache First مع انتهاء صلاحية طويل
      {
        pattern: /\.(woff|woff2|ttf|otf|eot)$/,
        contentType: 'fonts',
        config: {
          name: 'fonts-cache',
          version: '1.0',
          strategy: 'cache-first',
          maxAge: 31536000, // سنة
          maxEntries: 30,
          purgeOnQuotaError: false,
          networkTimeout: 10000,
          updateMode: 'background'
        },
        priority: 6
      }
    ];
  }

  // العثور على القاعدة المناسبة للطلب
  findMatchingRule(url: string): CacheRule | null {
    return this.cacheRules
      .filter(rule => {
        if (rule.pattern instanceof RegExp) {
          return rule.pattern.test(url);
        }
        return url.includes(rule.pattern);
      })
      .sort((a, b) => a.priority - b.priority)[0] || null;
  }

  // تطبيق استراتيجية التخزين المؤقت
  async applyStrategy(
    request: Request,
    rule: CacheRule
  ): Promise<Response> {
    const { strategy, networkTimeout } = rule.config;
    
    switch (strategy) {
      case 'cache-first':
        return this.cacheFirst(request, rule);
      
      case 'network-first':
        return this.networkFirst(request, rule);
      
      case 'stale-while-revalidate':
        return this.staleWhileRevalidate(request, rule);
      
      case 'cache-only':
        return this.cacheOnly(request, rule);
      
      case 'network-only':
        return this.networkOnly(request, rule);
      
      case 'cache-with-network-fallback':
        return this.cacheWithNetworkFallback(request, rule);
      
      case 'network-with-cache-fallback':
        return this.networkWithCacheFallback(request, rule);
      
      default:
        return this.networkFirst(request, rule);
    }
  }

  // استراتيجية Cache First
  private async cacheFirst(request: Request, rule: CacheRule): Promise<Response> {
    const cache = await caches.open(rule.config.name);
    const cachedResponse = await cache.match(request);

    if (cachedResponse && !this.isExpired(cachedResponse, rule.config.maxAge)) {
      this.updateStats(rule.config.name, 'hit');
      return cachedResponse;
    }

    try {
      const networkResponse = await this.fetchWithTimeout(request, rule.config.networkTimeout);
      
      if (networkResponse.ok) {
        await this.storeInCache(cache, request, networkResponse.clone(), rule);
        this.updateStats(rule.config.name, 'miss');
        return networkResponse;
      }
      
      // إذا فشل الشبكة، استخدم الكاش حتى لو انتهت صلاحيته
      if (cachedResponse) {
        this.updateStats(rule.config.name, 'stale');
        return cachedResponse;
      }
      
      throw new Error('Network request failed and no cache available');
    } catch (error) {
      if (cachedResponse) {
        this.updateStats(rule.config.name, 'fallback');
        return cachedResponse;
      }
      throw error;
    }
  }

  // استراتيجية Network First
  private async networkFirst(request: Request, rule: CacheRule): Promise<Response> {
    try {
      const networkResponse = await this.fetchWithTimeout(request, rule.config.networkTimeout);
      
      if (networkResponse.ok) {
        const cache = await caches.open(rule.config.name);
        await this.storeInCache(cache, request, networkResponse.clone(), rule);
        this.updateStats(rule.config.name, 'network');
        return networkResponse;
      }
      
      throw new Error('Network response not ok');
    } catch (error) {
      const cache = await caches.open(rule.config.name);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        this.updateStats(rule.config.name, 'fallback');
        return cachedResponse;
      }
      
      throw error;
    }
  }

  // استراتيجية Stale While Revalidate
  private async staleWhileRevalidate(request: Request, rule: CacheRule): Promise<Response> {
    const cache = await caches.open(rule.config.name);
    const cachedResponse = await cache.match(request);

    // تحديث في الخلفية
    const networkUpdate = this.fetchWithTimeout(request, rule.config.networkTimeout)
      .then(response => {
        if (response.ok) {
          this.storeInCache(cache, request, response.clone(), rule);
        }
        return response;
      })
      .catch(error => {
        console.warn('Background update failed:', error);
      });

    if (cachedResponse) {
      this.updateStats(rule.config.name, 'hit');
      // لا ننتظر التحديث، نرجع الكاش فوراً
      return cachedResponse;
    }

    // إذا لم يكن هناك كاش، ننتظر الشبكة
    try {
      const networkResponse = await networkUpdate;
      this.updateStats(rule.config.name, 'network');
      return networkResponse as Response;
    } catch (error) {
      throw error;
    }
  }

  // استراتيجية Cache Only
  private async cacheOnly(request: Request, rule: CacheRule): Promise<Response> {
    const cache = await caches.open(rule.config.name);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      this.updateStats(rule.config.name, 'hit');
      return cachedResponse;
    }

    throw new Error('No cache available for cache-only strategy');
  }

  // استراتيجية Network Only
  private async networkOnly(request: Request, rule: CacheRule): Promise<Response> {
    const networkResponse = await this.fetchWithTimeout(request, rule.config.networkTimeout);
    this.updateStats(rule.config.name, 'network');
    return networkResponse;
  }

  // استراتيجية Cache with Network Fallback
  private async cacheWithNetworkFallback(request: Request, rule: CacheRule): Promise<Response> {
    const cache = await caches.open(rule.config.name);
    const cachedResponse = await cache.match(request);

    if (cachedResponse && !this.isExpired(cachedResponse, rule.config.maxAge)) {
      this.updateStats(rule.config.name, 'hit');
      return cachedResponse;
    }

    try {
      const networkResponse = await this.fetchWithTimeout(request, rule.config.networkTimeout);
      
      if (networkResponse.ok) {
        await this.storeInCache(cache, request, networkResponse.clone(), rule);
        this.updateStats(rule.config.name, 'network');
        return networkResponse;
      }
      
      throw new Error('Network response not ok');
    } catch (error) {
      if (cachedResponse) {
        this.updateStats(rule.config.name, 'fallback');
        return cachedResponse;
      }
      throw error;
    }
  }

  // استراتيجية Network with Cache Fallback
  private async networkWithCacheFallback(request: Request, rule: CacheRule): Promise<Response> {
    try {
      const networkResponse = await this.fetchWithTimeout(request, rule.config.networkTimeout);
      
      if (networkResponse.ok) {
        const cache = await caches.open(rule.config.name);
        await this.storeInCache(cache, request, networkResponse.clone(), rule);
        this.updateStats(rule.config.name, 'network');
        return networkResponse;
      }
      
      throw new Error('Network response not ok');
    } catch (error) {
      const cache = await caches.open(rule.config.name);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        this.updateStats(rule.config.name, 'fallback');
        return cachedResponse;
      }
      
      throw error;
    }
  }

  // طلب شبكة مع مهلة زمنية
  private async fetchWithTimeout(request: Request, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(request, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // حفظ في التخزين المؤقت
  private async storeInCache(
    cache: Cache,
    request: Request,
    response: Response,
    rule: CacheRule
  ): Promise<void> {
    // إضافة metadata للاستجابة
    const headers = new Headers(response.headers);
    headers.set('sw-cache-timestamp', Date.now().toString());
    headers.set('sw-cache-rule', rule.config.name);

    const responseToCache = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });

    await cache.put(request, responseToCache);
    
    // تنظيف الكاش إذا تجاوز الحد الأقصى
    await this.enforceMaxEntries(cache, rule.config.maxEntries);
  }

  // فحص انتهاء الصلاحية
  private isExpired(response: Response, maxAge: number): boolean {
    const timestamp = response.headers.get('sw-cache-timestamp');
    if (!timestamp) return true;

    const age = (Date.now() - parseInt(timestamp)) / 1000;
    return age > maxAge;
  }

  // تطبيق الحد الأقصى للإدخالات
  private async enforceMaxEntries(cache: Cache, maxEntries: number): Promise<void> {
    const keys = await cache.keys();
    
    if (keys.length > maxEntries) {
      // حذف أقدم الإدخالات
      const entriesToDelete = keys.length - maxEntries;
      const sortedKeys = keys.sort((a, b) => {
        const timestampA = parseInt(a.headers?.get('sw-cache-timestamp') || '0');
        const timestampB = parseInt(b.headers?.get('sw-cache-timestamp') || '0');
        return timestampA - timestampB;
      });

      for (let i = 0; i < entriesToDelete; i++) {
        await cache.delete(sortedKeys[i]);
      }
    }
  }

  // تحديث الإحصائيات
  private updateStats(cacheName: string, action: string): void {
    const currentStats = this.stats.get(cacheName) || {
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      cacheSize: 0,
      storageUsage: 0,
      lastCleanup: new Date(),
      performance: {
        averageResponseTime: 0,
        cacheHitTime: 0,
        networkFetchTime: 0
      }
    };

    currentStats.totalRequests++;
    
    switch (action) {
      case 'hit':
      case 'stale':
        currentStats.hitRate = (currentStats.hitRate * (currentStats.totalRequests - 1) + 1) / currentStats.totalRequests;
        break;
      case 'miss':
      case 'network':
      case 'fallback':
        currentStats.missRate = (currentStats.missRate * (currentStats.totalRequests - 1) + 1) / currentStats.totalRequests;
        break;
    }

    this.stats.set(cacheName, currentStats);
  }

  // إعداد جدولة التنظيف
  private setupCleanupSchedule(): void {
    // تنظيف كل 6 ساعات
    this.cleanupInterval = window.setInterval(() => {
      this.performCleanup();
    }, 6 * 60 * 60 * 1000);
  }

  // تنظيف التخزين المؤقت
  async performCleanup(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const rule = this.cacheRules.find(r => r.config.name === cacheName);
            if (rule && this.isExpired(response, rule.config.maxAge)) {
              await cache.delete(request);
            }
          }
        }
      }
      
      console.log('Cache cleanup completed');
    } catch (error) {
      console.error('Cache cleanup failed:', error);
    }
  }

  // الحصول على الإحصائيات
  getStats(): Map<string, CacheStats> {
    return this.stats;
  }

  // إضافة قاعدة كاش مخصصة
  addCustomRule(rule: CacheRule): void {
    this.cacheRules.push(rule);
    this.cacheRules.sort((a, b) => a.priority - b.priority);
  }

  // مسح كل التخزين المؤقت
  async clearAllCache(): Promise<void> {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    this.stats.clear();
  }

  // تدمير المدير
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// مثيل عام لمدير التخزين المؤقت
export const advancedCacheManager = new AdvancedCacheManager();

// أدوات مساعدة للتخزين المؤقت
export const CacheUtils = {
  // فحص دعم Service Worker
  isServiceWorkerSupported(): boolean {
    return 'serviceWorker' in navigator;
  },

  // فحص دعم Cache API
  isCacheAPISupported(): boolean {
    return 'caches' in window;
  },

  // تقدير استخدام التخزين
  async getStorageEstimate(): Promise<StorageEstimate | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return await navigator.storage.estimate();
    }
    return null;
  },

  // تنسيق حجم التخزين
  formatStorageSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  // حفظ بيانات مهمة في IndexedDB للوصول السريع
  async storeImportantData(key: string, data: any): Promise<void> {
    try {
      const request = indexedDB.open('app-cache-db', 1);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('important-data')) {
          db.createObjectStore('important-data');
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['important-data'], 'readwrite');
        const store = transaction.objectStore('important-data');
        store.put(data, key);
      };
    } catch (error) {
      console.error('Failed to store important data:', error);
    }
  }
};

// Hook لاستخدام التخزين المؤقت المتقدم في React
export const useAdvancedCache = () => {
  const [stats, setStats] = useState<Map<string, CacheStats>>(new Map());
  const [storageUsage, setStorageUsage] = useState<StorageEstimate | null>(null);

  // تحديث الإحصائيات
  const updateStats = () => {
    setStats(new Map(advancedCacheManager.getStats()));
  };

  // تحديث استخدام التخزين
  const updateStorageUsage = async () => {
    const estimate = await CacheUtils.getStorageEstimate();
    setStorageUsage(estimate);
  };

  // مسح التخزين المؤقت
  const clearCache = async () => {
    await advancedCacheManager.clearAllCache();
    updateStats();
    updateStorageUsage();
  };

  // تنظيف التخزين المؤقت
  const performCleanup = async () => {
    await advancedCacheManager.performCleanup();
    updateStats();
    updateStorageUsage();
  };

  useEffect(() => {
    updateStats();
    updateStorageUsage();

    // تحديث الإحصائيات كل 30 ثانية
    const interval = setInterval(() => {
      updateStats();
      updateStorageUsage();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    storageUsage,
    clearCache,
    performCleanup,
    updateStats,
    updateStorageUsage
  };
};

// React Hook لتوليد useState و useEffect
import { useState, useEffect } from 'react'; 