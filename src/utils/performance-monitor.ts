interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
  cacheHitRate: number;
}

interface PerformanceThresholds {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds = {
    loadTime: 2000, // 2 seconds
    renderTime: 100, // 100ms
    memoryUsage: 100 * 1024 * 1024, // 100MB
    bundleSize: 2 * 1024 * 1024, // 2MB
  };

  /**
   * قياس وقت تحميل الصفحة
   */
  measurePageLoad(): number {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return navigation.loadEventEnd - navigation.fetchStart;
  }

  /**
   * قياس وقت عرض المكون
   */
  measureComponentRender(componentName: string, renderFn: () => void): number {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    this.logMetric('component_render', {
      component: componentName,
      renderTime,
      timestamp: Date.now()
    });

    return renderTime;
  }

  /**
   * قياس استخدام الذاكرة
   */
  measureMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * مراقبة أداء الشبكة
   */
  monitorNetworkPerformance(): void {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.logMetric('network_request', {
            url: resourceEntry.name,
            duration: resourceEntry.duration,
            size: resourceEntry.transferSize,
            timestamp: Date.now()
          });
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  /**
   * تسجيل المقاييس
   */
  private logMetric(type: string, data: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${type}:`, data);
    }

    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(type, data);
    }
  }

  /**
   * إرسال المقاييس إلى خدمة التحليلات
   */
  private async sendToAnalytics(type: string, data: any): Promise<void> {
    try {
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (error) {
    }
  }

  /**
   * فحص الحدود المسموحة للأداء
   */
  checkPerformanceThresholds(): boolean {
    const loadTime = this.measurePageLoad();
    const memoryUsage = this.measureMemoryUsage();

    const violations = [];

    if (loadTime > this.thresholds.loadTime) {
      violations.push(`Load time exceeded: ${loadTime}ms > ${this.thresholds.loadTime}ms`);
    }

    if (memoryUsage > this.thresholds.memoryUsage) {
      violations.push(`Memory usage exceeded: ${memoryUsage} > ${this.thresholds.memoryUsage}`);
    }

    if (violations.length > 0) {
      this.logMetric('performance_violation', { violations });
      return false;
    }

    return true;
  }

  /**
   * الحصول على تقرير الأداء
   */
  getPerformanceReport(): any {
    return {
      loadTime: this.measurePageLoad(),
      memoryUsage: this.measureMemoryUsage(),
      timestamp: Date.now(),
      thresholds: this.thresholds,
      violations: this.checkPerformanceThresholds() ? [] : ['Performance thresholds exceeded']
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

export function withPerformanceMonitoring<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: T) {
    React.useEffect(() => {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        performanceMonitor.measureComponentRender(componentName, () => {});
      };
    }, []);

    return React.createElement(WrappedComponent, props);
  };
}
