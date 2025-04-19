
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { AlertTriangle } from 'lucide-react';
import { TrafficFinesTable } from '@/components/fines/TrafficFinesTable';

const TrafficFines = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Traffic Fines"
        description="Manage and track all traffic fines"
        icon={AlertTriangle}
      />
      
      <div className="mt-6">
        <TrafficFinesTable />
      </div>
    </PageContainer>
  );
};

export default TrafficFines;
