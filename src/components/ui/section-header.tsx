

import { LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { language } = useLanguage();
  
  return (
    <div className={cn(
      "mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4",
      language === 'ar' && "md:flex-row-reverse",
      className
    )} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className={cn(
        "flex items-center",
        language === 'ar' && "flex-row-reverse"
      )}>
        {Icon && (
          <div className={cn(
            "p-2 rounded-md bg-primary/10 text-primary",
            language === 'ar' ? "ml-3" : "mr-3"
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className={language === 'ar' ? 'text-right' : 'text-left'}>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      
      {actions && (
        <div className={cn(
          "flex items-center",
          language === 'ar' ? "space-x-reverse space-x-2" : "space-x-2"
        )}>
          {actions}
        </div>
      )}
    </div>
  );
};

export { SectionHeader };

