import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { FileText } from 'lucide-react';
import LegalDocuments from '@/components/legal/LegalDocuments';

const LegalDocumentsPage = () => {
  return (
    <PageContainer
      title="Legal Documents"
      description="Manage legal templates and documents"
      backLink="/legal"
    >
      <SectionHeader
        title="Documents"
        description="Manage legal templates and documents"
        icon={FileText}
      />
      <div className="mt-6">
        <LegalDocuments />
      </div>
    </PageContainer>
  );
};

export default LegalDocumentsPage;
