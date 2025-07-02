
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/ui/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { FileText } from 'lucide-react';
import LegalDocuments from '@/components/legal/LegalDocuments';

const LegalDocumentsPage = () => {
  const { language } = useLanguage();
  return (
    <PageContainer>
      <PageHeader
        title="الوثائق"
        subtitle="إدارة القوالب والوثائق القانونية"
        icon={<FileText className="w-6 h-6 text-blue-500" />}
        align={language === 'ar' ? 'right' : 'left'}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      />
      <div className="mt-6" dir="rtl">
        <LegalDocuments />
      </div>
    </PageContainer>
  );
};

export default LegalDocumentsPage;
