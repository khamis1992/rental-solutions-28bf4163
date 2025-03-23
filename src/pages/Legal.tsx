
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { Gavel } from 'lucide-react';
import CustomerLegalObligations from '@/components/legal/CustomerLegalObligations';

const Legal = () => {
  return (
    <PageContainer
      title="Legal Management"
      description="Manage legal documents, compliance requirements, and legal cases"
    >
      <SectionHeader
        title="Legal Management"
        description="Track and manage all legal aspects of your fleet operations"
        icon={Gavel}
      />
      
      <CustomerLegalObligations />
    </PageContainer>
  );
};

export default Legal;
