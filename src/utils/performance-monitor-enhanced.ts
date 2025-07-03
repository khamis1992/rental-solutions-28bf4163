/**
 * نظام مراقبة الأداء المحسن
 * Enhanced Performance Monitoring System
 */

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  memoryUsage: number;
  reRenderCount: number;
  lastUpdate: number;
  isOptimized: boolean;
}

interface SystemMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

interface OptimizationSuggestion {
  component: string;
  issue: string;
  solution: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  impact: number; // Expected performance improvement (%)
}

class EnhancedPerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private systemMetrics: SystemMetrics = { fcp: 0, lcp: 0, fid: 0, cls: 0, ttfb: 0 };
  private observers: PerformanceObserver[] = [];
  private suggestions: OptimizationSuggestion[] = [];
  private isMonitoring = false;
  private reportInterval?: number;

  constructor() {
    this.initializeMonitoring();
  }

  /**
   * تهيئة نظام المراقبة
   */
  private initializeMonitoring(): void {
    if (typeof window === 'undefined') return;

    // مراقبة Web Vitals
    this.observeWebVitals();
    
    // مراقبة أداء المكونات
    this.observeComponentPerformance();
    
    // مراقبة الذاكرة
    this.observeMemoryUsage();
    
    // بدء التقارير الدورية
    this.startPeriodicReporting();
    
    this.isMonitoring = true;
    console.log('🚀 Enhanced Performance Monitor initialized');
  }

  /**
   * مراقبة Web Vitals
   */
  private observeWebVitals(): void {
    try {
      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            this.systemMetrics.fcp = entry.startTime;
            this.analyzeMetric('FCP', entry.startTime, 1800); // Good: < 1.8s
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.systemMetrics.lcp = lastEntry.startTime;
          this.analyzeMetric('LCP', lastEntry.startTime, 2500); // Good: < 2.5s
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
                     const fid = (entry as any).processingStart - entry.startTime;
          this.systemMetrics.fid = fid;
          this.analyzeMetric('FID', fid, 100); // Good: < 100ms
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        this.systemMetrics.cls = clsValue;
        this.analyzeMetric('CLS', clsValue, 0.1); // Good: < 0.1
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

    } catch (error) {
      console.warn('Web Vitals monitoring not supported:', error);
    }
  }

  /**
   * مراقبة أداء المكونات
   */
  private observeComponentPerformance(): void {
    try {
      const measureObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name.startsWith('React-')) {
            const componentName = entry.name.replace('React-', '');
            this.recordComponentMetric(componentName, entry.duration);
          }
        });
      });
      measureObserver.observe({ entryTypes: ['measure'] });
      this.observers.push(measureObserver);
    } catch (error) {
      console.warn('Component performance monitoring not supported:', error);
    }
  }

  /**
   * مراقبة استخدام الذاكرة
   */
  private observeMemoryUsage(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        if (usagePercent > 80) {
          this.addSuggestion({
            component: 'System',
            issue: 'استهلاك ذاكرة عالي',
            solution: 'تنظيف الذاكرة وإزالة المراجع غير المستخدمة',
            priority: 'high',
            impact: 25
          });
        }
      }, 10000); // كل 10 ثوانٍ
    }
  }

  /**
   * تسجيل مقياس أداء مكون
   */
  recordComponentMetric(componentName: string, renderTime: number): void {
    const existing = this.metrics.get(componentName);
    const memoryUsage = this.getCurrentMemoryUsage();
    
    const metrics: PerformanceMetrics = {
      componentName,
      renderTime,
      memoryUsage,
      reRenderCount: existing ? existing.reRenderCount + 1 : 1,
      lastUpdate: Date.now(),
      isOptimized: renderTime < 16 // 60fps target
    };

    this.metrics.set(componentName, metrics);
    
    // تحليل الأداء وإضافة اقتراحات
    this.analyzeComponentPerformance(metrics);
  }

  /**
   * تحليل أداء مكون
   */
  private analyzeComponentPerformance(metrics: PerformanceMetrics): void {
    const { componentName, renderTime, reRenderCount } = metrics;

    // فحص بطء العرض
    if (renderTime > 50) {
      this.addSuggestion({
        component: componentName,
        issue: `عرض بطيء: ${renderTime.toFixed(2)}ms`,
        solution: 'استخدم React.memo, useMemo, أو useCallback',
        priority: renderTime > 100 ? 'critical' : 'high',
        impact: Math.min((renderTime / 16) * 10, 50)
      });
    }

    // فحص إعادة العرض المفرط
    if (reRenderCount > 10) {
      this.addSuggestion({
        component: componentName,
        issue: `إعادة عرض مفرطة: ${reRenderCount} مرة`,
        solution: 'تحقق من dependencies وoptimize state management',
        priority: reRenderCount > 20 ? 'high' : 'medium',
        impact: Math.min((reRenderCount / 5) * 10, 30)
      });
    }
  }

  /**
   * تحليل مقياس النظام
   */
  private analyzeMetric(metric: string, value: number, threshold: number): void {
    if (value > threshold) {
      let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
      let impact = 10;

      if (value > threshold * 2) {
        priority = 'critical';
        impact = 40;
      } else if (value > threshold * 1.5) {
        priority = 'high';
        impact = 25;
      }

      const solutions: Record<string, string> = {
        FCP: 'تحسين Critical CSS وتأجيل JavaScript غير الضروري',
        LCP: 'تحسين تحميل الصور الرئيسية وتقليل حجم البيانات',
        FID: 'تقليل JavaScript الثقيل وتحسين event handlers',
        CLS: 'تحديد أبعاد الصور والعناصر وتجنب DOM injection'
      };

      this.addSuggestion({
        component: 'System',
        issue: `${metric} سيء: ${value.toFixed(2)}${metric === 'CLS' ? '' : 'ms'}`,
        solution: solutions[metric] || 'تحسين عام للأداء',
        priority,
        impact
      });
    }
  }

  /**
   * إضافة اقتراح تحسين
   */
  private addSuggestion(suggestion: OptimizationSuggestion): void {
    // تجنب التكرار
    const exists = this.suggestions.some(s => 
      s.component === suggestion.component && s.issue === suggestion.issue
    );
    
    if (!exists) {
      this.suggestions.push(suggestion);
      
      // إبقاء فقط أحدث 20 اقتراح
      if (this.suggestions.length > 20) {
        this.suggestions = this.suggestions
          .sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority))
          .slice(0, 20);
      }
    }
  }

  /**
   * الحصول على نقاط الأولوية
   */
  private getPriorityScore(priority: string): number {
    const scores = { critical: 4, high: 3, medium: 2, low: 1 };
    return scores[priority as keyof typeof scores] || 1;
  }

  /**
   * الحصول على استخدام الذاكرة الحالي
   */
  private getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  /**
   * بدء التقارير الدورية
   */
  private startPeriodicReporting(): void {
    this.reportInterval = window.setInterval(() => {
      this.generatePerformanceReport();
    }, 60000); // كل دقيقة
  }

  /**
   * توليد تقرير الأداء
   */
  generatePerformanceReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      systemMetrics: this.systemMetrics,
      componentMetrics: Array.from(this.metrics.values()),
      suggestions: this.suggestions.slice(0, 5), // أهم 5 اقتراحات
      summary: this.generateSummary()
    };

    const arabicReport = `
# تقرير أداء النظام - ${new Date().toLocaleString('ar-SA')}

## مؤشرات الأداء الرئيسية
- First Contentful Paint: ${this.systemMetrics.fcp.toFixed(2)}ms ${this.getStatusEmoji(this.systemMetrics.fcp, 1800)}
- Largest Contentful Paint: ${this.systemMetrics.lcp.toFixed(2)}ms ${this.getStatusEmoji(this.systemMetrics.lcp, 2500)}
- First Input Delay: ${this.systemMetrics.fid.toFixed(2)}ms ${this.getStatusEmoji(this.systemMetrics.fid, 100)}
- Cumulative Layout Shift: ${this.systemMetrics.cls.toFixed(3)} ${this.getStatusEmoji(this.systemMetrics.cls, 0.1)}

## أداء المكونات
${Array.from(this.metrics.values()).slice(0, 5).map(metric => 
  `- ${metric.componentName}: ${metric.renderTime.toFixed(2)}ms (${metric.reRenderCount} إعادة عرض) ${metric.isOptimized ? '✅' : '⚠️'}`
).join('\n')}

## الاقتراحات الهامة
${this.suggestions.slice(0, 3).map((suggestion, i) => 
  `${i + 1}. ${suggestion.component}: ${suggestion.issue}
   الحل: ${suggestion.solution}
   التأثير المتوقع: ${suggestion.impact}% تحسن`
).join('\n\n')}

## الملخص
${report.summary}
    `;

    console.log(arabicReport);
    return arabicReport;
  }

  /**
   * توليد ملخص الأداء
   */
  private generateSummary(): string {
    const totalComponents = this.metrics.size;
    const optimizedComponents = Array.from(this.metrics.values())
      .filter(m => m.isOptimized).length;
    const criticalIssues = this.suggestions
      .filter(s => s.priority === 'critical').length;

    const optimizationRate = totalComponents > 0 ? 
      (optimizedComponents / totalComponents * 100).toFixed(1) : '0';

    return `النظام يحتوي على ${totalComponents} مكون، منها ${optimizedComponents} محسن (${optimizationRate}%). يوجد ${criticalIssues} مشكلة حرجة تتطلب اهتماماً فورياً.`;
  }

  /**
   * الحصول على رمز تعبيري للحالة
   */
  private getStatusEmoji(value: number, threshold: number): string {
    if (value <= threshold) return '✅';
    if (value <= threshold * 1.5) return '⚠️';
    return '❌';
  }

  /**
   * الحصول على أفضل الاقتراحات
   */
  getTopSuggestions(count = 5): OptimizationSuggestion[] {
    return this.suggestions
      .sort((a, b) => {
        const priorityDiff = this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority);
        if (priorityDiff !== 0) return priorityDiff;
        return b.impact - a.impact;
      })
      .slice(0, count);
  }

  /**
   * الحصول على مقاييس مكون محدد
   */
  getComponentMetrics(componentName: string): PerformanceMetrics | undefined {
    return this.metrics.get(componentName);
  }

  /**
   * تنظيف المراقبة
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }
    
    this.isMonitoring = false;
    console.log('🛑 Performance Monitor cleaned up');
  }

  /**
   * إعادة تعيين المقاييس
   */
  reset(): void {
    this.metrics.clear();
    this.suggestions = [];
    this.systemMetrics = { fcp: 0, lcp: 0, fid: 0, cls: 0, ttfb: 0 };
    console.log('🔄 Performance metrics reset');
  }

  /**
   * الحصول على حالة المراقبة
   */
  isActive(): boolean {
    return this.isMonitoring;
  }
}

// إنشاء instance عام
export const enhancedPerformanceMonitor = new EnhancedPerformanceMonitor();

// React Hook للاستخدام في المكونات
export const useEnhancedPerformanceMonitor = (componentName: string) => {
  const startTime = performance.now();
  
  return {
    recordRender: () => {
      const renderTime = performance.now() - startTime;
      enhancedPerformanceMonitor.recordComponentMetric(componentName, renderTime);
    },
    getMetrics: () => enhancedPerformanceMonitor.getComponentMetrics(componentName),
    getSuggestions: () => enhancedPerformanceMonitor.getTopSuggestions(),
    generateReport: () => enhancedPerformanceMonitor.generatePerformanceReport()
  };
};

export default EnhancedPerformanceMonitor;