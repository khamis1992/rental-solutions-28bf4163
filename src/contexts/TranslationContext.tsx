
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import i18n from '@/i18n';
import { translateText } from '@/utils/translation-api';
import { toast } from 'sonner';

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
      } else {
        document.body.classList.remove('rtl-mode');
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

  // Function to translate text dynamically
  const translateTextFn = async (text: string, targetLang?: string): Promise<string> => {
    if (!text) return '';
    
    const target = targetLang || language;
    if (target === 'en') return text; // Don't translate if target is English
    
    try {
      return await translateText(text, 'en', target);
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    }
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
      } else {
        document.body.classList.remove('rtl-mode');
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
        translateText: translateTextFn
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};
