/**
 * نظام تحسين وتحميل مسبق للخطوط والملفات الثابتة
 * Font and Static Assets Optimization and Preloading System
 */

// أنواع الخطوط المدعومة
export type FontFormat = 'woff2' | 'woff' | 'ttf' | 'otf' | 'eot';

// معلومات الخط
export interface FontInfo {
  family: string;
  weight: number | string;
  style: 'normal' | 'italic';
  display: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  format: FontFormat;
  url: string;
  preload: boolean;
  critical: boolean;
}

// إعدادات التحسين
export interface OptimizationConfig {
  enablePreload: boolean;
  enablePrefetch: boolean;
  enableWebPConversion: boolean;
  enableLazyLoading: boolean;
  enableCriticalCSS: boolean;
  compressionLevel: 'low' | 'medium' | 'high';
}

class FontPreloader {
  private loadedFonts: Set<string> = new Set();
  private preloadedAssets: Set<string> = new Set();
  private fontObserver: FontFace[] = [];
  private config: OptimizationConfig;

  constructor(config: OptimizationConfig = {
    enablePreload: true,
    enablePrefetch: true,
    enableWebPConversion: true,
    enableLazyLoading: true,
    enableCriticalCSS: true,
    compressionLevel: 'medium'
  }) {
    this.config = config;
    this.initializeFontOptimizations();
  }

  // تهيئة تحسينات الخطوط
  private initializeFontOptimizations(): void {
    // إضافة font-display: swap لجميع الخطوط
    this.addGlobalFontDisplaySwap();
    
    // تحميل مسبق للخطوط الحرجة
    if (this.config.enablePreload) {
      this.preloadCriticalFonts();
    }

    // مراقبة تحميل الخطوط
    this.setupFontObserver();
  }

  // إضافة font-display: swap عالمياً
  private addGlobalFontDisplaySwap(): void {
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-display: swap;
      }
      
      /* تحسين خط Amiri للعربية */
      @font-face {
        font-family: 'Amiri';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: url('/fonts/Amiri-Regular.woff2') format('woff2'),
             url('/fonts/Amiri-Regular.woff') format('woff');
      }
      
      @font-face {
        font-family: 'Amiri';
        font-style: normal;
        font-weight: 700;
        font-display: swap;
        src: url('/fonts/Amiri-Bold.woff2') format('woff2'),
             url('/fonts/Amiri-Bold.woff') format('woff');
      }
      
      /* تحسين الخطوط الافتراضية */
      body {
        font-family: 'Amiri', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
                     'Helvetica Neue', Arial, sans-serif, 'Apple Color Emoji', 
                     'Segoe UI Emoji', 'Segoe UI Symbol';
      }
    `;
    document.head.appendChild(style);
  }

  // تحميل مسبق للخطوط الحرجة
  private preloadCriticalFonts(): void {
    const criticalFonts: FontInfo[] = [
      {
        family: 'Amiri',
        weight: 400,
        style: 'normal',
        display: 'swap',
        format: 'woff2',
        url: '/fonts/Amiri-Regular.woff2',
        preload: true,
        critical: true
      },
      {
        family: 'Amiri',
        weight: 700,
        style: 'normal',
        display: 'swap',
        format: 'woff2',
        url: '/fonts/Amiri-Bold.woff2',
        preload: true,
        critical: true
      }
    ];

    criticalFonts.forEach(font => {
      if (font.preload && !this.loadedFonts.has(font.url)) {
        this.preloadFont(font);
      }
    });
  }

  // تحميل مسبق لخط واحد
  preloadFont(font: FontInfo): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.loadedFonts.has(font.url)) {
        resolve();
        return;
      }

      // إنشاء link preload
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = `font/${font.format}`;
      link.href = font.url;
      link.crossOrigin = 'anonymous';

      link.onload = () => {
        this.loadedFonts.add(font.url);
        console.log(`✅ Font preloaded: ${font.family} ${font.weight}`);
        resolve();
      };

      link.onerror = () => {
        console.warn(`❌ Failed to preload font: ${font.url}`);
        reject(new Error(`Failed to preload font: ${font.url}`));
      };

      document.head.appendChild(link);

      // Font Face API للتحميل المتقدم
      if ('fonts' in document) {
        const fontFace = new FontFace(
          font.family,
          `url(${font.url}) format('${font.format}')`,
          {
            weight: font.weight.toString(),
            style: font.style,
            display: font.display
          }
        );

        fontFace.load().then(() => {
          document.fonts.add(fontFace);
          this.fontObserver.push(fontFace);
        }).catch(error => {
          console.warn(`Font loading failed: ${font.family}`, error);
        });
      }
    });
  }

  // مراقبة تحميل الخطوط
  private setupFontObserver(): void {
    if ('fonts' in document) {
      document.fonts.addEventListener('loadingdone', () => {
        console.log('✅ All fonts loaded successfully');
        document.body.classList.add('fonts-loaded');
      });

      document.fonts.addEventListener('loadingerror', (event) => {
        console.warn('❌ Font loading error:', event);
      });
    }
  }

  // تحميل مسبق للأصول الثابتة
  preloadStaticAssets(assets: string[]): Promise<void[]> {
    const promises = assets.map(asset => this.preloadAsset(asset));
    return Promise.all(promises);
  }

  // تحميل مسبق لأصل واحد
  private preloadAsset(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.preloadedAssets.has(url)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      const fileExtension = url.split('.').pop()?.toLowerCase();

      // تحديد نوع الأصل
      switch (fileExtension) {
        case 'css':
          link.rel = 'preload';
          link.as = 'style';
          break;
        case 'js':
          link.rel = 'preload';
          link.as = 'script';
          break;
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'webp':
        case 'svg':
          link.rel = 'preload';
          link.as = 'image';
          break;
        default:
          link.rel = 'prefetch'; // للملفات الأخرى
      }

      link.href = url;

      link.onload = () => {
        this.preloadedAssets.add(url);
        console.log(`✅ Asset preloaded: ${url}`);
        resolve();
      };

      link.onerror = () => {
        console.warn(`❌ Failed to preload asset: ${url}`);
        reject(new Error(`Failed to preload asset: ${url}`));
      };

      document.head.appendChild(link);
    });
  }

  // تحسين الصور للـ WebP
  optimizeImages(): void {
    if (!this.config.enableWebPConversion) return;

    const images = document.querySelectorAll('img[src]');
    images.forEach((img: HTMLImageElement) => {
      this.convertToWebPIfSupported(img);
    });
  }

  // تحويل الصور إلى WebP إذا كان مدعوماً
  private convertToWebPIfSupported(img: HTMLImageElement): void {
    // فحص دعم WebP
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const webpSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp');

    if (webpSupported && !img.src.includes('.webp')) {
      const webpUrl = img.src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      
      // فحص وجود نسخة WebP
      fetch(webpUrl, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            img.src = webpUrl;
          }
        })
        .catch(() => {
          // إذا لم توجد نسخة WebP، استخدم الصورة الأصلية
        });
    }
  }

  // تحميل كسول للصور
  enableLazyLoading(): void {
    if (!this.config.enableLazyLoading) return;

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
      images.forEach((img: HTMLImageElement) => {
        img.src = img.dataset.src || '';
      });
    }
  }

  // ضغط CSS الحرج
  optimizeCriticalCSS(): void {
    if (!this.config.enableCriticalCSS) return;

    const criticalCSS = `
      /* CSS حرج للتحميل السريع */
      body { 
        margin: 0; 
        font-family: 'Amiri', -apple-system, BlinkMacSystemFont, sans-serif; 
        line-height: 1.6;
        color: #333;
      }
      
      .loading { 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        min-height: 200px; 
      }
      
      .lazy {
        opacity: 0;
        transition: opacity 0.3s;
      }
      
      .lazy.loaded {
        opacity: 1;
      }
      
      /* تحسينات RTL */
      [dir="rtl"] {
        text-align: right;
      }
      
      /* تحسين الأداء */
      * {
        box-sizing: border-box;
      }
      
      img {
        max-width: 100%;
        height: auto;
      }
    `;

    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.insertBefore(style, document.head.firstChild);
  }

  // تحسين شامل للأداء
  async optimizePerformance(): Promise<void> {
    try {
      // تحميل مسبق للخطوط الحرجة
      await this.preloadCriticalFonts();
      
      // تحسين الصور
      this.optimizeImages();
      
      // تفعيل التحميل الكسول
      this.enableLazyLoading();
      
      // تحسين CSS الحرج
      this.optimizeCriticalCSS();
      
      // تحميل مسبق للأصول المهمة
      const criticalAssets = [
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png',
        '/manifest.json'
      ];
      
      await this.preloadStaticAssets(criticalAssets);
      
      console.log('✅ Performance optimization completed');
    } catch (error) {
      console.error('❌ Performance optimization failed:', error);
    }
  }

  // مراقبة الأداء
  getPerformanceMetrics(): { [key: string]: number } {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      fontsLoaded: this.loadedFonts.size,
      assetsPreloaded: this.preloadedAssets.size
    };
  }

  // تنظيف الموارد
  cleanup(): void {
    this.loadedFonts.clear();
    this.preloadedAssets.clear();
    this.fontObserver = [];
  }
}

// مثيل عام لمحسن الخطوط
export const fontPreloader = new FontPreloader();

// أدوات مساعدة
export const FontOptimizationUtils = {
  // فحص دعم التنسيقات المختلفة
  getSupportedFormats(): FontFormat[] {
    const formats: FontFormat[] = [];
    
    // فحص دعم WOFF2
    if (FontOptimizationUtils.supportsFormat('woff2')) {
      formats.push('woff2');
    }
    
    // فحص دعم WOFF
    if (FontOptimizationUtils.supportsFormat('woff')) {
      formats.push('woff');
    }
    
    // فحص دعم TTF
    if (FontOptimizationUtils.supportsFormat('truetype')) {
      formats.push('ttf');
    }
    
    return formats;
  },

  // فحص دعم تنسيق معين
  supportsFormat(format: string): boolean {
    const testFont = new FontFace('test', `url(data:font/${format};base64,) format('${format}')`);
    return testFont.status !== 'error';
  },

  // تحسين خط معين
  optimizeFont(fontFamily: string, options: Partial<FontInfo> = {}): FontInfo {
    const supportedFormats = FontOptimizationUtils.getSupportedFormats();
    const bestFormat = supportedFormats[0] || 'woff';
    
    return {
      family: fontFamily,
      weight: 400,
      style: 'normal',
      display: 'swap',
      format: bestFormat,
      url: `/fonts/${fontFamily}-Regular.${bestFormat}`,
      preload: true,
      critical: false,
      ...options
    };
  },

  // تحليل استخدام الخطوط
  analyzeFontUsage(): { [fontFamily: string]: number } {
    const usage: { [fontFamily: string]: number } = {};
    
    // تحليل جميع العناصر المرئية
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      const style = window.getComputedStyle(element);
      const fontFamily = style.fontFamily;
      
      if (fontFamily && fontFamily !== 'inherit') {
        usage[fontFamily] = (usage[fontFamily] || 0) + 1;
      }
    });
    
    return usage;
  }
};

// Hook لاستخدام تحسين الخطوط في React
export const useFontOptimization = () => {
  const [isOptimized, setIsOptimized] = useState(false);
  const [metrics, setMetrics] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const optimize = async () => {
      await fontPreloader.optimizePerformance();
      setIsOptimized(true);
      setMetrics(fontPreloader.getPerformanceMetrics());
    };

    optimize();

    return () => {
      fontPreloader.cleanup();
    };
  }, []);

  const refreshMetrics = () => {
    setMetrics(fontPreloader.getPerformanceMetrics());
  };

  return {
    isOptimized,
    metrics,
    refreshMetrics,
    preloadFont: (font: FontInfo) => fontPreloader.preloadFont(font),
    preloadAssets: (assets: string[]) => fontPreloader.preloadStaticAssets(assets)
  };
};

// React Hook لتوليد useState و useEffect
import { useState, useEffect } from 'react'; 