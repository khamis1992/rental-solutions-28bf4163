
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { MaintenanceList } from '@/components/maintenance/MaintenanceList';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { SectionHeader } from '@/components/ui/section-header';
import { Wrench } from 'lucide-react';

const Maintenance = () => {
  const { t } = useI18nTranslation();
  
  return (
    <PageContainer>
      <SectionHeader
        title={t('maintenance.management')}
        description={t('maintenance.description')}
        icon={Wrench}
      />
      <MaintenanceList />
    </PageContainer>
  );
};

export default Maintenance;
