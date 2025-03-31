
import React from 'react';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export const LanguageSwitcher = () => {
  const { changeLanguage, currentLanguage, isRTL } = useTranslation();

  const toggleLanguage = () => {
    changeLanguage(currentLanguage === 'ar' ? 'en' : 'ar');
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleLanguage}
      className={`fixed ${isRTL ? 'left-4' : 'right-4'} bottom-4 z-50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60`}
      title={currentLanguage === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      <Languages className="h-4 w-4" />
    </Button>
  );
};
