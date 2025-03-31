
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  return (
    <Button
      variant="outline"
      onClick={toggleLanguage}
      className="fixed bottom-4 right-4 px-4 py-2 z-50"
    >
      {i18n.language === 'ar' ? 'English' : 'العربية'}
    </Button>
  );
};
