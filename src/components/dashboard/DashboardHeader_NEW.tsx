

import { SectionHeader } from '@/components/ui/section-header';
import { LayoutDashboard, RefreshCw, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { createRTLButtonClasses } from '@/utils/arabic-rtl-utils';

interface DashboardHeaderProps {
  currentDate: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  currentDate,
  isRefreshing,
  onRefresh
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  return (
    <div 
      className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 ${language === 'ar' ? 'md:flex-row-reverse' : ''}`} 
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse justify-start md:justify-end' : ''}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`${createRTLButtonClasses()} ${language === 'ar' ? 'flex-row-reverse' : ''}`}
        >
          <RefreshCw className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'} ${isRefreshing ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/system-settings')}
          className={`${createRTLButtonClasses()} ${language === 'ar' ? 'flex-row-reverse' : ''}`}
        >
          <Settings className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          الإعدادات
        </Button>
      </div>
      <div className={`flex items-center ${language === 'ar' ? 'justify-start md:justify-start' : ''}`}>
        <div className={`p-2 rounded-md bg-primary/10 text-primary ${language === 'ar' ? 'mr-3' : 'ml-3'}`}>
          <LayoutDashboard className="h-5 w-5" />
        </div>
        <div className={`${language === 'ar' ? 'text-left' : 'text-right'}`}>
          <h2 
            className={`text-2xl font-bold tracking-tight ${language === 'ar' ? 'text-left arabic-title' : ''}`}
            style={language === 'ar' ? { textAlign: 'left', direction: 'rtl' } : {}}
          >
            لوحة التحكم
          </h2>
          <p 
            className={`text-muted-foreground mt-1 ${language === 'ar' ? 'text-left arabic-subtitle' : ''}`}
            style={language === 'ar' ? { textAlign: 'left', direction: 'rtl' } : {}}
          >
            نظرة شاملة على عمليات التأجير • {currentDate}
          </p>
        </div>
      </div>
    </div>
  );
}; 