
import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

const SectionHeader = ({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: SectionHeaderProps) => {
  const { isRTL } = useTranslation();
  
  return (
    <div className={cn("mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4", className)}>
      <div className="flex items-center">
        {Icon && (
          <div className={`p-2 rounded-md bg-primary/10 text-primary ${isRTL ? 'ml-3' : 'mr-3'}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
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
    </div>
  );
};

export { SectionHeader };
