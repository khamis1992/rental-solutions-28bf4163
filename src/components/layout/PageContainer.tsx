
import React from 'react';
import { cn } from '@/lib/utils';
import Header from './Header';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

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
  return (
    <div className="min-h-screen pl-64 w-full">
      <Header />
      <main className={cn("p-6 animate-fade-in", className)}>
        {backLink && (
          <Link 
            to={backLink} 
            className="inline-flex items-center mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        )}
        
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h1 className="text-2xl font-bold tracking-tight">{title}</h1>}
            {description && <p className="text-muted-foreground mt-1">{description}</p>}
            <p className="text-xs text-muted-foreground mt-1">System Date: {formatDate(systemDate)}</p>
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
