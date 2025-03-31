
import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useEffect } from 'react';

interface LanguageSwitcherProps {
  variant?: 'outline' | 'ghost' | 'default';
  className?: string;
  showLabel?: boolean;
  position?: 'fixed' | 'inline';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'outline',
  className = '',
  showLabel = true,
  position = 'fixed'
}) => {
  const { t, changeLanguage, currentLanguage } = useTranslation();
  const [language, setLanguage] = useState(currentLanguage);

  // Update state when language changes from outside this component
  useEffect(() => {
    setLanguage(currentLanguage);
  }, [currentLanguage]);

  // Update when the application language changes
  useEffect(() => {
    const handleLanguageChanged = () => {
      setLanguage(document.documentElement.lang === 'ar' ? 'ar' : 'en');
    };

    window.addEventListener('language-changed', handleLanguageChanged);
    return () => {
      window.removeEventListener('language-changed', handleLanguageChanged);
    };
  }, []);

  const toggleLanguage = async () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang); // Update state immediately for responsiveness
    await changeLanguage(newLang);
  };

  const positionClass = position === 'fixed' ? 'fixed bottom-4 right-4 z-50' : '';

  return (
    <Button
      variant={variant}
      onClick={toggleLanguage}
      className={`${positionClass} ${className}`}
      aria-label={t('common.changeLanguage')}
    >
      <Globe className="h-4 w-4 mr-2" />
      {showLabel && (language === 'ar' ? 'English' : 'العربية')}
    </Button>
  );
};
