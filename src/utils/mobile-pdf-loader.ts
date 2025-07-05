/**
 * تحميل خطوط PDF بشكل ذكي للأجهزة المحمولة
 * يتم تحميل الخطوط فقط عند الحاجة لتوليد PDF
 */

let fontsLoaded = false;
let fontsLoading = false;
let loadPromise: Promise<void> | null = null;

declare global {
  interface Window {
    AmiriRegular?: string;
    AmiriBold?: string;
    pdfMake?: any;
  }
}

/**
 * تحقق من سرعة الاتصال للتحديد ما إذا كان الجهاز على شبكة بطيئة
 */
function isSlowConnection(): boolean {
  // @ts-ignore
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (connection) {
    // إذا كانت السرعة أقل من 4G أو الزمن أكبر من 150ms
    return connection.effectiveType === 'slow-2g' || 
           connection.effectiveType === '2g' || 
           connection.effectiveType === '3g' ||
           connection.rtt > 150;
  }
  
  // افتراض أن الجوال قد يكون على شبكة أبطأ
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * تحميل ملفات JavaScript للخطوط بشكل غير متزامن
 */
async function loadFontScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // تحقق إذا كان الملف محمل مسبقاً
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.defer = true;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`فشل في تحميل ${url}`));
    
    document.head.appendChild(script);
  });
}

/**
 * تحميل الخطوط العربية عند الحاجة
 */
export async function loadArabicFontsForPDF(): Promise<void> {
  // إذا كانت الخطوط محملة مسبقاً
  if (fontsLoaded) {
    return;
  }

  // إذا كان التحميل جارياً، انتظر النتيجة
  if (fontsLoading) {
    return loadPromise || Promise.resolve();
  }

  fontsLoading = true;
  
  loadPromise = (async () => {
    try {
      console.log('🔤 بدء تحميل خطوط PDF للجوال...');
      
      // تحميل ملفات الخطوط بالتوازي
      await Promise.all([
        loadFontScript('/Amiri-Regular.js'),
        loadFontScript('/Amiri-Bold.js')
      ]);
      
      // انتظار قليل للتأكد من تحميل البيانات
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // تحقق من توفر بيانات الخطوط
      if (!window.AmiriRegular || !window.AmiriBold) {
        throw new Error('فشل في تحميل بيانات الخطوط العربية');
      }

      // تكوين pdfMake إذا كان متاحاً
      if (window.pdfMake && window.pdfMake.vfs) {
        window.pdfMake.vfs['Amiri-Regular.ttf'] = window.AmiriRegular;
        window.pdfMake.vfs['Amiri-Bold.ttf'] = window.AmiriBold;
        
        window.pdfMake.fonts = {
          Amiri: {
            normal: 'Amiri-Regular.ttf',
            bold: 'Amiri-Bold.ttf',
          }
        };
      }
      
      fontsLoaded = true;
      console.log('✅ تم تحميل خطوط PDF بنجاح');
      
    } catch (error) {
      console.error('❌ خطأ في تحميل خطوط PDF:', error);
      throw error;
    } finally {
      fontsLoading = false;
    }
  })();
  
  return loadPromise;
}

/**
 * تحميل مكتبة PDF بشكل ذكي
 */
export async function loadPDFLibrary(): Promise<any> {
  // للأجهزة البطيئة، إظهار تحذير
  if (isSlowConnection()) {
    console.warn('🐌 شبكة بطيئة مكتشفة - سيتم تحميل PDF بصبر...');
  }
  
  try {
    // تحميل pdfMake إذا لم يكن محملاً
    if (!window.pdfMake) {
      const pdfMakeModule = await import('pdfmake/build/pdfmake.min.js');
      const vfsFontsModule = await import('pdfmake/build/vfs_fonts.js');
      
      // تأكد من إعداد pdfMake
      window.pdfMake = (pdfMakeModule as any).default || pdfMakeModule;
    }
    
    // تحميل الخطوط العربية
    await loadArabicFontsForPDF();
    
    return window.pdfMake;
    
  } catch (error) {
    console.error('❌ فشل في تحميل مكتبة PDF:', error);
    throw new Error('فشل في تحميل مكتبة توليد PDF. تحقق من الاتصال وحاول مرة أخرى.');
  }
}

/**
 * معاينة حالة التحميل
 */
export function getPDFLoadingStatus() {
  return {
    fontsLoaded,
    fontsLoading,
    isSlowConnection: isSlowConnection(),
    supportsServiceWorker: 'serviceWorker' in navigator,
    memoryInfo: (performance as any).memory ? {
      used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)
    } : null
  };
}

/**
 * تنظيف ذاكرة PDF للأجهزة ذات الذاكرة المحدودة
 */
export function cleanupPDFMemory() {
  if (typeof window !== 'undefined') {
    // تنظيف متغيرات الخطوط المؤقتة
    if (window.AmiriRegular) delete window.AmiriRegular;
    if (window.AmiriBold) delete window.AmiriBold;
    
    // تشغيل garbage collector إذا كان متاحاً
    if ((window as any).gc) {
      (window as any).gc();
    }
  }
}

/**
 * hook للتحقق من الذاكرة المتاحة
 */
export function useMemoryOptimization() {
  const memoryInfo = (performance as any).memory;
  
  if (memoryInfo) {
    const usedMB = memoryInfo.usedJSHeapSize / 1024 / 1024;
    const limitMB = memoryInfo.jsHeapSizeLimit / 1024 / 1024;
    const usagePercent = (usedMB / limitMB) * 100;
    
    // إذا كان الاستخدام أكثر من 80%، تنظيف الذاكرة
    if (usagePercent > 80) {
      console.warn('🚨 استخدام ذاكرة عالي، تنظيف الذاكرة...');
      cleanupPDFMemory();
    }
    
    return {
      usedMB: Math.round(usedMB),
      limitMB: Math.round(limitMB),
      usagePercent: Math.round(usagePercent),
      shouldOptimize: usagePercent > 80
    };
  }
  
  return null;
} 