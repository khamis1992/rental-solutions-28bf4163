
import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '@/i18n';
import { translateText } from '@/utils/translation-api';

type Direction = 'ltr' | 'rtl';

interface TranslationContextProps {
  language: string;
  direction: Direction;
  isRTL: boolean;
  changeLanguage: (lang: string) => void;
  translateText: (text: string, targetLang?: string) => Promise<string>;
}

const TranslationContext = createContext<TranslationContextProps>({
  language: 'en',
  direction: 'ltr',
  isRTL: false,
  changeLanguage: () => {},
  translateText: async () => '',
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
      
      const newDirection = lang === 'ar' ? 'rtl' : 'ltr';
      setDirection(newDirection);
      
      // Set HTML dir attribute for the entire document
      document.documentElement.dir = newDirection;
      document.documentElement.lang = lang;
      
      console.log(`Language changed successfully to: ${lang}, direction: ${newDirection}`);
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
        isRTL,
        changeLanguage, 
        translateText: translateTextFn
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};
