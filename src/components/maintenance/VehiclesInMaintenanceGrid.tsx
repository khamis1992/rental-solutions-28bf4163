
import React from 'react';
import { useNavigate } from 'react-router-dom';
import VehicleGrid from '@/components/vehicles/VehicleGrid';
import { useVehicleService } from '@/hooks/services/useVehicleService';
import { Vehicle, VehicleStatus } from '@/types/vehicle';

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
        <p>{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
      </div>
    );
  }

  // Transform raw vehicle data to ensure it matches the Vehicle type
  const safeVehicles: Vehicle[] = (vehicles || []).map((vehicle: any) => ({
    id: vehicle.id,
    make: vehicle.make || '',
    model: vehicle.model || '',
    year: vehicle.year || new Date().getFullYear(),
    license_plate: vehicle.license_plate || '',
    vin: vehicle.vin || vehicle.engine_number || vehicle.id || 'N/A',
    status: (vehicle.status as VehicleStatus) || 'available',
    color: vehicle.color,
    image_url: vehicle.image_url,
    mileage: vehicle.mileage || 0,
    rent_amount: vehicle.rent_amount || 0,
    created_at: vehicle.created_at || new Date().toISOString(),
    updated_at: vehicle.updated_at || new Date().toISOString(),
    description: vehicle.description,
    location: vehicle.location,
    insurance_company: vehicle.insurance_company,
    insurance_expiry: vehicle.insurance_expiry,
    vehicle_type_id: vehicle.vehicle_type_id,
    notes: vehicle.notes
  }));

  return (
    <VehicleGrid
      vehicles={safeVehicles}
      isLoading={isLoading}
      onVehicleClick={handleVehicleClick}
    />
  );
};

export default VehiclesInMaintenanceGrid;
