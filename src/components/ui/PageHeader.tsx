import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
  dir?: 'ltr' | 'rtl';
  children?: React.ReactNode;
}

const PageHeader = ({
  title,
  subtitle,
  description,
  icon,
  actions,
  className,
  align = 'left',
  dir = 'ltr',
  children,
}: PageHeaderProps) => {
  const alignmentClasses = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center',
  };

  const flexDirection = dir === 'rtl' ? 'flex-row-reverse' : 'flex-row';

  return (
    <div 
      className={cn(
        "mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4",
        className
      )}
      dir={dir}
    >
      <div className={cn("flex items-center", flexDirection)}>
        {icon && (
          <div className={cn(
            "p-2 rounded-md bg-primary/10 text-primary",
            dir === 'rtl' ? 'ml-3' : 'mr-3'
          )}>
            {icon}
          </div>
        )}
        <div className={alignmentClasses[align]}>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          )}
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      )}
      
      {children}
    </div>
  );
};

export default PageHeader; 