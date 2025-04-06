import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import i18n from '@/i18n';
import { toast } from 'sonner';

type Direction = 'ltr' | 'rtl';

interface TranslationContextProps {
  language: string;
  direction: Direction;
  isRTL: boolean;
  changeLanguage: (lang: string) => void;
  t: (key: string) => string; // Using the simplified translation function
  getNumberFormat: (num: number) => string;
}

const TranslationContext = createContext<TranslationContextProps>({
  language: 'en',
  direction: 'ltr',
  isRTL: false,
  changeLanguage: () => {},
  t: (key) => key, // Default to returning the key if no translation is found
  getNumberFormat: (num) => num.toString(),
});

export const useTranslation = () => useContext(TranslationContext);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const [direction, setDirection] = useState<Direction>(language === 'ar' ? 'rtl' : 'ltr');
  const isRTL = useMemo(() => direction === 'rtl', [direction]);

  const changeLanguage = useCallback((lang: string) => {
    try {
      console.log(`Changing language to: ${lang}`);

      // Safety check to ensure it's a supported language
      if (lang !== 'en' && lang !== 'ar') {
        console.error(`Unsupported language: ${lang}`);
        toast.error("Unsupported language requested");
        return;
      }

      i18n.changeLanguage(lang);
      setLanguage(lang);
      localStorage.setItem('language', lang);

      const newDirection = lang === 'ar' ? 'rtl' : 'ltr';
      setDirection(newDirection);

      // Set HTML dir attribute for the entire document
      document.documentElement.dir = newDirection;
      document.documentElement.lang = lang;

      // Add/remove direction-specific class to body for global styling
      if (newDirection === 'rtl') {
        document.body.classList.add('rtl-mode');

        // Load Arabic font if not already loaded
        if (!document.getElementById('arabic-font')) {
          const link = document.createElement('link');
          link.id = 'arabic-font';
          link.rel = 'stylesheet';
          link.href = 'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap';
          document.head.appendChild(link);

          // Add Arabic font class to body
          document.body.classList.add('font-arabic');
        }
      } else {
        document.body.classList.remove('rtl-mode');
        document.body.classList.remove('font-arabic');
      }

      console.log(`Language changed successfully to: ${lang}, direction: ${newDirection}`);

      // Avoid showing toast for initial language setup
      if (document.readyState === 'complete') {
        toast.success(`Language changed to ${lang === 'en' ? 'English' : 'العربية'}`);
      }
    } catch (error) {
      console.error('Error changing language:', error);
      toast.error("Failed to change language");
    }
  }, []);

  // Function to format numbers according to locale
  const getNumberFormat = (num: number): string => {
    if (isRTL) {
      // For Arabic, use Arabic numerals
      return new Intl.NumberFormat('ar-SA').format(num);
    }
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Initialize direction on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && savedLanguage !== language) {
      changeLanguage(savedLanguage);
    } else {
      // Still set the direction even if the language hasn't changed
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;

      // Add direction-specific class to body
      if (language === 'ar') {
        document.body.classList.add('rtl-mode');

        // Load Arabic font if not already loaded
        if (!document.getElementById('arabic-font')) {
          const link = document.createElement('link');
          link.id = 'arabic-font';
          link.rel = 'stylesheet';
          link.href = 'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap';
          document.head.appendChild(link);

          // Add Arabic font class to body
          document.body.classList.add('font-arabic');
        }
      } else {
        document.body.classList.remove('rtl-mode');
        document.body.classList.remove('font-arabic');
      }
    }
  }, [language, changeLanguage]);

  return (
    <TranslationContext.Provider
      value={{
        language,
        direction,
        isRTL,
        changeLanguage,
        t: i18n.t, // Use i18n.t for translation
        getNumberFormat,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};