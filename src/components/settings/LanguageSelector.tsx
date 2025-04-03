
import React from 'react';
import { useTranslation } from '@/contexts/TranslationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation as useI18nTranslation } from 'react-i18next';

interface LanguageSelectorProps {
  onValueChange?: (value: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onValueChange }) => {
  const { language, changeLanguage } = useTranslation();
  const { t } = useI18nTranslation();

  const handleLanguageChange = (value: string) => {
    changeLanguage(value);
    if (onValueChange) {
      onValueChange(value);
    }
  };

  return (
    <Select value={language} onValueChange={handleLanguageChange}>
      <SelectTrigger>
        <SelectValue placeholder={t('settings.language')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="ar">العربية</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
