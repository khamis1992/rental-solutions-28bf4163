
import { useTranslation as useI18nTranslation } from 'react-i18next';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();
  
  const changeLanguage = (lang: 'en' | 'ar') => {
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  return {
    t,
    i18n,
    changeLanguage,
    currentLanguage: i18n.language,
    isRTL: i18n.language === 'ar'
  };
};
