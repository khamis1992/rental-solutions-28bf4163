
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SettingsIcon } from 'lucide-react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import LanguageSwitcher from '../LanguageSwitcher';
import { useTranslation } from '@/contexts/TranslationContext';

type NavbarProps = {
  className?: string;
};

export default function Navbar({ className = '' }: NavbarProps) {
  const navigate = useNavigate();
  const { t, isRTL } = useTranslation();
  
  const today = new Date();
  const formattedDate = format(today, 'EEEE, MMMM d, yyyy');

  return (
    <div className={cn('sticky top-0 z-50 w-full h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-8', className)}>
      <div className="flex h-16 items-center justify-between">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`${isRTL ? 'ml-4' : 'mr-4'}`}>
            <h1 className="text-xl font-semibold">{t('common.rentalSolutions')}</h1>
          </div>
        </div>
        
        <div className={`flex items-center space-x-4 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <div className={`flex items-center text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CalendarIcon className={`${isRTL ? 'mr-2' : 'mr-2'} h-4 w-4 opacity-70`} />
            <span className="text-muted-foreground">
              {t('common.systemDate')}: {formattedDate}
            </span>
          </div>
          
          <LanguageSwitcher />
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/settings')}
            className="h-8 w-8 rounded-full"
          >
            <SettingsIcon className="h-4 w-4" />
            <span className="sr-only">{t('common.settings')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
