
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import PerformanceDashboard from '@/components/performance/PerformanceDashboard';
import { Activity } from 'lucide-react';

const PerformanceMonitor = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Performance Monitoring"
        description="Monitor and optimize application performance"
        icon={Activity}
      />
      
      <PerformanceDashboard />
    </PageContainer>
  );
};

export default PerformanceMonitor;
