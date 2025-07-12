/**
 * Theme utilities لحل مشاكل الثيم وتجنب تعليق النظام
 */

export const THEME_STORAGE_KEY = 'theme';
export const THEME_CLASS_PREFIX = 'theme-';

// تنظيف الثيم من localStorage والDOM
export const clearTheme = (): void => {
  try {
    // إزالة من localStorage
    localStorage.removeItem(THEME_STORAGE_KEY);
    
    // إزالة من DOM
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    // إعادة تعيين إلى الافتراضي (light)
    root.classList.add('light');
    
    console.log('Theme cleared and reset to light mode');
  } catch (error) {
    console.error('Error clearing theme:', error);
  }
};

// فحص صحة الثيم المحفوظ
export const validateTheme = (theme: string): theme is 'light' | 'dark' | 'system' => {
  return ['light', 'dark', 'system'].includes(theme);
};

// إعدادات الثيم الافتراضية الآمنة
export const getDefaultTheme = (): 'light' | 'dark' | 'system' => {
  try {
    // تحقق من تفضيل النظام
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  } catch {
    // fallback آمن
    return 'light';
  }
};

// تحميل الثيم بطريقة آمنة
export const safeLoadTheme = (): 'light' | 'dark' | 'system' => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && validateTheme(saved)) {
      return saved as 'light' | 'dark' | 'system';
    }
    return getDefaultTheme();
  } catch (error) {
    console.error('Error loading theme:', error);
    return 'light'; // fallback آمن
  }
};

// حفظ الثيم بطريقة آمنة
export const safeSaveTheme = (theme: 'light' | 'dark' | 'system'): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error('Error saving theme:', error);
  }
};

// تطبيق الثيم على DOM بطريقة آمنة
export const safeApplyTheme = (theme: 'light' | 'dark'): void => {
  try {
    const root = document.documentElement;
    
    // إزالة الكلاسات السابقة
    root.classList.remove('light', 'dark');
    
    // إضافة الكلاس الجديد
    root.classList.add(theme);
    
    // تحديث meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const color = theme === 'dark' ? '#1f2937' : '#1e40af';
      metaThemeColor.setAttribute('content', color);
    }
    
    // إضافة CSS custom properties إذا لزم الأمر
    root.style.setProperty('--theme-mode', theme);
    
  } catch (error) {
    console.error('Error applying theme:', error);
    // fallback: إعادة تطبيق light theme
    try {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add('light');
    } catch {
      // إذا فشل كل شيء، أعد تحميل الصفحة
      window.location.reload();
    }
  }
};

// حل الثيم الفعلي من 'system'
export const resolveTheme = (theme: 'light' | 'dark' | 'system'): 'light' | 'dark' => {
  if (theme === 'system') {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light'; // fallback آمن
    }
  }
  return theme;
};

// فحص ودعم الثيم
export const isThemeSupported = (): boolean => {
  try {
    // فحص دعم localStorage
    const testKey = '__theme_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    
    // فحص دعم CSS classes
    const testEl = document.createElement('div');
    testEl.classList.add('dark');
    
    // فحص دعم matchMedia
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)');
    }
    
    return true;
  } catch {
    return false;
  }
};

// إعادة تعيين النظام عند حدوث مشاكل
export const resetThemeSystem = (): void => {
  try {
    console.log('Resetting theme system...');
    
    // مسح localStorage
    clearTheme();
    
    // إعادة تحميل الصفحة للتأكد من التطبيق الصحيح
    setTimeout(() => {
      window.location.reload();
    }, 100);
    
  } catch (error) {
    console.error('Error resetting theme system:', error);
    // إعادة تحميل فورية كملاذ أخير
    window.location.reload();
  }
};

// مراقب أخطاء الثيم
export const setupThemeErrorMonitoring = (): void => {
  // مراقبة أخطاء CSS
  window.addEventListener('error', (event) => {
    if (event.filename?.includes('theme') || event.message?.includes('theme')) {
      console.warn('Theme-related error detected:', event.message);
      // يمكن إضافة logic لإعادة تعيين الثيم هنا
    }
  });
  
  // مراقبة تغييرات النظام
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      try {
        const currentTheme = safeLoadTheme();
        if (currentTheme === 'system') {
          const newTheme = e.matches ? 'dark' : 'light';
          safeApplyTheme(newTheme);
        }
      } catch (error) {
        console.error('Error handling system theme change:', error);
      }
    });
  }
}; 