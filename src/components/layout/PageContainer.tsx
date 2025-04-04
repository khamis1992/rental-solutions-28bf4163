
import React from 'react';
import { cn } from '@/lib/utils';
import Header from './Header';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';
import { getDirectionalClasses } from '@/utils/rtl-utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  backLink?: string;
  actions?: React.ReactNode;
  systemDate?: Date;
}

const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  className,
  title,
  description,
  backLink,
  actions,
  systemDate = new Date() // Default to current date instead of fixed date
}) => {
  const { t } = useI18nTranslation();
  const { direction, isRTL } = useTranslation();
  
  // Choose the appropriate arrow icon based on direction
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;
  
  return (
    <div className={`min-h-screen ${isRTL ? 'pr-64' : 'pl-64'} w-full`} dir={direction}>
      <Header />
      <main className={cn("p-6 animate-fade-in", className)}>
        {backLink && (
          <Link 
            to={backLink} 
            className={`inline-flex items-center mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <BackArrow className={`${getDirectionalClasses(isRTL ? 'ml-1' : 'mr-1')} h-4 w-4`} />
            {t('common.back')}
          </Link>
        )}
        
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h1 className="text-2xl font-bold tracking-tight">{title}</h1>}
            {description && <p className="text-muted-foreground mt-1">{description}</p>}
            <p className="text-xs text-muted-foreground mt-1">{t('common.systemDate')}: {formatDate(systemDate)}</p>
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

export default PageContainer;
