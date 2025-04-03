
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n/i18n';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      
      // Provide visual feedback
      toast.success(`Language changed to ${language === 'en' ? 'English' : 
                    language === 'ar' ? 'Arabic' : 
                    language === 'fr' ? 'French' : 'Spanish'}`);
    } catch (error) {
      console.error('Failed to change language:', error);
      toast.error(`Failed to change language: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to translate text on demand (outside of i18next)
  const translate = async (text: string, targetLang?: SupportedLanguage): Promise<string> => {
    if (!text) return '';
    
    const target = targetLang || currentLanguage;
    if (target === 'en') return text;
    
    console.log(`Translating text: "${text}" to ${target}`);
    
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
        toast.error(`Translation failed: ${error.message}`);
        return text;
      }
      
      console.log('Translation result:', data);
      
      if (!data || !data.translations) {
        console.error('Invalid translation response:', data);
        return text;
      }
      
      return data.translations || text;
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(`Translation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return text;
    }
  };

  // Function to translate multiple texts at once
  const translateBatch = async (texts: string[], targetLang?: SupportedLanguage): Promise<string[]> => {
    if (!texts || texts.length === 0) return [];
    
    const target = targetLang || currentLanguage;
    if (target === 'en') return texts;
    
    console.log(`Batch translating ${texts.length} items to ${target}`);
    console.log('Texts to translate:', texts);
    
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
        toast.error(`Batch translation failed: ${error.message}`);
        return texts;
      }
      
      console.log('Batch translation result:', data);
      
      if (!data || !data.translations) {
        console.error('Invalid batch translation response:', data);
        return texts;
      }
      
      return data.translations || texts;
    } catch (error) {
      console.error('Batch translation error:', error);
      toast.error(`Batch translation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
