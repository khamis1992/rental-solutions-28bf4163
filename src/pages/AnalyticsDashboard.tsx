
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { RentalMetricsDashboard } from '@/components/analytics/RentalMetricsDashboard';

const AnalyticsDashboard = () => {
  return (
    <PageContainer
      title="Analytics Dashboard"
      description="View detailed metrics and analytics for your rental business"
    >
      <RentalMetricsDashboard />
    </PageContainer>
  );
};

export default AnalyticsDashboard;
