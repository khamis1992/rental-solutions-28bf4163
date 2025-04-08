
import React from 'react';
import { Bell, Settings, Search, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import LanguageSelector from '@/components/settings/LanguageSelector';
import { useTranslation as useI18nTranslation } from 'react-i18next';

const Header = () => {
  const { t } = useI18nTranslation();
  
  return (
    <header className="w-full h-16 px-6 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-border/40 sticky top-0 z-50">
      <div className="flex items-center">
        <div className="hidden md:flex h-10 w-10 rounded-md bg-primary text-primary-foreground items-center justify-center font-semibold text-xl">
          RS
        </div>
        <div className="hidden md:block ml-4 font-medium text-lg">Rental Solutions</div>
      </div>
      
      <div className="flex-1 max-w-md mx-4 relative hidden md:block">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input 
          type="text" 
          placeholder={t('common.search')} 
          className="w-full pl-10 pr-4 py-2 text-sm bg-secondary border-none rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" 
        />
      </div>
      
      <div className="flex items-center space-x-4">
        <LanguageSelector variant="compact" />
      </div>
    </header>
  );
};

export default Header;
