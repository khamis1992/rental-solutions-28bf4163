
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { AlertTriangle } from 'lucide-react';
import TrafficFinesList from '@/components/traffic-fines/TrafficFinesList';

const TrafficFines = () => {
  return (
    <PageContainer
      title="Traffic Fines Management"
      description="Manage and track traffic fines for your fleet"
    >
      <SectionHeader
        title="Traffic Fines"
        description="View, pay, and dispute traffic fines for vehicles in your fleet"
        icon={AlertTriangle}
      />
      
      <div className="space-y-6">
        <TrafficFinesList />
      </div>
    </PageContainer>
  );
};

export default TrafficFines;
