import React from 'react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { LayoutDashboard, RefreshCw } from 'lucide-react';
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
      className="relative bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border border-border/20 rounded-2xl p-6 mb-8 shadow-sm backdrop-blur-sm" 
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent rounded-2xl"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
      
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        {/* Header content */}
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-sm"></div>
              <div className="relative p-3 rounded-xl bg-background/80 border border-primary/20 shadow-sm">
                <LayoutDashboard className="h-6 w-6 text-primary" />
              </div>
            </div>
            
            <div className="space-y-1">
              <h1 
                className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent leading-tight"
                style={{ textAlign: 'right', direction: 'rtl' }}
              >
                لوحة التحكم الرئيسية
              </h1>
              <div className="flex flex-col gap-1">
                <p 
                  className="text-muted-foreground text-base font-medium"
                  style={{ textAlign: 'right', direction: 'rtl' }}
                >
                  إدارة شاملة لأسطول المركبات والعقود
                </p>
                <p 
                  className="text-sm text-muted-foreground/80 font-normal"
                  style={{ textAlign: 'right', direction: 'rtl' }}
                >
                  {currentDate ? String(currentDate) : 'التاريخ غير متوفر'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-10 px-4 bg-background/50 border-border/60 hover:bg-background/80 hover:border-primary/30 transition-all duration-200 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </Button>
        </div>
      </div>
    </div>
  );
};
