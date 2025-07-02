
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/ui/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import CarInstallmentContracts from '@/components/financials/car-installments/CarInstallmentContracts';
import { FileSpreadsheet } from 'lucide-react';

const FinancialInstallments = () => {
  const { language } = useLanguage();

  return (
    <PageContainer>
      <PageHeader
        title={language === 'ar' ? "الأقساط" : "Installments"}
        subtitle={language === 'ar' ? "إدارة عقود التقسيط ومتابعة المدفوعات" : "Manage installment contracts and track payments"}
        icon={<FileSpreadsheet className="w-6 h-6 text-blue-500" />}
        align={language === 'ar' ? 'right' : 'left'}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      />
      
      <div className="space-y-6">
        <CarInstallmentContracts />
      </div>
    </PageContainer>
  );
};

export default FinancialInstallments; 