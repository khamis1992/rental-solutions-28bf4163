import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { Clock } from 'lucide-react';
import { LegalActivityFeed } from '@/components/legal/activity/LegalActivityFeed';

const LegalActivityPage = () => {
  return (
    <PageContainer 
      title="Legal Activity Log" 
      description="Track all legal activities and updates"
    >
      <SectionHeader 
        title="Activity Feed" 
        description="Monitor legal case activities, compliance updates, and system changes" 
        icon={Clock} 
      />
      
      <div className="mt-6">
        <LegalActivityFeed />
      </div>
    </PageContainer>
  );
};

export default LegalActivityPage;
