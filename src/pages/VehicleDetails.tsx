
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useVehicles } from '@/hooks/use-vehicles';

const VehicleDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useById } = useVehicles();
  const { data: vehicle, isLoading, error } = useById(id || '');

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <p>Loading vehicle details...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !vehicle) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p>Error loading vehicle details.</p>
          <Button onClick={() => navigate('/vehicles')}>Back to Vehicles</Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={() => navigate('/vehicles')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vehicles
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mt-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">
            {vehicle.make} {vehicle.model} ({vehicle.year})
          </h1>
          <p className="text-muted-foreground">
            {vehicle.vin}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vehicle details */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Details</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>Make:</div>
                <div>{vehicle.make}</div>
                <div>Model:</div>
                <div>{vehicle.model}</div>
                <div>Year:</div>
                <div>{vehicle.year}</div>
                <div>VIN:</div>
                <div>{vehicle.vin}</div>
                <div>License Plate:</div>
                <div>{vehicle.license_plate}</div>
                <div>Status:</div>
                <div>{vehicle.status}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2 pt-6">
          <Button onClick={() => navigate(`/vehicles/${id}/edit`)}>
            Edit Vehicle
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate(`/vehicles/${id}/status-update`)}
          >
            Update Status
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}

export default VehicleDetails;
