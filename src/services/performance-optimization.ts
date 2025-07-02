import { performanceAnalytics } from './performance-analytics';

export interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  type: 'caching' | 'lazy_loading' | 'code_splitting' | 'compression' | 'prefetching';
  priority: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  config: any;
  impact: {
    loadTime: number; // percentage improvement
    memoryUsage: number;
    bundleSize: number;
  };
  implementation: string;
}

export interface CacheStrategy {
  id: string;
  name: string;
  type: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB' | 'serviceWorker';
  ttl: number; // time to live in milliseconds
  maxSize: number; // maximum cache size
  compression: boolean;
  encryption: boolean;
  patterns: string[]; // URL patterns to cache
}

export interface LazyLoadConfig {
  components: string[];
  routes: string[];
  images: boolean;
  threshold: number; // intersection observer threshold
  rootMargin: string;
}

export interface CodeSplitConfig {
  chunks: {
    name: string;
    modules: string[];
    priority: number;
  }[];
  dynamicImports: string[];
  vendorSeparation: boolean;
}

export interface PerformanceMetrics {
  bundleSize: {
    total: number;
    chunks: Record<string, number>;
    compression: number;
  };
  loadTimes: {
    initial: number;
    chunks: Record<string, number>;
    resources: Record<string, number>;
  };
  cacheHitRates: Record<string, number>;
  memoryUsage: {
    heap: number;
    components: Record<string, number>;
  };
}

class PerformanceOptimizationService {
  private optimizationRules: OptimizationRule[] = [];
  private cacheStrategies: CacheStrategy[] = [];
  private lazyLoadConfig: LazyLoadConfig;
  private codeSplitConfig: CodeSplitConfig;
  private metrics: PerformanceMetrics;
  private observers: Map<string, IntersectionObserver> = new Map();
  private caches: Map<string, Map<string, any>> = new Map();

  constructor() {
    this.initializeDefaultRules();
    this.initializeDefaultCacheStrategies();
    this.initializeLazyLoading();
    this.initializeCodeSplitting();
    this.initializeMetrics();
    this.startPerformanceMonitoring();
  }

  private initializeDefaultRules(): void {
    this.optimizationRules = [
      {
        id: 'lazy-load-components',
        name: 'Lazy Load Components',
        description: 'Load components only when needed to reduce initial bundle size',
        type: 'lazy_loading',
        priority: 'high',
        isActive: true,
        config: {
          threshold: 0.1,
          rootMargin: '50px'
        },
        impact: {
          loadTime: 30,
          memoryUsage: 25,
          bundleSize: 40
        },
        implementation: 'React.lazy() with Suspense boundaries'
      },
      {
        id: 'api-response-caching',
        name: 'API Response Caching',
        description: 'Cache API responses to reduce server requests',
        type: 'caching',
        priority: 'high',
        isActive: true,
        config: {
          ttl: 300000, // 5 minutes
          maxSize: 100,
          patterns: ['/api/customers', '/api/vehicles', '/api/agreements']
        },
        impact: {
          loadTime: 50,
          memoryUsage: -10, // slight increase
          bundleSize: 0
        },
        implementation: 'Memory cache with TTL and LRU eviction'
      },
      {
        id: 'image-optimization',
        name: 'Image Optimization',
        description: 'Lazy load images and use modern formats',
        type: 'lazy_loading',
        priority: 'medium',
        isActive: true,
        config: {
          formats: ['webp', 'avif'],
          quality: 80,
          responsive: true
        },
        impact: {
          loadTime: 20,
          memoryUsage: 15,
          bundleSize: 0
        },
        implementation: 'Intersection Observer with modern image formats'
      },
      {
        id: 'code-splitting',
        name: 'Route-based Code Splitting',
        description: 'Split code by routes to reduce initial bundle',
        type: 'code_splitting',
        priority: 'high',
        isActive: true,
        config: {
          strategy: 'route-based',
          preload: ['dashboard', 'customers']
        },
        impact: {
          loadTime: 35,
          memoryUsage: 20,
          bundleSize: 45
        },
        implementation: 'Dynamic imports with route-based chunks'
      },
      {
        id: 'resource-prefetching',
        name: 'Resource Prefetching',
        description: 'Prefetch likely-to-be-needed resources',
        type: 'prefetching',
        priority: 'medium',
        isActive: true,
        config: {
          routes: ['/dashboard', '/customers'],
          components: ['CustomerForm', 'AgreementTable'],
          timing: 'idle'
        },
        impact: {
          loadTime: 25,
          memoryUsage: -5,
          bundleSize: 0
        },
        implementation: 'Intersection Observer and requestIdleCallback'
      },
      {
        id: 'compression',
        name: 'Asset Compression',
        description: 'Compress JavaScript, CSS, and other assets',
        type: 'compression',
        priority: 'high',
        isActive: true,
        config: {
          algorithms: ['gzip', 'brotli'],
          level: 9,
          threshold: 1024
        },
        impact: {
          loadTime: 40,
          memoryUsage: 0,
          bundleSize: 60
        },
        implementation: 'Build-time compression with multiple algorithms'
      }
    ];
  }

  private initializeDefaultCacheStrategies(): void {
    this.cacheStrategies = [
      {
        id: 'api-cache',
        name: 'API Response Cache',
        type: 'memory',
        ttl: 300000, // 5 minutes
        maxSize: 100,
        compression: true,
        encryption: false,
        patterns: ['/api/*']
      },
      {
        id: 'static-assets',
        name: 'Static Assets Cache',
        type: 'serviceWorker',
        ttl: // 86400000 - removed unused variable// 24 hours
        maxSize: 500,
        compression: true,
        encryption: false,
        patterns: ['*.js', '*.css', '*.png', '*.jpg', '*.svg']
      },
      {
        id: 'user-preferences',
        name: 'User Preferences Cache',
        type: 'localStorage',
        ttl: // 2592000000 - removed unused variable// 30 days
        maxSize: 50,
        compression: false,
        encryption: true,
        patterns: ['/api/user/preferences', '/api/user/settings']
      },
      {
        id: 'session-data',
        name: 'Session Data Cache',
        type: 'sessionStorage',
        ttl: // 3600000 - removed unused variable// 1 hour
        maxSize: 20,
        compression: false,
        encryption: true,
        patterns: ['/api/auth/*', '/api/session/*']
      }
    ];

    // Initialize cache instances
    this.cacheStrategies.forEach(strategy => {
      this.caches.set(strategy.id, new Map());
    });
  }

  private initializeLazyLoading(): void {
    this.lazyLoadConfig = {
      components: [
        'PerformanceDashboard',
        'UserBehaviorAnalytics',
        'AIInsightsDashboard',
        'ReportingDashboard',
        'CustomerForm',
        'AgreementDetails',
        'PaymentTable',
        'VehicleManagement'
      ],
      routes: [
        '/analytics',
        '/reports',
        '/ai-insights',
        '/customers/new',
        '/agreements/details',
        '/payments',
        '/vehicles'
      ],
      images: true,
      threshold: 0.1,
      rootMargin: '50px'
    };

    this.setupImageLazyLoading();
  }

  private initializeCodeSplitting(): void {
    this.codeSplitConfig = {
      chunks: [
        {
          name: 'vendor',
          modules: ['react', 'react-dom', 'react-router-dom'],
          priority: 10
        },
        {
          name: 'ui',
          modules: ['@/components/ui/*'],
          priority: 8
        },
        {
          name: 'analytics',
          modules: ['@/components/analytics/*', '@/services/ai-analytics'],
          priority: 6
        },
        {
          name: 'reports',
          modules: ['@/components/reports/*', '@/services/advanced-reporting'],
          priority: 5
        },
        {
          name: 'charts',
          modules: ['recharts', '@/components/analytics/PerformanceChart'],
          priority: 4
        }
      ],
      dynamicImports: [
        '@/components/analytics/PerformanceChart',
        '@/components/analytics/UserBehaviorAnalytics',
        '@/components/analytics/AIInsightsDashboard',
        '@/components/reports/ReportingDashboard'
      ],
      vendorSeparation: true
    };
  }

  private initializeMetrics(): void {
    this.metrics = {
      bundleSize: {
        total: 0,
        chunks: {},
        compression: 0
      },
      loadTimes: {
        initial: 0,
        chunks: {},
        resources: {}
      },
      cacheHitRates: {},
      memoryUsage: {
        heap: 0,
        components: {}
      }
    };
  }

  private startPerformanceMonitoring(): void {
    // Monitor performance metrics every 30 seconds
    setInterval(() => {
      this.updateMetrics();
    }, 30000);

    // Initial metrics collection
    setTimeout(() => this.updateMetrics(), 1000);
  }

  private updateMetrics(): void {
    // Update memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage.heap = memory.usedJSHeapSize;
    }

    // Update cache hit rates
    this.cacheStrategies.forEach(strategy => {
      const cache = this.caches.get(strategy.id);
      if (cache) {
        const hits = Array.from(cache.values()).filter(item => item.hits > 0).length;
        this.metrics.cacheHitRates[strategy.id] = cache.size > 0 ? (hits / cache.size) * 100 : 0;
      }
    });

    // Track performance improvements
    performanceAnalytics.recordMetric({
      name: 'Optimization Impact',
      value: this.calculateOptimizationImpact(),
      unit: 'score',
      category: 'performance',
      tags: { type: 'optimization' }
    });
  }

  private calculateOptimizationImpact(): number {
    const activeRules = this.optimizationRules.filter(rule => rule.isActive);
    const totalImpact = activeRules.reduce((sum, rule) => {
      const weight = rule.priority === 'critical' ? 4 : 
                    rule.priority === 'high' ? 3 : 
                    rule.priority === 'medium' ? 2 : 1;
      return sum + (rule.impact.loadTime * weight);
    }, 0);

    return Math.min(100, totalImpact / activeRules.length);
  }

  private setupImageLazyLoading(): void {
    if (!('IntersectionObserver' in window)) return;

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    }, {
      threshold: this.lazyLoadConfig.threshold,
      rootMargin: this.lazyLoadConfig.rootMargin
    });

    this.observers.set('images', imageObserver);

    // Observe existing images
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  // Public API methods
  async optimizeComponent(componentName: string): Promise<void> {
    // Implement component-specific optimizations
    const rule = this.optimizationRules.find(r => 
      r.type === 'lazy_loading' && r.config.components?.includes(componentName)
    );

    if (rule && rule.isActive) {
      // Apply lazy loading optimization
      await this.applyLazyLoading(componentName);
    }
  }

  private async applyLazyLoading(componentName: string): Promise<void> {
    // In a real implementation, this would dynamically import the component
    try {
      const module = await import(`@/components/${componentName}`);
      
      // Track successful lazy load
      performanceAnalytics.recordMetric({
        name: 'Lazy Load Success',
        value: 1,
        unit: 'count',
        category: 'performance',
        tags: { component: componentName }
      });

      return module.default;
    } catch (error) {
      console.error(`Failed to lazy load component ${componentName}:`, error);
      
      // Track failed lazy load
      performanceAnalytics.recordMetric({
        name: 'Lazy Load Error',
        value: 1,
        unit: 'count',
        category: 'performance',
        tags: { component: componentName }
      });
    }
  }

  cacheData(key: string, data: any, strategyId: string = 'api-cache'): void {
    const strategy = this.cacheStrategies.find(s => s.id === strategyId);
    const cache = this.caches.get(strategyId);
    
    if (!strategy || !cache) return;

    // Check cache size limit
    if (cache.size >= strategy.maxSize) {
      // Remove oldest entry (LRU)
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    const cacheEntry = {
      data: strategy.compression ? this.compress(data) : data,
      timestamp: Date.now(),
      ttl: strategy.ttl,
      hits: 0,
      encrypted: strategy.encryption
    };

    if (strategy.encryption) {
      cacheEntry.data = this.encrypt(cacheEntry.data);
    }

    cache.set(key, cacheEntry);
  }

  getCachedData(key: string, strategyId: string = 'api-cache'): any | null {
    const strategy = this.cacheStrategies.find(s => s.id === strategyId);
    const cache = this.caches.get(strategyId);
    
    if (!strategy || !cache) return null;

    const entry = cache.get(key);
    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      cache.delete(key);
      return null;
    }

    // Increment hit counter
    entry.hits++;

    let data = entry.data;
    
    if (entry.encrypted) {
      data = this.decrypt(data);
    }
    
    if (strategy.compression) {
      data = this.decompress(data);
    }

    return data;
  }

  clearCache(strategyId?: string): void {
    if (strategyId) {
      const cache = this.caches.get(strategyId);
      if (cache) cache.clear();
    } else {
      this.caches.forEach(cache => cache.clear());
    }
  }

  prefetchResource(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to prefetch ${url}`));
      document.head.appendChild(link);
    });
  }

  preloadComponent(componentName: string): Promise<any> {
    // Preload component for faster subsequent loads
    return this.applyLazyLoading(componentName);
  }

  optimizeImages(container: HTMLElement = document.body): void {
    const images = container.querySelectorAll('img:not([data-optimized])');
    const imageObserver = this.observers.get('images');
    
    if (!imageObserver) return;

    images.forEach(img => {
      const imgElement = img as HTMLImageElement;
      
      // Set up lazy loading
      if (imgElement.src) {
        imgElement.dataset.src = imgElement.src;
        imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNGNUY1RjUiLz48L3N2Zz4=';
      }
      
      imgElement.dataset.optimized = 'true';
      imageObserver.observe(imgElement);
    });
  }

  private compress(data: any): string {
    // Simple compression simulation (in real implementation, use actual compression)
    return JSON.stringify(data);
  }

  private decompress(data: string): any {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  private encrypt(data: any): string {
    // Simple encryption simulation (in real implementation, use actual encryption)
    return btoa(JSON.stringify(data));
  }

  private decrypt(data: string): any {
    try {
      return JSON.parse(atob(data));
    } catch {
      return data;
    }
  }

  // Analytics and reporting
  getOptimizationReport(): {
    rules: OptimizationRule[];
    metrics: PerformanceMetrics;
    recommendations: string[];
    impact: number;
  } {
    const activeRules = this.optimizationRules.filter(rule => rule.isActive);
    const impact = this.calculateOptimizationImpact();
    
    const recommendations: string[] = [];
    
    // Generate recommendations based on metrics
    if (this.metrics.memoryUsage.heap > 100 * 1024 * 1024) { // > 100MB
      recommendations.push('Consider implementing more aggressive lazy loading');
    }
    
    if (Object.values(this.metrics.cacheHitRates).some(rate => rate < 50)) {
      recommendations.push('Optimize cache strategies for better hit rates');
    }
    
    if (impact < 70) {
      recommendations.push('Enable more optimization rules for better performance');
    }

    return {
      rules: activeRules,
      metrics: this.metrics,
      recommendations,
      impact
    };
  }

  toggleOptimizationRule(ruleId: string): boolean {
    const rule = this.optimizationRules.find(r => r.id === ruleId);
    if (!rule) return false;
    
    rule.isActive = !rule.isActive;
    
    // Apply or remove optimization based on new state
    if (rule.isActive) {
      this.applyOptimization(rule);
    } else {
      this.removeOptimization(rule);
    }
    
    return rule.isActive;
  }

  private applyOptimization(rule: OptimizationRule): void {
    switch (rule.type) {
      case 'lazy_loading':
        // Apply lazy loading optimizations
        if (rule.config.components) {
          rule.config.components.forEach((component: string) => {
            this.optimizeComponent(component);
          });
        }
        break;
      
      case 'caching':
        // Apply caching optimizations
        const strategy = this.cacheStrategies.find(s => s.patterns.some(pattern => 
          rule.config.patterns?.includes(pattern)
        ));
        if (strategy) {
          strategy.ttl = rule.config.ttl || strategy.ttl;
          strategy.maxSize = rule.config.maxSize || strategy.maxSize;
        }
        break;
      
      case 'prefetching':
        // Apply prefetching optimizations
        if (rule.config.routes) {
          rule.config.routes.forEach((route: string) => {
            this.prefetchResource(route);
          });
        }
        break;
    }
  }

  private removeOptimization(rule: OptimizationRule): void {
    // Remove optimization effects
    switch (rule.type) {
      case 'caching':
        // Clear related caches
        const relatedStrategy = this.cacheStrategies.find(s => 
          s.patterns.some(pattern => rule.config.patterns?.includes(pattern))
        );
        if (relatedStrategy) {
          this.clearCache(relatedStrategy.id);
        }
        break;
    }
  }

  // Cleanup
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.caches.clear();
    this.optimizationRules = [];
    this.cacheStrategies = [];
  }
}

// Create singleton instance
export const performanceOptimization = new PerformanceOptimizationService();

// Convenience functions
export const optimizeComponent = (componentName: string) => 
  performanceOptimization.optimizeComponent(componentName);

export const cacheApiResponse = (key: string, data: any) => 
  performanceOptimization.cacheData(key, data, 'api-cache');

export const getCachedApiResponse = (key: string) => 
  performanceOptimization.getCachedData(key, 'api-cache');

export const getOptimizationReport = () => 
  performanceOptimization.getOptimizationReport(); 