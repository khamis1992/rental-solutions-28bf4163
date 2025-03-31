
import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

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

  const toggleLanguage = () => {
    const newLang = currentLanguage === 'ar' ? 'en' : 'ar';
    changeLanguage(newLang);
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
      {showLabel && (currentLanguage === 'ar' ? 'English' : 'العربية')}
    </Button>
  );
};
