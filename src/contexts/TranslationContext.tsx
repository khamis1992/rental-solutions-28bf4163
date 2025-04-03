
import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '@/i18n';

type Direction = 'ltr' | 'rtl';

interface TranslationContextProps {
  language: string;
  direction: Direction;
  changeLanguage: (lang: string) => void;
}

const TranslationContext = createContext<TranslationContextProps>({
  language: 'en',
  direction: 'ltr',
  changeLanguage: () => {},
});

export const useTranslation = () => useContext(TranslationContext);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const [direction, setDirection] = useState<Direction>(language === 'ar' ? 'rtl' : 'ltr');

  const changeLanguage = (lang: string) => {
    try {
      console.log(`Changing language to: ${lang}`);
      i18n.changeLanguage(lang);
      setLanguage(lang);
      localStorage.setItem('language', lang);
      setDirection(lang === 'ar' ? 'rtl' : 'ltr');
      
      // Set HTML dir attribute for the entire document
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      
      console.log(`Language changed successfully to: ${lang}`);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  // Initialize direction on mount
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  return (
    <TranslationContext.Provider value={{ language, direction, changeLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
};
