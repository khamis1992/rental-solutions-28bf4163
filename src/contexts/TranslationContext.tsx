
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n/i18n';
import { supabase } from '@/integrations/supabase/client';

type SupportedLanguage = 'en' | 'ar' | 'fr' | 'es';

interface TranslationContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => Promise<void>;
  isRTL: boolean;
  translate: (text: string, targetLang?: SupportedLanguage) => Promise<string>;
  translateBatch: (texts: string[], targetLang?: SupportedLanguage) => Promise<string[]>;
  loading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const useTranslationContext = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslationContext must be used within a TranslationProvider');
  }
  return context;
};

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [loading, setLoading] = useState(false);
  const isRTL = currentLanguage === 'ar';

  // Initialize language from localStorage or browser preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('i18nextLng') as SupportedLanguage || 'en';
    setCurrentLanguage(savedLanguage);
    
    // Apply RTL styling if needed
    if (savedLanguage === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.classList.add('rtl');
    }
  }, []);

  const setLanguage = async (language: SupportedLanguage) => {
    try {
      setLoading(true);
      await changeLanguage(language);
      setCurrentLanguage(language);
      
      // Store user preference in localStorage
      localStorage.setItem('i18nextLng', language);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to translate text on demand (outside of i18next)
  const translate = async (text: string, targetLang?: SupportedLanguage): Promise<string> => {
    if (!text) return '';
    
    const target = targetLang || currentLanguage;
    if (target === 'en') return text;
    
    try {
      const { data, error } = await supabase.functions.invoke('translate', {
        body: {
          text,
          sourceLanguage: 'en',
          targetLanguage: target
        }
      });
      
      if (error) {
        console.error('Translation error:', error);
        return text;
      }
      
      return data.translations || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };

  // Function to translate multiple texts at once
  const translateBatch = async (texts: string[], targetLang?: SupportedLanguage): Promise<string[]> => {
    if (!texts || texts.length === 0) return [];
    
    const target = targetLang || currentLanguage;
    if (target === 'en') return texts;
    
    try {
      const { data, error } = await supabase.functions.invoke('translate', {
        body: {
          text: texts,
          sourceLanguage: 'en',
          targetLanguage: target
        }
      });
      
      if (error) {
        console.error('Batch translation error:', error);
        return texts;
      }
      
      return data.translations || texts;
    } catch (error) {
      console.error('Batch translation error:', error);
      return texts;
    }
  };

  const value = {
    currentLanguage,
    setLanguage,
    isRTL,
    translate,
    translateBatch,
    loading
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};
