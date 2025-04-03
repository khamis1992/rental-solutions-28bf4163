
import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '@/i18n';
import { translateText } from '@/utils/translation-api';

type Direction = 'ltr' | 'rtl';

interface TranslationContextProps {
  language: string;
  direction: Direction;
  changeLanguage: (lang: string) => void;
  translateText: (text: string, targetLang?: string) => Promise<string>;
  isRTL: boolean;
}

const TranslationContext = createContext<TranslationContextProps>({
  language: 'en',
  direction: 'ltr',
  changeLanguage: () => {},
  translateText: async () => '',
  isRTL: false,
});

export const useTranslation = () => useContext(TranslationContext);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const [direction, setDirection] = useState<Direction>(language === 'ar' ? 'rtl' : 'ltr');
  const isRTL = direction === 'rtl';

  const changeLanguage = (lang: string) => {
    try {
      console.log(`Changing language to: ${lang}`);
      i18n.changeLanguage(lang);
      setLanguage(lang);
      localStorage.setItem('language', lang);
      setDirection(lang === 'ar' ? 'rtl' : 'ltr');
      
      // Set HTML dir attribute for the entire document
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
      
      console.log(`Language changed successfully to: ${lang}`);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  // Function to translate text dynamically
  const translateTextFn = async (text: string, targetLang?: string): Promise<string> => {
    if (!text) return '';
    
    const target = targetLang || language;
    if (target === 'en') return text; // Don't translate if target is English
    
    return await translateText(text, 'en', target);
  };

  // Initialize direction on mount
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  return (
    <TranslationContext.Provider 
      value={{ 
        language, 
        direction, 
        changeLanguage, 
        translateText: translateTextFn,
        isRTL
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};
