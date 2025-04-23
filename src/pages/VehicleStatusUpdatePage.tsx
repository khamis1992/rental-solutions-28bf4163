
import React from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import PageContainer from '@/components/layout/PageContainer';
import VehicleStatusUpdate from '@/components/vehicles/VehicleStatusUpdate';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { CustomButton } from '@/components/ui/custom-button';
import { useNavigate } from 'react-router-dom';

const VehicleStatusUpdatePage = () => {
  const navigate = useNavigate();
  
  return (
    <PageContainer>
      <SectionHeader
        title="Vehicle Status Update"
        description="Update a vehicle's status using its ID or license plate"
        icon={RefreshCw}
        actions={
          <CustomButton 
            size="sm" 
            variant="outline" 
            onClick={() => navigate('/vehicles')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vehicles
          </CustomButton>
        }
      />
      
      <div className="section-transition max-w-md mx-auto">
        <VehicleStatusUpdate />
      </div>
    </PageContainer>
  );
};

export default VehicleStatusUpdatePage;
