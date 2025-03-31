
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleLanguage}
      className={`fixed bottom-4 ${i18n.language === 'ar' ? 'left-4' : 'right-4'}`}
    >
      <Languages className="h-4 w-4" />
    </Button>
  );
};
