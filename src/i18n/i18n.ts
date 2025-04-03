
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { supabase } from '@/integrations/supabase/client';

// Default translations (English)
import enTranslation from './locales/en.json';

// Initialize i18next with English translations
i18n
  .use(LanguageDetector) // Detects user language
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources: {
      en: {
        translation: enTranslation
      }
    },
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    // Detect language changes
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

// Translation cache
const translationCache: Record<string, Record<string, string>> = {};

/**
 * Loads translations for a specific language
 * @param language Language code to load
 */
export const loadLanguage = async (language: string): Promise<void> => {
  // Skip if it's English (already loaded) or already in resources
  if (language === 'en' || i18n.hasResourceBundle(language, 'translation')) {
    return;
  }

  try {
    // Check if we have cached translations
    if (translationCache[language]) {
      // Add cached translations to i18next
      i18n.addResourceBundle(language, 'translation', translationCache[language]);
      return;
    }

    // Try to fetch existing translations from local storage
    const cachedTranslations = localStorage.getItem(`i18n_${language}`);
    if (cachedTranslations) {
      const translations = JSON.parse(cachedTranslations);
      translationCache[language] = translations;
      i18n.addResourceBundle(language, 'translation', translations);
      return;
    }

    // If no cached translations, translate English resources
    const englishTranslations = enTranslation;
    const keys = Object.keys(englishTranslations);
    
    // Batch the translations to avoid exceeding API limits
    const batchSize = 50;
    const translations: Record<string, string> = {};
    
    // Process in batches
    for (let i = 0; i < keys.length; i += batchSize) {
      const batchKeys = keys.slice(i, i + batchSize);
      const batchTexts = batchKeys.map(key => englishTranslations[key]);
      
      // Call our Supabase Edge Function for translation
      const { data, error } = await supabase.functions.invoke('translate', {
        body: {
          text: batchTexts,
          sourceLanguage: 'en',
          targetLanguage: language
        }
      });
      
      if (error) {
        console.error('Translation error:', error);
        throw new Error(`Translation failed: ${error.message}`);
      }
      
      // Add the translated texts to our translations object
      batchKeys.forEach((key, index) => {
        translations[key] = data.translations[index];
      });
    }
    
    // Cache the translations
    translationCache[language] = translations;
    localStorage.setItem(`i18n_${language}`, JSON.stringify(translations));
    
    // Add to i18next
    i18n.addResourceBundle(language, 'translation', translations);
    
  } catch (error) {
    console.error(`Failed to load ${language} translations:`, error);
    // Fall back to English if translation fails
  }
};

// Function to change the current language
export const changeLanguage = async (language: string): Promise<void> => {
  try {
    await loadLanguage(language);
    await i18n.changeLanguage(language);
    
    // Update document direction for RTL languages
    const isRTL = ['ar', 'he', 'fa', 'ur'].includes(language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    
    // Add a class to the document for RTL-specific styling
    if (isRTL) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

export default i18n;
