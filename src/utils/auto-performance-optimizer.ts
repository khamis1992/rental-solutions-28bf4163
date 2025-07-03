/**
 * مُحسِّن الأداء التلقائي
 * Automatic Performance Optimizer
 * 
 * يقوم بتطبيق تحسينات الأداء تلقائياً بناءً على:
 * - إمكانيات الجهاز
 * - حالة الشبكة
 * - استخدام الذاكرة
 * - أنماط استخدام المستخدم
 */

interface DeviceCapabilities {
  isMobile: boolean;
  isLowEndDevice: boolean;
  memoryLimit: number;
  cores: number;
  connectionType: string;
  effectiveType: string;
  downlink: number;
}

interface OptimizationSettings {
  enableAnimations: boolean;
  imageQuality: 'high' | 'medium' | 'low';
  lazyLoadingDistance: number;
  cacheStrategy: 'aggressive' | 'normal' | 'minimal';
  bundleOptimization: 'full' | 'partial' | 'disabled';
  renderOptimization: 'concurrent' | 'standard' | 'basic';
}

class AutoPerformanceOptimizer {
  private currentSettings: OptimizationSettings;
  private deviceCapabilities: DeviceCapabilities;
  private performanceObserver?: PerformanceObserver;
  private optimizationInterval?: number;

  constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.currentSettings = this.generateOptimalSettings();
    this.initialize();
  }

  /**
   * اكتشاف إمكانيات الجهاز
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // تقدير قوة الجهاز بناءً على عدة عوامل
    const memory = (navigator as any).deviceMemory || 4; // افتراضي 4GB
    const cores = navigator.hardwareConcurrency || 4; // افتراضي 4 cores
    
    // تحديد إذا كان الجهاز ضعيف الإمكانيات
    const isLowEndDevice = memory <= 2 || cores <= 2 || isMobile;
    
    // معلومات الشبكة
    const connection = (navigator as any).connection || {};
    const connectionType = connection.type || 'unknown';
    const effectiveType = connection.effectiveType || '4g';
    const downlink = connection.downlink || 10;

    return {
      isMobile,
      isLowEndDevice,
      memoryLimit: memory * 1024 * 1024 * 1024, // تحويل إلى bytes
      cores,
      connectionType,
      effectiveType,
      downlink
    };
  }

  /**
   * توليد الإعدادات المثلى بناءً على إمكانيات الجهاز
   */
  private generateOptimalSettings(): OptimizationSettings {
    const { isLowEndDevice, effectiveType, downlink } = this.deviceCapabilities;
    
    let settings: OptimizationSettings = {
      enableAnimations: true,
      imageQuality: 'high',
      lazyLoadingDistance: 100,
      cacheStrategy: 'normal',
      bundleOptimization: 'partial',
      renderOptimization: 'standard'
    };

    // تحسينات للأجهزة الضعيفة
    if (isLowEndDevice) {
      settings = {
        ...settings,
        enableAnimations: false,
        imageQuality: 'medium',
        lazyLoadingDistance: 50,
        cacheStrategy: 'minimal',
        bundleOptimization: 'full',
        renderOptimization: 'basic'
      };
    }

    // تحسينات للشبكات البطيئة
    if (['slow-2g', '2g', '3g'].includes(effectiveType) || downlink < 1.5) {
      settings = {
        ...settings,
        imageQuality: 'low',
        lazyLoadingDistance: 25,
        cacheStrategy: 'aggressive',
        bundleOptimization: 'full'
      };
    }

    // تحسينات للأجهزة عالية الأداء والشبكات السريعة
    if (!isLowEndDevice && effectiveType === '4g' && downlink > 10) {
      settings = {
        ...settings,
        enableAnimations: true,
        imageQuality: 'high',
        lazyLoadingDistance: 200,
        cacheStrategy: 'normal',
        renderOptimization: 'concurrent'
      };
    }

    return settings;
  }

  /**
   * تطبيق التحسينات على DOM
   */
  private applyDOMOptimizations(): void {
    const { enableAnimations, imageQuality, lazyLoadingDistance } = this.currentSettings;

    // تعطيل الحركات للأجهزة الضعيفة
    if (!enableAnimations) {
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.001s !important;
          animation-delay: 0s !important;
          transition-duration: 0.001s !important;
          transition-delay: 0s !important;
        }
      `;
      document.head.appendChild(style);
    }

    // تحسين تحميل الصور
    this.optimizeImages(imageQuality, lazyLoadingDistance);

    // تحسين الخطوط
    this.optimizeFonts();
  }

  /**
   * تحسين الصور
   */
  private optimizeImages(quality: string, distance: number): void {
    const images = document.querySelectorAll('img:not([data-optimized])');
    
    // إعداد Intersection Observer للتحميل الكسول
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadOptimizedImage(img, quality);
            imageObserver.unobserve(img);
          }
        });
      },
      {
        rootMargin: `${distance}px`
      }
    );

    images.forEach(img => {
      const image = img as HTMLImageElement;
      image.setAttribute('data-optimized', 'true');
      
      // تأجيل التحميل للصور غير المرئية
      if (image.src && !this.isImageInViewport(image)) {
        image.dataset.src = image.src;
        image.src = this.generatePlaceholder(image.width, image.height);
        imageObserver.observe(image);
      }
    });
  }

  /**
   * تحميل صورة محسنة
   */
  private loadOptimizedImage(img: HTMLImageElement, quality: string): void {
    const originalSrc = img.dataset.src || img.src;
    
    // محاولة تحسين جودة الصورة بناءً على الإعدادات
    const optimizedSrc = this.getOptimizedImageUrl(originalSrc, quality);
    
    const newImg = new Image();
    newImg.onload = () => {
      img.src = optimizedSrc;
      img.classList.add('loaded');
    };
    newImg.onerror = () => {
      img.src = originalSrc; // العودة للصورة الأصلية في حالة الفشل
    };
    newImg.src = optimizedSrc;
  }

  /**
   * توليد URL محسن للصورة
   */
  private getOptimizedImageUrl(src: string, quality: string): string {
    // في التطبيق الحقيقي، يمكن استخدام خدمة تحسين الصور
    const qualityMap = { high: 90, medium: 70, low: 50 };
    const q = qualityMap[quality as keyof typeof qualityMap] || 80;
    
    // إذا كانت الصورة تدعم معاملات URL للجودة
    if (src.includes('?')) {
      return `${src}&q=${q}`;
    } else if (src.includes('.')) {
      return `${src}?q=${q}`;
    }
    
    return src;
  }

  /**
   * توليد placeholder للصورة
   */
  private generatePlaceholder(width: number, height: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = width || 300;
    canvas.height = height || 200;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#cccccc';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('جارٍ التحميل...', canvas.width / 2, canvas.height / 2);
    }
    
    return canvas.toDataURL();
  }

  /**
   * التحقق من وجود الصورة في viewport
   */
  private isImageInViewport(img: HTMLImageElement): boolean {
    const rect = img.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }

  /**
   * تحسين الخطوط
   */
  private optimizeFonts(): void {
    // تحميل الخطوط الحرجة فقط
    const criticalFonts = ['Amiri-Bold', 'Inter'];
    
    criticalFonts.forEach(fontFamily => {
      const font = new FontFace(fontFamily, `url(/fonts/${fontFamily}.woff2)`);
      font.load().then(() => {
        document.fonts.add(font);
        console.log(`✅ Font loaded: ${fontFamily}`);
      }).catch(err => {
        console.warn(`⚠️ Font load failed: ${fontFamily}`, err);
      });
    });
  }

  /**
   * تحسين React Query بناءً على الإعدادات
   */
  public getOptimizedQueryClientConfig() {
    const { cacheStrategy, isLowEndDevice } = this.deviceCapabilities;
    
    const baseConfig = {
      staleTime: 5 * 60 * 1000, // 5 دقائق
      gcTime: 10 * 60 * 1000,   // 10 دقائق
    };

    switch (this.currentSettings.cacheStrategy) {
      case 'aggressive':
        return {
          ...baseConfig,
          staleTime: 15 * 60 * 1000, // 15 دقيقة
          gcTime: 30 * 60 * 1000,    // 30 دقيقة
        };
      
      case 'minimal':
        return {
          ...baseConfig,
          staleTime: 1 * 60 * 1000,  // 1 دقيقة
          gcTime: 2 * 60 * 1000,     // 2 دقيقة
        };
      
      default:
        return baseConfig;
    }
  }

  /**
   * مراقبة الأداء وإعادة التحسين
   */
  private startPerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          // إعادة تحسين إذا كان الأداء ضعيفاً
          if (entry.entryType === 'measure' && entry.duration > 100) {
            console.warn(`⚠️ Slow operation detected: ${entry.name} (${entry.duration}ms)`);
            this.adjustSettingsForSlowPerformance();
          }
        });
      });

      try {
        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (e) {
        console.warn('Performance monitoring not fully supported');
      }
    }

    // فحص دوري لاستخدام الذاكرة
    this.optimizationInterval = window.setInterval(() => {
      this.checkMemoryUsage();
      this.adjustSettingsBasedOnCurrentConditions();
    }, 30000); // كل 30 ثانية
  }

  /**
   * تعديل الإعدادات للأداء البطيء
   */
  private adjustSettingsForSlowPerformance(): void {
    this.currentSettings = {
      ...this.currentSettings,
      enableAnimations: false,
      imageQuality: 'low',
      lazyLoadingDistance: 25,
      renderOptimization: 'basic'
    };
    
    this.applyDOMOptimizations();
    console.log('🔧 Performance settings adjusted for slow performance');
  }

  /**
   * فحص استخدام الذاكرة
   */
  private checkMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      if (usagePercent > 80) {
        console.warn('⚠️ High memory usage detected, triggering cleanup');
        this.triggerMemoryCleanup();
      }
    }
  }

  /**
   * تنظيف الذاكرة
   */
  private triggerMemoryCleanup(): void {
    // إزالة المراقبين غير الضروريين
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    // تنظيف الـ cache
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        const oldCaches = cacheNames.filter(name => 
          !name.includes('alaraf-rental-v2.0') && 
          !name.includes('alaraf-api-v2.0') && 
          !name.includes('alaraf-static-v2.0')
        );
        oldCaches.forEach(name => caches.delete(name));
      });
    }

    // تشغيل garbage collection إذا كان متاحاً
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  /**
   * تعديل الإعدادات بناءً على الظروف الحالية
   */
  private adjustSettingsBasedOnCurrentConditions(): void {
    const connection = (navigator as any).connection;
    if (connection) {
      const currentEffectiveType = connection.effectiveType;
      
      // إذا تحسنت الشبكة، حسن الإعدادات
      if (currentEffectiveType === '4g' && this.currentSettings.imageQuality === 'low') {
        this.currentSettings.imageQuality = 'medium';
        this.currentSettings.lazyLoadingDistance = 100;
      }
      
      // إذا ساءت الشبكة، قلل الجودة
      if (['slow-2g', '2g'].includes(currentEffectiveType) && this.currentSettings.imageQuality === 'high') {
        this.currentSettings.imageQuality = 'low';
        this.currentSettings.lazyLoadingDistance = 25;
      }
    }
  }

  /**
   * تهيئة المحسن
   */
  private initialize(): void {
    // تطبيق التحسينات عند تحميل الصفحة
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.applyDOMOptimizations();
        this.startPerformanceMonitoring();
      });
    } else {
      this.applyDOMOptimizations();
      this.startPerformanceMonitoring();
    }

    console.log('🚀 Auto Performance Optimizer initialized', {
      deviceCapabilities: this.deviceCapabilities,
      settings: this.currentSettings
    });
  }

  /**
   * الحصول على الإعدادات الحالية
   */
  public getCurrentSettings(): OptimizationSettings {
    return { ...this.currentSettings };
  }

  /**
   * الحصول على إمكانيات الجهاز
   */
  public getDeviceCapabilities(): DeviceCapabilities {
    return { ...this.deviceCapabilities };
  }

  /**
   * تنظيف الموارد
   */
  public cleanup(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
    }
  }
}

// إنشاء instance عام
export const autoPerformanceOptimizer = new AutoPerformanceOptimizer();

// تصدير الكلاس للاستخدام المخصص
export { AutoPerformanceOptimizer };

// تصدير الأنواع
export type { DeviceCapabilities, OptimizationSettings }; 