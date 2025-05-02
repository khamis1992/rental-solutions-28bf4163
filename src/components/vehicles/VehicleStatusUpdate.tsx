
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { VehicleData } from '@/types/vehicle';
import { VehicleStatusSearch } from './VehicleStatusSearch';
import { VehicleStatusUpdateForm } from './VehicleStatusUpdateForm';

const VehicleStatusUpdate = () => {
  const [step, setStep] = useState<'search' | 'update'>('search');
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);

  const handleVehicleFound = (foundVehicle: VehicleData) => {
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
          vehicle={vehicle!} 
          onStatusUpdated={handleStatusUpdated} 
          onCancel={handleCancel} 
        />
      )}
    </Card>
  );
};

export default VehicleStatusUpdate;
