import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import ComplianceCalendar from '@/components/legal/ComplianceCalendar';
import { Calendar } from 'lucide-react';

const LegalCalendarPage = () => {
  return (
    <PageContainer
      title="Compliance Calendar"
      description="Track upcoming compliance deadlines and regulatory requirements"

    >
      <SectionHeader
        title="Compliance Calendar"
        description="View regulatory deadlines and obligations"
        icon={Calendar}
      />
      <div className="mt-6">
        <ComplianceCalendar />
      </div>
    </PageContainer>
  );
};

export default LegalCalendarPage;
