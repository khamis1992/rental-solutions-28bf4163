
import React, { useMemo } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { getDirectionalFlexClass } from '@/utils/rtl-utils';

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

  // Memoize values that don't change often
  const containerClasses = useMemo(() => {
    const isCompact = variant === 'compact';
    const flexClass = getDirectionalFlexClass();
    return `flex items-center ${flexClass} ${isCompact ? 'gap-2' : 'gap-3'} ${className}`;
  }, [variant, className]);
  
  const selectTriggerClasses = useMemo(() => {
    const isCompact = variant === 'compact';
    return `${isCompact ? 'h-8 py-1 px-2' : ''} min-w-[110px]`;
  }, [variant]);
  
  const iconClasses = useMemo(() => {
    const isCompact = variant === 'compact';
    return `${isCompact ? 'h-4 w-4' : 'h-5 w-5'} text-muted-foreground`;
  }, [variant]);
  
  // Optimize language label lookup with a memoized map
  const getLanguageLabel = useMemo(() => {
    const labels: Record<string, string> = {
      'en': 'English',
      'ar': 'العربية',
    };
    return (lang: string) => labels[lang] || lang;
  }, []);

  return (
    <div className={containerClasses}>
      {showIcon && <Globe className={iconClasses} />}
      
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className={selectTriggerClasses}>
          <SelectValue placeholder={t('settings.language')}>
            {getLanguageLabel(language)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align={isRTL ? 'end' : 'start'} className={isRTL ? 'text-right' : ''}>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="ar" className="font-arabic">العربية</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default React.memo(LanguageSelector);
