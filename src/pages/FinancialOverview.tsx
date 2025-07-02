
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/ui/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import UnifiedFinancialDashboard from '@/components/financials/UnifiedFinancialDashboard';
import { BarChart2 } from 'lucide-react';

const FinancialOverview = () => {
  const { language } = useLanguage();

  return (
    <PageContainer>
      <PageHeader
        title={language === 'ar' ? "النظرة العامة المالية" : "Financial Overview"}
        subtitle={language === 'ar' ? "لوحة تحكم شاملة للوضع المالي والإيرادات مع الأقساط" : "Comprehensive dashboard of financial status, revenue and installments"}
        icon={<BarChart2 className="w-6 h-6 text-blue-500" />}
        align={language === 'ar' ? 'right' : 'left'}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      />
      
      <div className="space-y-6">
        <UnifiedFinancialDashboard />
      </div>
    </PageContainer>
  );
};

export default FinancialOverview; 