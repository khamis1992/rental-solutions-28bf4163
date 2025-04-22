// Define metric types
interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

interface AnalyticsOptions {
  debug?: boolean;
  sampleRate?: number;
}

// Extended performance entry types
interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

interface FirstInputEntry extends PerformanceEntry {
  processingStart: number;
  startTime: number;
}

// Performance data observer
class PerformanceObserver {
  private static instance: PerformanceObserver;
  private debug: boolean;
  private sampleRate: number;

  private constructor(options: AnalyticsOptions = {}) {
    this.debug = options.debug || false;
    this.sampleRate = options.sampleRate || 1.0;
  }

  static getInstance(options?: AnalyticsOptions): PerformanceObserver {
    if (!PerformanceObserver.instance) {
      PerformanceObserver.instance = new PerformanceObserver(options);
    }
    return PerformanceObserver.instance;
  }

  private shouldSample(): boolean {
    return Math.random() < this.sampleRate;
  }

  private logMetric(metric: PerformanceMetric) {
    if (this.debug) {
      console.log('[Performance Metric]:', metric);
    }

    try {
      const metrics = JSON.parse(localStorage.getItem('performance_metrics') || '{}');
      metrics[metric.name] = metric.value;
      localStorage.setItem('performance_metrics', JSON.stringify(metrics));
    } catch (error) {
      console.error('Failed to store performance metric:', error);
    }
  }

  startMonitoring(): void {
    if (!this.shouldSample() || typeof window === 'undefined') return;

    // Observe paint timing
    if ('PerformanceObserver' in window) {
      // First Contentful Paint
      const paintObserver = new window.PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.logMetric({
              name: 'FCP',
              value: entry.startTime,
              rating: entry.startTime < 1800 ? 'good' : entry.startTime < 3000 ? 'needs-improvement' : 'poor'
            });
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      const lcpObserver = new window.PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.logMetric({
            name: 'LCP',
            value: lastEntry.startTime,
            rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor'
          });
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Cumulative Layout Shift
      const clsObserver = new window.PerformanceObserver((entryList) => {
        let clsValue = 0;
        for (const entry of entryList.getEntries()) {
          const layoutShiftEntry = entry as LayoutShiftEntry;
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
          }
        }
        this.logMetric({
          name: 'CLS',
          value: clsValue,
          rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor'
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // First Input Delay
      const fidObserver = new window.PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const firstInputEntry = entry as FirstInputEntry;
          this.logMetric({
            name: 'FID',
            value: firstInputEntry.processingStart - firstInputEntry.startTime,
            rating: entry.duration < 100 ? 'good' : entry.duration < 300 ? 'needs-improvement' : 'poor'
          });
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    }

    // Navigation Timing API for TTFB
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.requestStart;
      this.logMetric({
        name: 'TTFB',
        value: ttfb,
        rating: ttfb < 600 ? 'good' : ttfb < 1800 ? 'needs-improvement' : 'poor'
      });
    }

    // Monitor route changes
    let lastNavigationStart = performance.now();
    window.addEventListener('popstate', () => {
      this.measurePageTransition(lastNavigationStart);
      lastNavigationStart = performance.now();
    });
  }

  private measurePageTransition(startTime: number): void {
    const duration = performance.now() - startTime;
    this.logMetric({
      name: 'page-transition',
      value: duration,
      rating: duration < 100 ? 'good' : duration < 300 ? 'needs-improvement' : 'poor'
    });
  }

  getMetrics(): Record<string, number> {
    try {
      return JSON.parse(localStorage.getItem('performance_metrics') || '{}');
    } catch {
      return {};
    }
  }
}

export function initializePerformanceMonitoring(options?: AnalyticsOptions): void {
  const observer = PerformanceObserver.getInstance(options);
  observer.startMonitoring();
}

export function getPerformanceMetrics(): Record<string, number> {
  return PerformanceObserver.getInstance().getMetrics();
}