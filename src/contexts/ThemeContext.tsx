import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSafeSettings } from './SettingsContext';
import { 
  safeLoadTheme, 
  safeSaveTheme, 
  safeApplyTheme, 
  resolveTheme,
  setupThemeErrorMonitoring,
  resetThemeSystem
} from '@/utils/theme-utils';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  isLoading: boolean;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);
  const { getSetting, updateSetting } = useSafeSettings();
  
  // إعداد مراقبة الأخطاء
  useEffect(() => {
    setupThemeErrorMonitoring();
  }, []);

  // تحديث الثيم الآمن
  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      const resolved = resolveTheme(newTheme);
      setResolvedTheme(resolved);
      safeApplyTheme(resolved);
      
      // حفظ في localStorage
      safeSaveTheme(newTheme);
      
      // حفظ في قاعدة البيانات (بدون await لتجنب التأخير)
      Promise.all([
        updateSetting('dark_mode', newTheme === 'dark'),
        updateSetting('theme', newTheme)
      ]).catch(error => {
        console.error('Error updating theme in database:', error);
        // عدم إيقاف العملية حتى لو فشل حفظ DB
      });
      
    } catch (error) {
      console.error('Error updating theme:', error);
      // fallback: إعادة تعيين إلى الثيم المحفوظ
      const fallbackTheme = safeLoadTheme();
      setThemeState(fallbackTheme);
      const fallbackResolved = resolveTheme(fallbackTheme);
      setResolvedTheme(fallbackResolved);
      safeApplyTheme(fallbackResolved);
    }
  };

  // إعادة تعيين الثيم
  const resetTheme = () => {
    try {
      resetThemeSystem();
    } catch (error) {
      console.error('Error resetting theme:', error);
    }
  };

  // تحميل الثيم عند بدء التطبيق
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        // تحميل الثيم بطريقة آمنة
        let finalTheme: Theme = safeLoadTheme();
        
        // محاولة الحصول على إعدادات قاعدة البيانات (بدون تأخير)
        try {
          const dbDarkMode = getSetting('dark_mode', false);
          const dbTheme = getSetting('theme', 'system') as Theme;
          
          if (dbTheme && ['light', 'dark', 'system'].includes(dbTheme)) {
            finalTheme = dbTheme;
          } else if (dbDarkMode) {
            finalTheme = 'dark';
          }
        } catch (dbError) {
          console.warn('Could not load theme from database, using localStorage:', dbError);
          // المتابعة مع الثيم من localStorage
        }
        
        setThemeState(finalTheme);
        const resolved = resolveTheme(finalTheme);
        setResolvedTheme(resolved);
        safeApplyTheme(resolved);
        
      } catch (error) {
        console.error('Error initializing theme:', error);
        // fallback: استخدام light theme
        setThemeState('light');
        setResolvedTheme('light');
        safeApplyTheme('light');
      } finally {
        setIsLoading(false);
      }
    };

    // تأخير قصير لضمان تحميل Providers
    const timer = setTimeout(initializeTheme, 50);
    return () => clearTimeout(timer);
  }, [getSetting]);

  // الاستماع لتغييرات system theme
  useEffect(() => {
    if (theme === 'system') {
      try {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleChange = () => {
          try {
            const resolved = resolveTheme('system');
            setResolvedTheme(resolved);
            safeApplyTheme(resolved);
          } catch (error) {
            console.error('Error handling system theme change:', error);
          }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } catch (error) {
        console.error('Error setting up system theme listener:', error);
      }
    }
  }, [theme]);

  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    resolvedTheme,
    isLoading,
    resetTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    // fallback values for safety
    return {
      theme: 'light',
      setTheme: () => {},
      resolvedTheme: 'light',
      isLoading: false,
      resetTheme: () => {},
    };
  }
  return context;
}; 