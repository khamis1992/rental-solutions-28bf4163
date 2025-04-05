
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';

export interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  backLink?: string;
  notification?: string;
  actions?: React.ReactNode;
}

const PageContainer = ({
  children,
  title,
  description,
  className,
  backLink,
  notification,
  actions
}: PageContainerProps) => {
  const { isRTL } = useTranslation();
  
  return (
    <div className={cn('container max-w-7xl py-6 space-y-6', className)}>
      {/* Header Section with optional back link */}
      {(title || description || backLink || actions) && (
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              {backLink && (
                <Link 
                  to={backLink} 
                  className={cn(
                    "flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors",
                    isRTL && "flex-row-reverse"
                  )}
                >
                  <ArrowLeft className={cn("h-4 w-4", isRTL ? "ml-1 rotate-180" : "mr-1")} />
                  {isRTL ? "رجوع" : "Back"}
                </Link>
              )}
              
              {title && (
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              )}
              
              {description && (
                <p className="text-muted-foreground">{description}</p>
              )}
            </div>
            
            {actions && (
              <div className="flex-shrink-0">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Notification Alert */}
      {notification && (
        <Alert className={cn("bg-muted/50 border border-muted", isRTL && "text-right")}>
          <div className="flex items-center gap-2">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              {notification}
            </AlertDescription>
          </div>
        </Alert>
      )}
      
      {/* Main Content */}
      {children}
    </div>
  );
};

export default PageContainer;
