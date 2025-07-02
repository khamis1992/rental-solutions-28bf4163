

import { StatusConfig } from './types';
import { LucideIcon } from 'lucide-react';
import { useTranslation } from '@/utils/translation-helper';
import { useLanguage } from '@/contexts/LanguageContext';

interface StatusListItemProps {
  status: StatusConfig;
  count: number;
  onClick: () => void;
}

export const StatusListItem: React.FC<StatusListItemProps> = ({
  status,
  count,
  onClick
}) => {
  const Icon = status.icon as LucideIcon;
  const { t } = useTranslation();
  const { language } = useLanguage();
  
  return (
    <div 
      key={status.key} 
      className={cn(
        "flex items-center p-3 rounded-md cursor-pointer transition-colors hover:bg-slate-100",
        language === 'ar' ? 'flex-row-reverse gap-3' : 'gap-3',
        status.key === 'stolen' || status.key === 'accident' || status.key === 'critical' 
          ? "bg-red-50 hover:bg-red-100 border border-red-200" 
          : "bg-slate-50 hover:bg-slate-100 border border-slate-200"
      )}
      onClick={onClick}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className={`flex-grow ${language === 'ar' ? 'text-right' : 'text-left'}`}>
        <div className={`flex justify-between items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <span className={`text-sm font-semibold text-blue-600 ${language === 'ar' ? 'ml-2' : 'mr-2'}`}>
            {count}
          </span>
          <span className="text-sm font-medium text-gray-800">
            {status.name}
          </span>
        </div>
        <p className={`text-xs text-muted-foreground mt-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
          {status.description}
        </p>
      </div>
      <div 
        className="p-2 rounded-md flex-shrink-0" 
        style={{ backgroundColor: `${status.color}20` }}
      >
        <Icon 
          className="text-primary"
          size={18}
          color={status.color}
        />
      </div>
    </div>
  );
};
