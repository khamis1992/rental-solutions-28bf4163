
import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '@/i18n/locales/en.json';
import ar from '@/i18n/locales/ar.json';

type TranslationContextType = {
  t: (key: string) => string;
  setLanguage: (lang: string) => void;
  language: string;
  translations: Record<string, any>;
  isRTL: boolean;
};

const languages = {
  en,
  ar,
};

const defaultLanguage = 'en';

const TranslationContext = createContext<TranslationContextType>({
  t: () => '',
  setLanguage: () => {},
  language: defaultLanguage,
  translations: languages[defaultLanguage as keyof typeof languages],
  isRTL: false,
});

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState(defaultLanguage);
  const [translations, setTranslations] = useState(languages[defaultLanguage as keyof typeof languages]);

  useEffect(() => {
    // Check for stored language preference
    const storedLanguage = localStorage.getItem('language');
    if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'ar')) {
      setLanguage(storedLanguage);
    }
  }, []);

  useEffect(() => {
    // Update translations when language changes
    setTranslations(languages[language as keyof typeof languages] || languages.en);
    localStorage.setItem('language', language);
    
    // Set document direction based on language
    if (language === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
      document.body.classList.add('rtl');
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
      document.body.classList.remove('rtl');
    }
  }, [language]);

  const translate = (key: string): string => {
    if (!key) return '';
    
    // Navigate nested translation objects (e.g., "common.save")
    const keys = key.split('.');
    let result = translations;
    
    for (const k of keys) {
      if (result && result[k]) {
        result = result[k];
      } else {
        // Return key if translation not found
        return key;
      }
    }
    
    return typeof result === 'string' ? result : key;
  };

  const contextValue: TranslationContextType = {
    t: translate,
    setLanguage,
    language,
    translations,
    isRTL: language === 'ar',
  };

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);

export default TranslationContext;
