
import React from 'react';
import { Bell, Settings, Search, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import LanguageSelector from '@/components/settings/LanguageSelector';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';
import { getDirectionalClasses } from '@/utils/rtl-utils';

const Header = () => {
  const { t } = useI18nTranslation();
  const { isRTL } = useTranslation();
  
  return (
    <header className="w-full h-16 px-6 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-border/40 sticky top-0 z-50">
      <div className="flex items-center">
        <div className="hidden md:flex h-10 w-10 rounded-md bg-primary text-primary-foreground items-center justify-center font-semibold text-xl">
          RS
        </div>
        <div className={`hidden md:block ${getDirectionalClasses('ml-4')} font-medium text-lg`}>
          {t('common.rentalSolutions')}
        </div>
      </div>
      
      <div className="flex-1 max-w-md mx-4 relative hidden md:block">
        <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input 
          type="text" 
          placeholder={t('common.search')} 
          className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 text-sm bg-secondary border-none rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20`} 
        />
      </div>
      
      <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-4`}>
        <LanguageSelector variant="compact" />
      </div>
    </header>
  );
};

export default Header;
