import React from 'react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { LayoutDashboard, RefreshCw, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { createRTLButtonClasses } from '@/utils/arabic-rtl-utils';
import { runAndDisplayAgreementServiceTest } from '@/utils/agreement-service-test';

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
  
  // تحويل آمن للتاريخ إلى string
  const safeCurrentDate = React.useMemo(() => {
    if (typeof currentDate === 'string' && currentDate.trim().length > 0) {
      return currentDate;
    }
    
    // fallback إذا كانت القيمة object أو غير صالحة
    try {
      return new Date().toLocaleDateString('ar-QA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'التاريخ غير متوفر';
    }
  }, [currentDate]);

  const handleTestAgreementService = async () => {
    await runAndDisplayAgreementServiceTest();
  };

  return (
    <div className="flex flex-col sm:flex-row-reverse items-start sm:items-center justify-between gap-4 mb-6">
      <div className="text-right">
        <SectionHeader
          title="لوحة التحكم الرئيسية"
          description="نظرة شاملة على أداء النشاط التجاري"
          icon={LayoutDashboard}
        />
        <p className="text-sm text-muted-foreground mt-1">
          {String(safeCurrentDate)}
        </p>
      </div>
      
      <div className="flex gap-2">
        <Button
          onClick={handleTestAgreementService}
          variant="outline"
          size="sm"
          className={createRTLButtonClasses(language)}
        >
          <Stethoscope className="w-4 h-4 ml-2" />
          فحص العقود
        </Button>
        
        <Button
          onClick={onRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className={createRTLButtonClasses(language)}
        >
          <RefreshCw className={`w-4 h-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'جاري التحديث...' : 'تحديث البيانات'}
        </Button>
      </div>
    </div>
  );
};
