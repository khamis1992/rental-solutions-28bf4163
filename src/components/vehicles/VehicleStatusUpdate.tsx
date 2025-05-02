
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { VehicleStatusSearch } from './VehicleStatusSearch';
import { VehicleStatusUpdateForm } from './VehicleStatusUpdateForm';
import { DatabaseVehicleRecord, VehicleStatus } from '@/types/vehicle';
import { mapDBStatusToAppStatus } from '@/lib/vehicles/vehicle-mappers';

const VehicleStatusUpdate = () => {
  const [step, setStep] = useState<'search' | 'update'>('search');
  const [vehicle, setVehicle] = useState<DatabaseVehicleRecord | null>(null);

  const handleVehicleFound = (foundVehicle: DatabaseVehicleRecord) => {
    setVehicle(foundVehicle);
    setStep('update');
  };

  const handleStatusUpdated = () => {
    setStep('search');
    setVehicle(null);
  };

  const handleCancel = () => {
    setStep('search');
    setVehicle(null);
  };

  return (
    <Card>
      {step === 'search' ? (
        <VehicleStatusSearch onVehicleFound={handleVehicleFound} />
      ) : (
        <VehicleStatusUpdateForm 
          vehicle={{
            id: vehicle!.id,
            make: vehicle!.make,
            model: vehicle!.model,
            license_plate: vehicle!.license_plate,
            status: mapDBStatusToAppStatus(vehicle!.status) || 'available'
          }} 
          onStatusUpdated={handleStatusUpdated} 
          onCancel={handleCancel} 
        />
      )}
    </Card>
  );
};

export default VehicleStatusUpdate;
