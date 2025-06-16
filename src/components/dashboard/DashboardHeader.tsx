
import React from 'react';
import { Button } from '@/components/ui/button';
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
      className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6" 
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Right side - Arabic title and description */}
      <div className={`${language === 'ar' ? 'order-1 md:order-1 w-full md:w-auto' : 'order-2'}`}>
        <div className={`flex items-center ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>
          <div className={`p-2 rounded-md bg-primary/10 text-primary ${language === 'ar' ? 'ml-3' : 'mr-3'}`}>
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div className="text-right">
            <h2 
              className="text-2xl font-bold tracking-tight"
              style={{ textAlign: 'right', direction: 'rtl' }}
            >
              تفاصيل العقد
            </h2>
            <p 
              className="text-muted-foreground mt-1"
              style={{ textAlign: 'right', direction: 'rtl' }}
            >
              عرض وإدارة تفاصيل عقد الإيجار
            </p>
          </div>
        </div>
      </div>

      {/* Left side - Action buttons and system date */}
      <div className={`flex flex-col gap-2 ${language === 'ar' ? 'order-2 md:order-2' : 'order-1'}`}>
        <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
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
        {/* System date stays in current position */}
        <p className="text-sm text-muted-foreground">
          System Date: {currentDate}
        </p>
      </div>
    </div>
  );
}; 
