
import React from 'react';
import { useTranslation } from '@/contexts/TranslationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { getDirectionalClasses, getDirectionalFlexClass } from '@/utils/rtl-utils';

interface LanguageSelectorProps {
  onValueChange?: (value: string) => void;
  variant?: 'default' | 'compact';
  showIcon?: boolean;
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  onValueChange, 
  variant = 'default',
  showIcon = true,
  className = ''
}) => {
  const { language, changeLanguage, isRTL } = useTranslation();
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
    <div className={`flex items-center ${getDirectionalFlexClass()} ${isCompact ? 'gap-2' : 'gap-3'} ${className}`}>
      {showIcon && <Globe className={`${isCompact ? 'h-4 w-4' : 'h-5 w-5'} text-muted-foreground`} />}
      
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className={`${isCompact ? 'h-8 py-1 px-2' : ''} min-w-[110px]`}>
          <SelectValue placeholder={t('settings.language')}>
            {getLanguageLabel(language)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align={isRTL ? 'end' : 'start'} className={isRTL ? 'text-right' : ''}>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="ar" className="font-arabic font-medium">العربية</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector;
