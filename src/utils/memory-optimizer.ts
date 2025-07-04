import React from 'react';

/**
 * Memory Optimizer - أداة تحسين الذاكرة
 * 
 * تقوم بمراقبة وتحسين استخدام الذاكرة في التطبيق
 * تتضمن آليات تنظيف تلقائي ومنع تسريب الذاكرة
 */

export interface MemoryStats {
  used: number;
  total: number;
  limit: number;
  percentage: number;
  trend: 'stable' | 'increasing' | 'decreasing';
}

export interface MemoryOptimizationOptions {
  maxCacheSize: number;
  maxNotifications: number;
  cleanupInterval: number;
  memoryThreshold: number;
  aggressiveCleanup: boolean;
}

class MemoryOptimizer {
  private memoryHistory: number[] = [];
  private cleanupInterval: NodeJS.Timeout | null = null;
  private options: MemoryOptimizationOptions;
  private listeners: Set<(stats: MemoryStats) => void> = new Set();

  constructor(options: Partial<MemoryOptimizationOptions> = {}) {
    this.options = {
      maxCacheSize: 100, // عدد العناصر المحفوظة في الكاش
      maxNotifications: 50, // عدد الإشعارات المحفوظة
      cleanupInterval: 30000, // 30 ثانية
      memoryThreshold: 200, // 200 ميجابايت
      aggressiveCleanup: false,
      ...options
    };

    this.startMonitoring();
  }

  /**
   * بدء مراقبة الذاكرة
   */
  private startMonitoring(): void {
    // مراقبة الذاكرة كل 30 ثانية
    this.cleanupInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, this.options.cleanupInterval);

    // مراقبة عند تغيير الصفحة
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.performCleanup();
      });

      // مراقبة عند فقدان التركيز
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.performCleanup();
        }
      });
    }
  }

  /**
   * فحص استخدام الذاكرة الحالي
   */
  checkMemoryUsage(): MemoryStats | null {
    if (!('memory' in performance)) {
      return null;
    }

    const memory = (performance as any).memory;
    const stats: MemoryStats = {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
      percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      trend: this.calculateTrend(memory.usedJSHeapSize)
    };

    // إضافة إلى التاريخ
    this.memoryHistory.push(memory.usedJSHeapSize);
    if (this.memoryHistory.length > 10) {
      this.memoryHistory.shift();
    }

    // إشعار المستمعين
    this.listeners.forEach(listener => listener(stats));

    // تنظيف إذا تجاوز الحد المسموح
    if (stats.used > this.options.memoryThreshold) {
      console.warn(`🚨 Memory usage high: ${stats.used}MB (${stats.percentage.toFixed(1)}%)`);
      this.performCleanup();
    }

    return stats;
  }

  /**
   * حساب اتجاه استخدام الذاكرة
   */
  private calculateTrend(currentUsage: number): 'stable' | 'increasing' | 'decreasing' {
    if (this.memoryHistory.length < 3) {
      return 'stable';
    }

    const recent = this.memoryHistory.slice(-3);
    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
    const older = this.memoryHistory.slice(0, -3);
    const avgOlder = older.reduce((a, b) => a + b, 0) / older.length;

    const difference = avgRecent - avgOlder;
    const threshold = currentUsage * 0.05; // 5% threshold

    if (difference > threshold) return 'increasing';
    if (difference < -threshold) return 'decreasing';
    return 'stable';
  }

  /**
   * تنفيذ عمليات التنظيف
   */
  performCleanup(): void {
    console.log('🧹 Starting memory cleanup...');

    try {
      // تنظيف الكاش العمومي
      this.cleanupGlobalCache();
      
      // تنظيف الإشعارات القديمة
      this.cleanupNotifications();
      
      // تنظيف Event Listeners غير المستخدمة
      this.cleanupEventListeners();
      
      // تنظيف DOM العقد المنفصلة
      this.cleanupDetachedNodes();
      
      // إجبار Garbage Collection إذا متوفر
      this.forceGarbageCollection();

      console.log('✅ Memory cleanup completed');
    } catch (error) {
      console.error('❌ Memory cleanup failed:', error);
    }
  }

  /**
   * تنظيف الكاش العمومي
   */
  private cleanupGlobalCache(): void {
    // تنظيف localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('cache_') || key.startsWith('temp_')
      );
      
      cacheKeys.forEach(key => {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          const age = Date.now() - (item.timestamp || 0);
          
          // حذف العناصر الأقدم من ساعة
          if (age > 3600000) {
            localStorage.removeItem(key);
          }
        } catch {
          localStorage.removeItem(key);
        }
      });
    }

    // تنظيف sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const sessionKeys = Object.keys(sessionStorage).filter(key => 
        key.startsWith('temp_')
      );
      sessionKeys.forEach(key => sessionStorage.removeItem(key));
    }
  }

  /**
   * تنظيف الإشعارات القديمة
   */
  private cleanupNotifications(): void {
    // هذا سيتم تنفيذه مع AppStateContext
    if (typeof window !== 'undefined' && (window as any).__APP_STATE__) {
      const appState = (window as any).__APP_STATE__;
      if (appState.notifications?.items?.length > this.options.maxNotifications) {
        console.log(`🗑️ Cleaning up ${appState.notifications.items.length - this.options.maxNotifications} old notifications`);
      }
    }
  }

  /**
   * تنظيف Event Listeners غير المستخدمة
   */
  private cleanupEventListeners(): void {
    // إزالة listeners الخاصة بـ performance monitoring القديمة
    if (typeof window !== 'undefined') {
      const events = ['resize', 'scroll', 'mousemove'];
      events.forEach(event => {
        // الحصول على عدد المستمعين
        const listeners = (window as any).getEventListeners?.(window)?.[event];
        if (listeners && listeners.length > 10) {
          console.warn(`⚠️ Too many ${event} listeners: ${listeners.length}`);
        }
      });
    }
  }

  /**
   * تنظيف DOM العقد المنفصلة
   */
  private cleanupDetachedNodes(): void {
    // إزالة العقد المنفصلة من DOM
    if (typeof document !== 'undefined') {
      const detachedNodes = document.querySelectorAll('[data-temp]');
      detachedNodes.forEach(node => {
        if (!node.isConnected) {
          node.remove();
        }
      });
    }
  }

  /**
   * إجبار Garbage Collection
   */
  private forceGarbageCollection(): void {
    if (typeof window !== 'undefined' && (window as any).gc) {
      console.log('🗑️ Forcing garbage collection...');
      (window as any).gc();
    }
  }

  /**
   * إضافة مستمع للذاكرة
   */
  addMemoryListener(listener: (stats: MemoryStats) => void): void {
    this.listeners.add(listener);
  }

  /**
   * إزالة مستمع الذاكرة
   */
  removeMemoryListener(listener: (stats: MemoryStats) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * الحصول على إحصائيات الذاكرة الحالية
   */
  getCurrentStats(): MemoryStats | null {
    return this.checkMemoryUsage();
  }

  /**
   * تعيين خيارات جديدة
   */
  updateOptions(newOptions: Partial<MemoryOptimizationOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * إيقاف المراقبة
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.listeners.clear();
  }

  /**
   * الحصول على تقرير مفصل
   */
  getDetailedReport(): {
    stats: MemoryStats | null;
    history: number[];
    recommendations: string[];
  } {
    const stats = this.getCurrentStats();
    const recommendations: string[] = [];

    if (stats) {
      if (stats.percentage > 80) {
        recommendations.push('🚨 استخدام الذاكرة مرتفع جداً - قم بإغلاق الصفحات غير المستخدمة');
      }
      
      if (stats.trend === 'increasing') {
        recommendations.push('📈 استخدام الذاكرة في ازدياد - تحقق من وجود تسريبات');
      }
      
      if (stats.used > 150) {
        recommendations.push('💾 استخدام الذاكرة مرتفع - فعل التنظيف التلقائي');
      }
    }

    return {
      stats,
      history: this.memoryHistory,
      recommendations
    };
  }
}

// إنشاء مثيل عمومي
export const memoryOptimizer = new MemoryOptimizer({
  memoryThreshold: 200, // زيادة الحد إلى 200MB للتطبيقات المعقدة
  aggressiveCleanup: true,
  maxCacheSize: 50,
  maxNotifications: 25
});

// Hook لاستخدام محسن الذاكرة
export function useMemoryOptimizer() {
  const [stats, setStats] = React.useState<MemoryStats | null>(null);

  React.useEffect(() => {
    const listener = (newStats: MemoryStats) => {
      setStats(newStats);
    };

    memoryOptimizer.addMemoryListener(listener);
    
    // فحص أولي
    const initialStats = memoryOptimizer.getCurrentStats();
    if (initialStats) {
      setStats(initialStats);
    }

    return () => {
      memoryOptimizer.removeMemoryListener(listener);
    };
  }, []);

  return {
    stats,
    performCleanup: () => memoryOptimizer.performCleanup(),
    getReport: () => memoryOptimizer.getDetailedReport()
  };
}

export default memoryOptimizer; 