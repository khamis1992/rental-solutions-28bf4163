/**
 * نظام تحسين الأداء الشامل
 * Comprehensive Performance Optimization System
 */

interface PerformanceConfig {
  enableLazyLoading: boolean;
  enableCodeSplitting: boolean;
  enablePreloading: boolean;
  enableServiceWorker: boolean;
  enableImageOptimization: boolean;
  enableBundleAnalysis: boolean;
  cacheStrategy: 'aggressive' | 'conservative' | 'smart';
  loadingPriority: 'critical' | 'high' | 'normal' | 'low';
}

interface ComponentPerformanceMetrics {
  loadTime: number;
  renderTime: number;
  bundleSize: number;
  cacheHitRate: number;
  memoryUsage: number;
}

class PerformanceOptimizer {
  private config: PerformanceConfig;
  private metrics: Map<string, ComponentPerformanceMetrics> = new Map();
  private loadingQueue: Array<() => Promise<any>> = [];
  private criticalResources: Set<string> = new Set();

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableLazyLoading: true,
      enableCodeSplitting: true,
      enablePreloading: true,
      enableServiceWorker: true,
      enableImageOptimization: true,
      enableBundleAnalysis: false,
      cacheStrategy: 'smart',
      loadingPriority: 'high',
      ...config
    };
    this.initialize();
  }

  private initialize() {
    if (this.config.enablePreloading) {
      this.preloadCriticalResources();
    }
    if (this.config.enableServiceWorker) {
      this.registerServiceWorker();
    }
    this.setupPerformanceMonitoring();
  }

  // تحميل المكونات الحساسة مسبقاً
  preloadCriticalResources() {
    const criticalRoutes = [
      'dashboard',
      'agreements', 
      'customers'
    ];

    criticalRoutes.forEach(route => {
      this.criticalResources.add(route);
    });

    // تحميل خطوط مهمة
    this.preloadFonts(['Amiri', 'Inter']);
    
    // تحميل CSS الأساسية
    this.preloadCSS(['/src/styles/arabic-rtl-dashboard.css']);
  }

  private preloadFonts(fonts: string[]) {
    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  private preloadCSS(cssFiles: string[]) {
    cssFiles.forEach(css => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = css;
      document.head.appendChild(link);
    });
  }

  private registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => {
          console.log('🚀 Service Worker registered successfully');
        })
        .catch(error => {
          console.warn('⚠️ Service Worker registration failed:', error);
        });
    }
  }

  // نظام مراقبة الأداء
  setupPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          console.log('🎯 Performance:', entry.name, entry.duration + 'ms');
        });
      });
      
      try {
        observer.observe({ entryTypes: ['navigation', 'measure'] });
      } catch (e) {
        console.warn('Performance Observer not supported');
      }
    }

    // مراقبة استخدام الذاكرة
    this.monitorMemoryUsage();
  }

  private monitorMemoryUsage() {
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      console.log('💾 Memory Usage:', {
        used: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024) + 'MB',
        limit: Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024) + 'MB'
      });
    }
  }

  // تحسين تحميل الصور
  optimizeImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || '';
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback للمتصفحات القديمة
      images.forEach(img => {
        const imgElement = img as HTMLImageElement;
        imgElement.src = imgElement.dataset.src || '';
      });
    }
  }

  // نظام تجميع الاستعلامات
  async batchRequests(requests: Array<() => Promise<any>>, batchSize = 3) {
    const batches = [];
    for (let i = 0; i < requests.length; i += batchSize) {
      batches.push(requests.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      await Promise.all(batch.map(request => request()));
    }
  }

  // تحسين React Query
  optimizeReactQuery() {
    return {
      staleTime: 5 * 60 * 1000, // 5 دقائق
      cacheTime: 10 * 60 * 1000, // 10 دقائق
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    };
  }

  // قياس أداء المكونات
  measureComponentPerformance(componentName: string, renderFn: () => void) {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    
    const metrics: ComponentPerformanceMetrics = {
      loadTime: endTime - startTime,
      renderTime: endTime - startTime,
      bundleSize: 0, // سيتم حسابه لاحقاً
      cacheHitRate: 0,
      memoryUsage: 0
    };

    this.metrics.set(componentName, metrics);
    console.log(`🔍 ${componentName} render time: ${metrics.renderTime.toFixed(2)}ms`);
  }

  // تحسين تحميل المسارات
  optimizeRouteLoading() {
    return {
      // تحميل بطيء للمسارات غير الحساسة
      lazyRoutes: [
        'settings',
        'reports',
        'maintenance',
        'legal',
        'financials'
      ],
      // تحميل مسبق للمسارات الحساسة
      preloadRoutes: [
        'dashboard',
        'agreements',
        'customers',
        'vehicles'
      ]
    };
  }

  // تحسين Bundle Size
  analyzeBundleSize() {
    if (this.config.enableBundleAnalysis) {
      console.log('📊 Bundle Analysis enabled - check webpack-bundle-analyzer');
    }
  }

  // إعدادات التخزين المؤقت الذكي
  getSmartCacheConfig() {
    return {
      // استراتيجية التخزين المؤقت
      strategy: this.config.cacheStrategy,
      
      // مدة التخزين المؤقت حسب نوع البيانات
      durations: {
        static: 24 * 60 * 60 * 1000, // 24 ساعة
        api: 5 * 60 * 1000,          // 5 دقائق
        user: 15 * 60 * 1000,        // 15 دقيقة
      },

      // أولويات التحميل
      priorities: {
        critical: ['auth', 'dashboard'],
        high: ['agreements', 'customers'],
        normal: ['vehicles', 'payments'],
        low: ['reports', 'settings']
      }
    };
  }

  // تحسين أداء التطبيق بشكل عام
  optimize() {
    console.log('🚀 Starting Performance Optimization...');
    
    // تحسين الصور
    this.optimizeImages();
    
    // تحليل حجم Bundle
    this.analyzeBundleSize();
    
    // إعداد مراقبة الأداء
    this.setupPerformanceMonitoring();
    
    console.log('✅ Performance Optimization completed');
    
    return {
      reactQueryConfig: this.optimizeReactQuery(),
      routeConfig: this.optimizeRouteLoading(),
      cacheConfig: this.getSmartCacheConfig()
    };
  }

  // الحصول على تقرير الأداء
  getPerformanceReport() {
    return {
      metrics: Object.fromEntries(this.metrics),
      config: this.config,
      criticalResources: Array.from(this.criticalResources),
      loadingQueue: this.loadingQueue.length
    };
  }
}

// إنشاء مثيل عام للنظام
export const performanceOptimizer = new PerformanceOptimizer();

// Hook للاستخدام في React
export const usePerformanceOptimization = () => {
  return {
    measureRender: (componentName: string, renderFn: () => void) => 
      performanceOptimizer.measureComponentPerformance(componentName, renderFn),
    
    optimizeComponent: () => performanceOptimizer.optimize(),
    
    getReport: () => performanceOptimizer.getPerformanceReport(),
    
    batchRequests: (requests: Array<() => Promise<any>>) => 
      performanceOptimizer.batchRequests(requests)
  };
};

export default PerformanceOptimizer; 