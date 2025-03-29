
import React from 'react';
import { useParams } from 'react-router-dom';
import { MobileInspectionForm } from '@/components/inspections/MobileInspectionForm';
import PageContainer from '@/components/layout/PageContainer';

const MobileInspection = () => {
  const { vehicleId } = useParams();

  return (
    <PageContainer
      title="Vehicle Inspection"
      description="Complete digital vehicle inspection form"
    >
      <div className="max-w-lg mx-auto">
        <MobileInspectionForm 
          vehicleId={vehicleId!} 
          onComplete={() => window.history.back()}
        />
      </div>
    </PageContainer>
  );
};

export default MobileInspection;
