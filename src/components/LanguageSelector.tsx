
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTranslationContext } from '@/contexts/TranslationContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'default' | 'outline' | 'ghost';
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'outline' }) => {
  const { t } = useTranslation();
  const { currentLanguage, setLanguage, loading } = useTranslationContext();
  
  const languages = [
    { code: 'en', name: t('languages.en') },
    { code: 'ar', name: t('languages.ar') },
    { code: 'fr', name: t('languages.fr') },
    { code: 'es', name: t('languages.es') }
  ];
  
  // Get current language display name
  const currentLanguageName = languages.find(lang => lang.code === currentLanguage)?.name || 'English';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size="sm" 
          className="gap-2"
          disabled={loading}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden md:inline">{currentLanguageName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => setLanguage(language.code as any)}
            className="gap-2"
          >
            {language.code === currentLanguage && (
              <span className="mr-1">✓</span>
            )}
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
