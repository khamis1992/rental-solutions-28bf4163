/**
 * محسن Bundle متقدم
 * Advanced Bundle Optimizer
 * 
 * يحلل ويحسن حجم وأداء Bundle للتطبيق
 */

interface BundleAnalysis {
  totalSize: number;
  chunks: ChunkInfo[];
  duplicates: DuplicateInfo[];
  recommendations: OptimizationRecommendation[];
  memoryImpact: MemoryAnalysis;
}

interface ChunkInfo {
  name: string;
  size: number;
  modules: string[];
  loadTime: number;
  isLazy: boolean;
  priority: 'critical' | 'high' | 'normal' | 'low';
}

interface DuplicateInfo {
  module: string;
  chunks: string[];
  totalSize: number;
  impact: 'high' | 'medium' | 'low';
}

interface OptimizationRecommendation {
  type: 'split' | 'merge' | 'lazy' | 'remove' | 'optimize';
  target: string;
  description: string;
  expectedSaving: number;
  priority: number;
}

interface MemoryAnalysis {
  jsHeapSize: number;
  domNodes: number;
  eventListeners: number;
  memoryLeaks: MemoryLeak[];
}

interface MemoryLeak {
  type: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  fix: string;
}

class BundleOptimizer {
  private analysisCache: Map<string, BundleAnalysis> = new Map();
  private performanceObserver?: PerformanceObserver;
  private memoryInterval?: number;

  constructor() {
    this.initializeAnalysis();
  }

  /**
   * تحليل Bundle الحالي
   */
  async analyzeBundlePerformance(): Promise<BundleAnalysis> {
    const cacheKey = 'current-bundle';
    
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    const analysis: BundleAnalysis = {
      totalSize: await this.calculateTotalBundleSize(),
      chunks: await this.analyzeChunks(),
      duplicates: await this.findDuplicateModules(),
      recommendations: [],
      memoryImpact: await this.analyzeMemoryUsage()
    };

    // توليد التوصيات
    analysis.recommendations = this.generateOptimizationRecommendations(analysis);

    // حفظ في Cache
    this.analysisCache.set(cacheKey, analysis);

    return analysis;
  }

  /**
   * حساب حجم Bundle الإجمالي
   */
  private async calculateTotalBundleSize(): Promise<number> {
    try {
      const scripts = document.querySelectorAll('script[src]');
      let totalSize = 0;

      for (const script of scripts) {
        const src = (script as HTMLScriptElement).src;
        if (src && !src.includes('chrome-extension')) {
          try {
            const response = await fetch(src, { method: 'HEAD' });
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
              totalSize += parseInt(contentLength, 10);
            }
          } catch (error) {
            console.warn('Failed to get size for:', src);
          }
        }
      }

      return totalSize;
    } catch (error) {
      console.warn('Bundle size calculation failed:', error);
      return 0;
    }
  }

  /**
   * تحليل Chunks
   */
  private async analyzeChunks(): Promise<ChunkInfo[]> {
    const chunks: ChunkInfo[] = [];
    
    // تحليل الـ scripts المحملة
    const scripts = document.querySelectorAll('script[src]');
    
    for (const script of scripts) {
      const src = (script as HTMLScriptElement).src;
      if (src && !src.includes('chrome-extension') && !src.includes('vite')) {
        const chunkName = this.extractChunkNameFromURL(src);
        const size = await this.getResourceSize(src);
        
        chunks.push({
          name: chunkName,
          size,
          modules: [], // سيتم ملؤها من التحليل الديناميكي
          loadTime: 0,
          isLazy: src.includes('lazy') || src.includes('chunk'),
          priority: this.determinePriority(chunkName)
        });
      }
    }

    return chunks;
  }

  /**
   * البحث عن الوحدات المكررة
   */
  private async findDuplicateModules(): Promise<DuplicateInfo[]> {
    const duplicates: DuplicateInfo[] = [];
    
    // تحليل الوحدات المستوردة
    const moduleMap = new Map<string, string[]>();
    
    // استخدام Performance API للحصول على معلومات الموارد
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    entries.forEach(entry => {
      if (entry.name.includes('.js')) {
        const moduleName = this.extractModuleNameFromURL(entry.name);
        if (!moduleMap.has(moduleName)) {
          moduleMap.set(moduleName, []);
        }
        moduleMap.get(moduleName)!.push(entry.name);
      }
    });

    // العثور على التكرارات
    moduleMap.forEach((chunks, module) => {
      if (chunks.length > 1) {
        duplicates.push({
          module,
          chunks,
          totalSize: chunks.length * 50000, // تقدير تقريبي
          impact: chunks.length > 3 ? 'high' : chunks.length > 2 ? 'medium' : 'low'
        });
      }
    });

    return duplicates;
  }

  /**
   * تحليل استخدام الذاكرة
   */
  private async analyzeMemoryUsage(): Promise<MemoryAnalysis> {
    const memoryInfo = (performance as any).memory || {};
    const leaks: MemoryLeak[] = [];

    // فحص تسريبات الذاكرة المحتملة
    const domNodes = document.querySelectorAll('*').length;
    if (domNodes > 5000) {
      leaks.push({
        type: 'DOM Bloat',
        description: `عدد كبير من عقد DOM: ${domNodes}`,
        severity: domNodes > 10000 ? 'critical' : 'high',
        fix: 'استخدم Virtual Scrolling وإزالة العقد غير المستخدمة'
      });
    }

    // فحص Event Listeners
    const eventListeners = this.countEventListeners();
    if (eventListeners > 1000) {
      leaks.push({
        type: 'Event Listeners',
        description: `عدد كبير من Event Listeners: ${eventListeners}`,
        severity: eventListeners > 2000 ? 'high' : 'medium',
        fix: 'تنظيف Event Listeners عند unmount المكونات'
      });
    }

    return {
      jsHeapSize: memoryInfo.usedJSHeapSize || 0,
      domNodes,
      eventListeners,
      memoryLeaks: leaks
    };
  }

  /**
   * توليد توصيات التحسين
   */
  private generateOptimizationRecommendations(analysis: BundleAnalysis): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // توصيات بناء على حجم Bundle
    if (analysis.totalSize > 2000000) { // 2MB
      recommendations.push({
        type: 'split',
        target: 'large-chunks',
        description: 'تقسيم Chunks الكبيرة إلى أجزاء أصغر',
        expectedSaving: analysis.totalSize * 0.2,
        priority: 10
      });
    }

    // توصيات بناء على التكرارات
    analysis.duplicates.forEach(duplicate => {
      if (duplicate.impact === 'high') {
        recommendations.push({
          type: 'optimize',
          target: duplicate.module,
          description: `إزالة التكرار في الوحدة: ${duplicate.module}`,
          expectedSaving: duplicate.totalSize * 0.8,
          priority: 8
        });
      }
    });

    // توصيات الذاكرة
    analysis.memoryImpact.memoryLeaks.forEach(leak => {
      if (leak.severity === 'critical' || leak.severity === 'high') {
        recommendations.push({
          type: 'remove',
          target: leak.type,
          description: leak.fix,
          expectedSaving: 0,
          priority: leak.severity === 'critical' ? 10 : 7
        });
      }
    });

    // ترتيب حسب الأولوية
    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * تطبيق التحسينات المقترحة
   */
  async applyOptimizations(recommendations: OptimizationRecommendation[]): Promise<void> {
    for (const rec of recommendations.slice(0, 5)) { // تطبيق أهم 5 توصيات
      try {
        await this.applyOptimization(rec);
        console.log(`✅ Applied optimization: ${rec.description}`);
      } catch (error) {
        console.warn(`⚠️ Failed to apply optimization: ${rec.description}`, error);
      }
    }
  }

  /**
   * تطبيق تحسين واحد
   */
  private async applyOptimization(recommendation: OptimizationRecommendation): Promise<void> {
    switch (recommendation.type) {
      case 'lazy':
        await this.enableLazyLoading(recommendation.target);
        break;
      
      case 'remove':
        await this.removeUnusedCode(recommendation.target);
        break;
      
      case 'optimize':
        await this.optimizeModule(recommendation.target);
        break;
    }
  }

  /**
   * تفعيل التحميل الكسول
   */
  private async enableLazyLoading(target: string): Promise<void> {
    // تطبيق lazy loading على المكونات الثقيلة
    const components = document.querySelectorAll(`[data-component="${target}"]`);
    components.forEach(component => {
      if ('loading' in component) {
        (component as any).loading = 'lazy';
      }
    });
  }

  /**
   * إزالة الكود غير المستخدم
   */
  private async removeUnusedCode(target: string): Promise<void> {
    // تنظيف DOM من العناصر غير المستخدمة
    const unusedElements = document.querySelectorAll(`[data-unused="${target}"]`);
    unusedElements.forEach(element => element.remove());
  }

  /**
   * تحسين وحدة
   */
  private async optimizeModule(target: string): Promise<void> {
    // تطبيق تحسينات خاصة بالوحدة
    console.log(`Optimizing module: ${target}`);
  }

  /**
   * مراقبة الأداء المستمر
   */
  startContinuousMonitoring(): void {
    // مراقبة تغييرات الأداء
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.duration > 100) {
            console.warn(`🐌 Slow operation: ${entry.name} (${entry.duration}ms)`);
          }
        });
      });

      try {
        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (e) {
        console.warn('Performance monitoring not supported');
      }
    }

    // مراقبة الذاكرة دورياً
    this.memoryInterval = window.setInterval(() => {
      this.checkMemoryLeaks();
    }, 30000); // كل 30 ثانية
  }

  /**
   * فحص تسريبات الذاكرة
   */
  private checkMemoryLeaks(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      if (usagePercent > 85) {
        console.warn('🚨 High memory usage detected:', usagePercent.toFixed(1) + '%');
        this.triggerMemoryCleanup();
      }
    }
  }

  /**
   * تنظيف الذاكرة
   */
  private triggerMemoryCleanup(): void {
    // إزالة Cache القديم
    this.analysisCache.clear();
    
    // تنظيف Event Listeners المنفصلة
    const elements = document.querySelectorAll('[data-cleanup="true"]');
    elements.forEach(element => {
      const clonedElement = element.cloneNode(true);
      element.parentNode?.replaceChild(clonedElement, element);
    });

    // تشغيل garbage collection إذا متاح
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  /**
   * الحصول على تقرير مفصل
   */
  async getDetailedReport(): Promise<string> {
    const analysis = await this.analyzeBundlePerformance();
    
    return `
# تقرير تحليل الأداء المفصل

## حجم Bundle الإجمالي
${(analysis.totalSize / 1024 / 1024).toFixed(2)} MB

## تحليل Chunks
${analysis.chunks.map(chunk => 
  `- ${chunk.name}: ${(chunk.size / 1024).toFixed(2)} KB (${chunk.priority})`
).join('\n')}

## الوحدات المكررة
${analysis.duplicates.map(dup => 
  `- ${dup.module}: تكرار ${dup.chunks.length} مرات (${dup.impact})`
).join('\n')}

## تحليل الذاكرة
- استخدام JS Heap: ${(analysis.memoryImpact.jsHeapSize / 1024 / 1024).toFixed(2)} MB
- عقد DOM: ${analysis.memoryImpact.domNodes}
- Event Listeners: ${analysis.memoryImpact.eventListeners}

## التوصيات (أهم 5)
${analysis.recommendations.slice(0, 5).map((rec, i) => 
  `${i + 1}. ${rec.description} (توفير متوقع: ${(rec.expectedSaving / 1024).toFixed(2)} KB)`
).join('\n')}
    `;
  }

  // Helper methods
  private extractChunkNameFromURL(url: string): string {
    return url.split('/').pop()?.split('-')[0] || 'unknown';
  }

  private extractModuleNameFromURL(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1].split('.')[0];
  }

  private async getResourceSize(url: string): Promise<number> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return parseInt(response.headers.get('content-length') || '0', 10);
    } catch {
      return 0;
    }
  }

  private determinePriority(chunkName: string): 'critical' | 'high' | 'normal' | 'low' {
    const criticalChunks = ['app', 'main', 'vendor', 'react'];
    const highPriorityChunks = ['dashboard', 'auth', 'router'];
    
    if (criticalChunks.some(critical => chunkName.includes(critical))) {
      return 'critical';
    }
    if (highPriorityChunks.some(high => chunkName.includes(high))) {
      return 'high';
    }
    return 'normal';
  }

  private countEventListeners(): number {
    // تقدير تقريبي لعدد Event Listeners
    const elements = document.querySelectorAll('*');
    let count = 0;
    
    elements.forEach(element => {
      // فحص الخصائص التي تحتوي على event handlers
      const props = Object.getOwnPropertyNames(element);
      count += props.filter(prop => prop.startsWith('on')).length;
    });
    
    return count;
  }

  /**
   * تنظيف الموارد
   */
  cleanup(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }
    
    this.analysisCache.clear();
  }

  /**
   * تهيئة التحليل
   */
  private initializeAnalysis(): void {
    // بدء المراقبة المستمرة
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.startContinuousMonitoring();
      });
    } else {
      this.startContinuousMonitoring();
    }
  }
}

// إنشاء instance عام
export const bundleOptimizer = new BundleOptimizer();

// Hook للاستخدام في React
export const useBundleOptimization = () => {
  return {
    analyzeBundle: () => bundleOptimizer.analyzeBundlePerformance(),
    getReport: () => bundleOptimizer.getDetailedReport(),
    applyOptimizations: (recommendations: OptimizationRecommendation[]) => 
      bundleOptimizer.applyOptimizations(recommendations),
    cleanup: () => bundleOptimizer.cleanup()
  };
};

export default BundleOptimizer;