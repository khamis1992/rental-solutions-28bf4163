import React from 'react';
import { useNavigate } from 'react-router-dom';
import VehicleGrid from '@/components/vehicles/VehicleGrid';
import { useVehicleService } from '@/hooks/services/useVehicleService';

const VehiclesInMaintenanceGrid = () => {
  const navigate = useNavigate();
  
  // Use the vehicle service with a filter for maintenance and accident status
  const { vehicles, isLoading, error } = useVehicleService({
    statuses: ['maintenance', 'accident']
  });

  // Navigate to the vehicle detail page when clicked
  const handleVehicleClick = (id: string) => {
    navigate(`/vehicles/${id}`);
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
        <p className="font-medium">Error loading vehicles in maintenance</p>
        <p>{error?.message || 'An unknown error occurred'}</p>
      </div>
    );
  }

  return (
    <VehicleGrid
      vehicles={vehicles}
      isLoading={isLoading}
      onVehicleClick={handleVehicleClick}
    />
  );
};

export default VehiclesInMaintenanceGrid;
