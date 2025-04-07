
import React from 'react';
import { useParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import VehicleDetail from '@/components/vehicles/VehicleDetail';

const VehicleDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <PageContainer 
        title="Vehicle Not Found" 
        description="The vehicle ID is missing"
        backLink="/vehicles"
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Vehicle ID is missing. Please go back and select a vehicle.
          </AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Vehicle Details"
      description="View detailed information about this vehicle"
      backLink="/vehicles"
    >
      <VehicleDetail vehicleId={id} />
    </PageContainer>
  );
};

export default VehicleDetailPage;
