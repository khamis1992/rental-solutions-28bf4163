import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { Gavel } from 'lucide-react';
import LegalCaseManagement from '@/components/legal/LegalCaseManagement';

const LegalCasesPage = () => {
  return (
    <PageContainer
      title="Legal Cases"
      description="Manage and track legal cases"

    >
      <SectionHeader
        title="Legal Cases"
        description="Manage and track legal cases"
        icon={Gavel}
      />
      <div className="mt-6">
        <LegalCaseManagement />
      </div>
    </PageContainer>
  );
};

export default LegalCasesPage;
