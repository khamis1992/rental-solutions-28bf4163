import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/ui/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { RecentLegalActivity } from '@/components/legal/activity/RecentLegalActivity';
import { Clock } from 'lucide-react';

const LegalActivityPage = () => {
  const { language } = useLanguage();
  return (
    <PageContainer
      title="النشاط القانوني الحديث"
      description="آخر التحديثات من القضايا والوثائق القانونية"
      backLink="/legal"
    >
      <PageHeader
        title="النشاط الحديث"
        subtitle="آخر التحديثات والتغييرات"
        icon={<Clock className="w-6 h-6 text-blue-500" />}
        align={language === 'ar' ? 'right' : 'left'}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      />
      <div className="mt-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <RecentLegalActivity />
      </div>
    </PageContainer>
  );
};

export default LegalActivityPage;
