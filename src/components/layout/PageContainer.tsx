
import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import Header from './Header';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';
import { getDirectionalClasses, getDirectionalFlexClass } from '@/utils/rtl-utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  backLink?: string;
  actions?: React.ReactNode;
  systemDate?: Date;
  notification?: string; // Added the notification property
}

const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  className,
  title,
  description,
  backLink,
  actions,
  systemDate = new Date(), // Default to current date
  notification
}) => {
  const { t } = useI18nTranslation();
  const { direction, isRTL } = useTranslation();
  
  // Memoize expensive calculations
  const containerClasses = useMemo(() => {
    const sidebarPaddingClass = isRTL ? 'pr-64' : 'pl-64';
    return `min-h-screen ${sidebarPaddingClass} w-full transition-all duration-300`;
  }, [isRTL]);
  
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;
  const flexClass = getDirectionalFlexClass();
  
  // Memoize the formatted date to avoid recalculation
  const formattedDate = useMemo(() => formatDate(systemDate), [systemDate]);
  
  return (
    <div className={containerClasses} dir={direction}>
      <Header />
      <main className={cn("p-6 animate-fade-in", className)}>
        {backLink && (
          <Link 
            to={backLink} 
            className={`inline-flex items-center mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors ${flexClass}`}
          >
            <BackArrow className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
            {t('common.back')}
          </Link>
        )}
        
        <div className={`mb-6 flex flex-col sm:${flexClass} sm:items-center sm:justify-between`}>
          <div className={cn(isRTL ? 'text-right' : '')}>
            {title && <h1 className="text-2xl font-bold tracking-tight">{title}</h1>}
            {description && <p className="text-muted-foreground mt-1">{description}</p>}
            {notification && <p className="text-sm text-amber-600 mt-1">{notification}</p>}
            <p className="text-xs text-muted-foreground mt-1">{t('common.systemDate')}: {formattedDate}</p>
          </div>
          {actions && (
            <div className="mt-4 sm:mt-0">{actions}</div>
          )}
        </div>
        
        {children}
      </main>
    </div>
  );
};

export default React.memo(PageContainer);
