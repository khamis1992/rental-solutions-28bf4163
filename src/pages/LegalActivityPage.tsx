import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { RecentLegalActivity } from '@/components/legal/activity/RecentLegalActivity';
import { Clock } from 'lucide-react';

const LegalActivityPage = () => {
  return (
    <PageContainer
      title="Recent Legal Activity"
      description="Latest updates from legal cases and documents"
      backLink="/legal"
    >
      <SectionHeader
        title="Recent Activity"
        description="Latest updates and changes"
        icon={Clock}
      />
      <div className="mt-6">
        <RecentLegalActivity />
      </div>
    </PageContainer>
  );
};

export default LegalActivityPage;
