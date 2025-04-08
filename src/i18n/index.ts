
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import language resources
import en from './locales/en.json';
import ar from './locales/ar.json';

// Initialize i18next
i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar }
    },
    lng: localStorage.getItem('language') || 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    react: {
      useSuspense: false // Prevents suspense during loading
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    saveMissing: true,
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      console.log(`Missing translation - Language: ${lng}, Namespace: ${ns}, Key: ${key}, Fallback: ${fallbackValue}`);
    }
  });

// Helper to get current direction based on language
export const getDirection = (lang: string = i18n.language): 'ltr' | 'rtl' => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
};

// Export current direction
export const direction = getDirection();

export default i18n;
