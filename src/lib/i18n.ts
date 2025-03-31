
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from '../locales/en/translation.json';
import arTranslation from '../locales/ar/translation.json';

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      ar: { translation: arTranslation }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    supportedLngs: ['en', 'ar'],
    load: 'languageOnly',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'preferredLanguage'
    },
    react: {
      useSuspense: false // This helps prevent issues during initial load
    }
  });

// Set initial direction and language attribute
const setDocumentAttributes = (lang: string) => {
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
};

// Set initial direction based on detected language
setDocumentAttributes(i18n.language);

// Listen for language changes
i18n.on('languageChanged', (lang) => {
  setDocumentAttributes(lang);
});

export default i18n;
