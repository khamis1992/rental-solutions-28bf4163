
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useEffect } from 'react';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();
  
  const changeLanguage = (lang: 'en' | 'ar') => {
    // Save language preference to localStorage
    localStorage.setItem('preferredLanguage', lang);
    
    // Change language in i18n
    i18n.changeLanguage(lang);
    
    // Update document direction
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  // Initialize language from localStorage if available
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage') as 'en' | 'ar' | null;
    if (savedLanguage && savedLanguage !== i18n.language) {
      changeLanguage(savedLanguage);
    }
  }, []);

  return {
    t,
    i18n,
    changeLanguage,
    currentLanguage: i18n.language,
    isRTL: i18n.language === 'ar'
  };
};
