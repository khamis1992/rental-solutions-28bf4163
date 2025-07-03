/**
 * نظام مراقبة أداء قاعدة البيانات
 * Database Performance Monitoring System
 */

import { supabase } from '@/lib/supabase';

interface QueryPerformance {
  queryName: string;
  executionTime: number;
  rowCount?: number;
  cacheHit: boolean;
  timestamp: Date;
  parameters?: any;
}

interface PerformanceStats {
  totalQueries: number;
  averageTime: number;
  slowQueries: number;
  cacheHitRate: number;
  errorRate: number;
}

class DatabasePerformanceMonitor {
  private queryLog: QueryPerformance[] = [];
  private maxLogSize = 1000;

  /**
   * تسجيل أداء استعلام
   */
  logQuery(performance: QueryPerformance): void {
    this.queryLog.push({
      ...performance,
      timestamp: new Date()
    });

    // الحفاظ على حجم السجل
    if (this.queryLog.length > this.maxLogSize) {
      this.queryLog.shift();
    }

    // تسجيل في قاعدة البيانات إذا كان بطيئاً
    if (performance.executionTime > 1000) { // أكثر من ثانية
      this.logSlowQuery(performance);
    }
  }

  /**
   * تسجيل الاستعلامات البطيئة في قاعدة البيانات
   */
  private async logSlowQuery(performance: QueryPerformance): Promise<void> {
    try {
      await supabase.rpc('log_query_performance', {
        p_query_name: performance.queryName,
        p_execution_time: performance.executionTime,
        p_row_count: performance.rowCount,
        p_cache_hit: performance.cacheHit,
        p_parameters: performance.parameters
      });
    } catch (error) {
      console.warn('Failed to log slow query:', error);
    }
  }

  /**
   * الحصول على إحصائيات الأداء
   */
  getStats(): PerformanceStats {
    if (this.queryLog.length === 0) {
      return {
        totalQueries: 0,
        averageTime: 0,
        slowQueries: 0,
        cacheHitRate: 0,
        errorRate: 0
      };
    }

    const totalTime = this.queryLog.reduce((sum, q) => sum + q.executionTime, 0);
    const slowQueries = this.queryLog.filter(q => q.executionTime > 1000).length;
    const cacheHits = this.queryLog.filter(q => q.cacheHit).length;

    return {
      totalQueries: this.queryLog.length,
      averageTime: totalTime / this.queryLog.length,
      slowQueries,
      cacheHitRate: (cacheHits / this.queryLog.length) * 100,
      errorRate: 0 // سيتم تطبيقه لاحقاً
    };
  }

  /**
   * الحصول على أبطأ الاستعلامات
   */
  getSlowestQueries(limit: number = 10): QueryPerformance[] {
    return [...this.queryLog]
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, limit);
  }

  /**
   * تنظيف السجلات القديمة
   */
  cleanup(): void {
    this.queryLog.length = 0;
  }
}

// Instance مشترك
export const performanceMonitor = new DatabasePerformanceMonitor();

// Helper function لتسجيل أداء الاستعلام
export const logQueryPerformance = (
  queryName: string,
  executionTime: number,
  options?: {
    rowCount?: number;
    cacheHit?: boolean;
    parameters?: any;
  }
) => {
  performanceMonitor.logQuery({
    queryName,
    executionTime,
    rowCount: options?.rowCount,
    cacheHit: options?.cacheHit || false,
    timestamp: new Date(),
    parameters: options?.parameters
  });
};

// Decorator لمراقبة أداء الدوال تلقائياً
export function monitorPerformance(queryName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        const executionTime = Date.now() - startTime;
        
        logQueryPerformance(queryName, executionTime, {
          parameters: args.length > 0 ? args[0] : undefined
        });
        
        return result;
      } catch (error) {
        const executionTime = Date.now() - startTime;
        logQueryPerformance(`${queryName}_ERROR`, executionTime, {
          parameters: args.length > 0 ? args[0] : undefined
        });
        throw error;
      }
    };

    return descriptor;
  };
} 