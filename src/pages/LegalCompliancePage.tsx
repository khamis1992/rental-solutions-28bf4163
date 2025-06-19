import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import ComplianceReporting from '@/components/legal/ComplianceReporting';
import { Shield } from 'lucide-react';

const LegalCompliancePage = () => {
  return (
    <PageContainer
      title="Compliance Reporting"
      description="Analyze and monitor legal compliance across your organization"

    >
      <SectionHeader
        title="Compliance Reporting"
        description="Detailed compliance analytics and upcoming obligations"
        icon={Shield}
      />
      <div className="mt-6">
        <ComplianceReporting />
      </div>
    </PageContainer>
  );
};

export default LegalCompliancePage;
