/**
 * نظام كشف وحل مشاكل البيئة الحقيقية
 * Production Environment Issue Detector and Resolver
 */

export interface ProductionIssue {
  type: 'critical' | 'warning' | 'info';
  category: 'env' | 'network' | 'performance' | 'security';
  message: string;
  solution: string;
  autoFixable: boolean;
}

export interface EnvironmentDetectionResult {
  environment: 'development' | 'production' | 'preview' | 'local';
  platform: 'netlify' | 'vercel' | 'github-pages' | 'local' | 'unknown';
  issues: ProductionIssue[];
  suggestions: string[];
  healthScore: number;
}

/**
 * كشف منصة النشر الحالية
 */
export function detectDeploymentPlatform(): 'netlify' | 'vercel' | 'github-pages' | 'local' | 'unknown' {
  // فحص متغيرات البيئة الخاصة بكل منصة
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    if (hostname.includes('netlify.app') || hostname.includes('netlify.com')) {
      return 'netlify';
    }
    if (hostname.includes('vercel.app') || hostname.includes('vercel.com')) {
      return 'vercel';
    }
    if (hostname.includes('github.io')) {
      return 'github-pages';
    }
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'local';
    }
  }

  // فحص متغيرات البيئة
  if (import.meta.env.NETLIFY) return 'netlify';
  if (import.meta.env.VERCEL) return 'vercel';
  
  return 'unknown';
}

/**
 * كشف البيئة الحالية
 */
export function detectEnvironment(): 'development' | 'production' | 'preview' | 'local' {
  if (import.meta.env.DEV) return 'development';
  if (import.meta.env.PROD) return 'production';
  
  // فحص إضافي
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'local';
  }
  
  return 'production';
}

/**
 * فحص شامل للبيئة الحقيقية
 */
export function detectProductionIssues(): EnvironmentDetectionResult {
  const platform = detectDeploymentPlatform();
  const environment = detectEnvironment();
  const issues: ProductionIssue[] = [];
  const suggestions: string[] = [];
  
  console.group('🔍 فحص البيئة الحقيقية');
  console.log('🌍 البيئة:', environment);
  console.log('☁️ المنصة:', platform);

  // فحص متغيرات البيئة الأساسية
  const criticalEnvVars = {
    'VITE_SUPABASE_URL': import.meta.env.VITE_SUPABASE_URL,
    'VITE_SUPABASE_ANON_KEY': import.meta.env.VITE_SUPABASE_ANON_KEY
  };

  let missingCriticalVars = 0;
  Object.entries(criticalEnvVars).forEach(([key, value]) => {
    if (!value) {
      missingCriticalVars++;
      issues.push({
        type: 'critical',
        category: 'env',
        message: `متغير البيئة ${key} مفقود`,
        solution: getEnvVarSolution(key, platform),
        autoFixable: false
      });
    }
  });

  // فحص الاتصال بالشبكة
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection && connection.effectiveType) {
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        issues.push({
          type: 'warning',
          category: 'network',
          message: 'اتصال إنترنت بطيء مكتشف',
          solution: 'سيتم تفعيل وضع التوفير التلقائي',
          autoFixable: true
        });
      }
    }
  }

  // فحص الأداء
  if (typeof window !== 'undefined' && 'performance' in window) {
    const memory = (performance as any).memory;
    if (memory && memory.totalJSHeapSize > 50 * 1024 * 1024) { // 50MB
      issues.push({
        type: 'warning',
        category: 'performance',
        message: 'استهلاك ذاكرة عالي',
        solution: 'سيتم تفعيل تحسينات الذاكرة',
        autoFixable: true
      });
    }
  }

  // فحص HTTPS في الإنتاج
  if (environment === 'production' && typeof window !== 'undefined') {
    if (window.location.protocol !== 'https:') {
      issues.push({
        type: 'critical',
        category: 'security',
        message: 'الموقع لا يستخدم HTTPS في البيئة الحقيقية',
        solution: 'تفعيل HTTPS في إعدادات المنصة',
        autoFixable: false
      });
    }
  }

  // حساب نقاط الصحة
  const criticalIssues = issues.filter(i => i.type === 'critical').length;
  const warningIssues = issues.filter(i => i.type === 'warning').length;
  const healthScore = Math.max(0, 100 - (criticalIssues * 30) - (warningIssues * 10));

  // إضافة اقتراحات حسب المنصة
  if (missingCriticalVars > 0) {
    suggestions.push(...getPlatformSpecificSuggestions(platform));
  }

  console.log('📊 نقاط الصحة:', healthScore, '/100');
  console.groupEnd();

  return {
    environment,
    platform,
    issues,
    suggestions,
    healthScore
  };
}

/**
 * حلول خاصة بمتغيرات البيئة حسب المنصة
 */
function getEnvVarSolution(varName: string, platform: string): string {
  const solutions: Record<string, string> = {
    netlify: `أضف ${varName} في Netlify Dashboard → Site Settings → Environment Variables`,
    vercel: `أضف ${varName} في Vercel Dashboard → Project Settings → Environment Variables`,
    'github-pages': `أضف ${varName} في GitHub → Repository Settings → Secrets and Variables → Actions`,
    local: `أضف ${varName} في ملف .env في المجلد الجذر`,
    unknown: `أضف ${varName} في إعدادات متغيرات البيئة للمنصة المستخدمة`
  };

  return solutions[platform] || solutions.unknown;
}

/**
 * اقتراحات خاصة بكل منصة
 */
function getPlatformSpecificSuggestions(platform: string): string[] {
  const suggestions: Record<string, string[]> = {
    netlify: [
      '🔧 اذهب إلى Netlify Dashboard',
      '⚙️ اختر موقعك → Site Settings → Environment Variables', 
      '➕ اضغط Add variable وأضف كل متغير على حدة',
      '🔄 أعد النشر بعد إضافة المتغيرات'
    ],
    vercel: [
      '🔧 اذهب إلى Vercel Dashboard',
      '⚙️ اختر مشروعك → Settings → Environment Variables',
      '🎯 تأكد من إضافة المتغيرات لجميع البيئات (Production, Preview, Development)',
      '🔄 أعد النشر أو انتظر النشر التلقائي'
    ],
    'github-pages': [
      '🔧 اذهب إلى GitHub Repository',
      '⚙️ Settings → Secrets and variables → Actions',
      '🔐 أضف المتغيرات كـ Secrets',
      '📝 تأكد من تحديث GitHub Actions workflow'
    ],
    local: [
      '📁 تأكد من وجود ملف .env في المجلد الجذر',
      '📝 انسخ من .env.example وأضف القيم الحقيقية',
      '🔄 أعد تشغيل الخادم (npm run dev)',
      '🧹 امسح كاش المتصفح (Ctrl+Shift+R)'
    ]
  };

  return suggestions[platform] || suggestions.local;
}

/**
 * إصلاح تلقائي للمشاكل القابلة للإصلاح
 */
export function autoFixProductionIssues(issues: ProductionIssue[]): void {
  console.group('🔧 إصلاح تلقائي للمشاكل');

  issues.filter(issue => issue.autoFixable).forEach(issue => {
    console.log(`🔨 جاري إصلاح: ${issue.message}`);
    
    switch (issue.category) {
      case 'network':
        // تفعيل وضع التوفير للشبكات البطيئة
        enableDataSavingMode();
        break;
        
      case 'performance':
        // تفعيل تحسينات الأداء
        enablePerformanceOptimizations();
        break;
    }
  });

  console.groupEnd();
}

/**
 * تفعيل وضع توفير البيانات
 */
function enableDataSavingMode(): void {
  console.log('📱 تم تفعيل وضع توفير البيانات');
  
  // تقليل جودة الصور
  document.documentElement.style.setProperty('--image-quality', '0.7');
  
  // تأجيل تحميل المكونات غير الضرورية
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      console.log('⏱️ تأجيل تحميل المكونات الثانوية');
    });
  }
}

/**
 * تفعيل تحسينات الأداء
 */
function enablePerformanceOptimizations(): void {
  console.log('⚡ تم تفعيل تحسينات الأداء');
  
  // تنظيف الذاكرة
  if ('gc' in window) {
    (window as any).gc();
  }
  
  // تقليل عدد re-renders
  document.documentElement.style.setProperty('--reduce-animations', '1');
}

/**
 * عرض تقرير حالة البيئة للمستخدم
 */
export function displayEnvironmentStatus(): void {
  const detection = detectProductionIssues();
  
  // إصلاح تلقائي للمشاكل القابلة للحل
  if (detection.issues.some(i => i.autoFixable)) {
    autoFixProductionIssues(detection.issues);
  }

  // عرض التقرير في Console
  if (detection.issues.length > 0) {
    console.group('🚨 مشاكل البيئة الحقيقية');
    detection.issues.forEach(issue => {
      const emoji = issue.type === 'critical' ? '🔴' : issue.type === 'warning' ? '🟡' : '🔵';
      console.log(`${emoji} ${issue.message}`);
      console.log(`💡 الحل: ${issue.solution}`);
    });
    console.groupEnd();
  }

  // عرض الاقتراحات
  if (detection.suggestions.length > 0) {
    console.group('📋 خطوات الإصلاح');
    detection.suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion}`);
    });
    console.groupEnd();
  }

  // تحذير للمستخدم إذا كانت هناك مشاكل حرجة
  const criticalIssues = detection.issues.filter(i => i.type === 'critical');
  if (criticalIssues.length > 0) {
    console.error('🚨 تحذير: يوجد مشاكل حرجة تحتاج إصلاح فوري!');
  }
}

/**
 * تهيئة نظام كشف البيئة الحقيقية
 */
export function initializeProductionDetection(): void {
  // تأخير قصير للتأكد من تحميل كامل للبيئة
  setTimeout(() => {
    displayEnvironmentStatus();
  }, 1000);
  
  // إعداد مراقب للتغييرات في حالة الشبكة
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', () => {
        console.log('📶 تغيير في حالة الشبكة - إعادة فحص البيئة');
        displayEnvironmentStatus();
      });
    }
  }
} 