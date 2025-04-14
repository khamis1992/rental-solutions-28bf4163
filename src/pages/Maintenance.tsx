
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { MaintenanceList } from '@/components/maintenance/MaintenanceList';

const Maintenance = () => {
  return (
    <PageContainer 
      title="Vehicle Maintenance" 
      description="Track maintenance records and schedule service for your vehicles"
      systemDate={new Date()} // Explicitly passing current date
    >
      <MaintenanceList />
    </PageContainer>
  );
};

export default Maintenance;
