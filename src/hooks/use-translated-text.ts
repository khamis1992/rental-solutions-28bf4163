import { useState, useEffect } from 'react';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';

/**
 * Hook to handle text translations with proper fallbacks and caching
 * @param key Translation key
 * @param defaultText Default text if translation not found
 * @returns The translated text
 */
export const useTranslatedText = (key: string, defaultText: string) => {
  const { t } = useI18nTranslation();
  const { isRTL, translateText } = useTranslation();
  const [translatedText, setTranslatedText] = useState('');
  
  useEffect(() => {
    const loadTranslation = async () => {
      try {
        // First try to get from i18n
        const i18nText = t(key, defaultText);
        
        // If we're not in RTL mode, we can just use the i18n text
        if (!isRTL) {
          setTranslatedText(i18nText);
          return;
        }
        
        // If in RTL mode and text is different from key, use it
        if (i18nText !== key) {
          setTranslatedText(i18nText);
          return;
        }
        
        // Otherwise use the fallback with dynamic translation
        const dynamicText = await translateText(defaultText);
        setTranslatedText(dynamicText || defaultText);
      } catch (error) {
        console.error(`Error translating text for key ${key}:`, error);
        setTranslatedText(defaultText);
      }
    };
    
    loadTranslation();
  }, [key, defaultText, t, translateText, isRTL]);
  
  return translatedText || t(key, defaultText);
};

/**
 * Hook to handle multiple text translations at once
 * @param translations Array of {key, defaultText} objects
 * @returns Object with translated texts keyed by original keys
 */
export const useBatchTranslatedText = (
  translations: Array<{ key: string, defaultText: string }>
) => {
  const { t } = useI18nTranslation();
  const { isRTL, translateText } = useTranslation();
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const results: Record<string, string> = {};
        
        // Process all translations
        for (const { key, defaultText } of translations) {
          // First try to get from i18n
          const i18nText = t(key, defaultText);
          
          // If we're not in RTL mode, or text is different from key, use it
          if (!isRTL || i18nText !== key) {
            results[key] = i18nText;
          } else {
            // Otherwise use the fallback with dynamic translation
            const dynamicText = await translateText(defaultText);
            results[key] = dynamicText || defaultText;
          }
        }
        
        setTranslatedTexts(results);
      } catch (error) {
        console.error('Error batch translating texts:', error);
        
        // Use fallbacks in case of error
        const fallbacks = translations.reduce((acc, { key, defaultText }) => {
          acc[key] = t(key, defaultText);
          return acc;
        }, {} as Record<string, string>);
        
        setTranslatedTexts(fallbacks);
      }
    };
    
    loadTranslations();
  }, [translations, t, translateText, isRTL]);
  
  return translatedTexts;
};
