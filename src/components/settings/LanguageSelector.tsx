
import React from 'react';
import { useTranslation } from '@/contexts/TranslationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { getDirectionalClasses } from '@/utils/rtl-utils';

interface LanguageSelectorProps {
  onValueChange?: (value: string) => void;
  variant?: 'default' | 'compact';
  showIcon?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  onValueChange, 
  variant = 'default',
  showIcon = true 
}) => {
  const { language, changeLanguage, direction, isRTL } = useTranslation();
  const { t } = useI18nTranslation();

  const handleLanguageChange = (value: string) => {
    changeLanguage(value);
    if (onValueChange) {
      onValueChange(value);
    }
  };

  const isCompact = variant === 'compact';
  
  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'en': return 'English';
      case 'ar': return 'العربية';
      default: return lang;
    }
  };

  return (
    <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} ${isCompact ? 'gap-1' : 'gap-2'}`}>
      {showIcon && <Globe className={`${isCompact ? 'h-4 w-4' : 'h-5 w-5'} text-muted-foreground`} />}
      
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className={`${isCompact ? 'h-8 py-1 px-2' : ''} min-w-[110px]`}>
          <SelectValue placeholder={t('settings.language')}>
            {getLanguageLabel(language)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align={isRTL ? 'end' : 'start'}>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="ar">العربية</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector;
