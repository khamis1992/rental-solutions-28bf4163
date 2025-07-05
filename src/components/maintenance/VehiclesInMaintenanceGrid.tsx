import React from 'react';
import { useNavigate } from 'react-router-dom';
import VehicleGrid from '@/components/vehicles/VehicleGrid';
import { useVehicleService } from '@/hooks/services/useVehicleService';
import { Vehicle } from '@/types/vehicle';
import { VehicleStatus } from '@/lib/database/database-types';

const VehiclesInMaintenanceGrid = () => {
  const navigate = useNavigate();
  
  // Use the vehicle service with a filter for maintenance status
  const { vehicles, isLoadingVehicles } = useVehicleService({ 
    filters: { 
      statuses: ['maintenance'] as VehicleStatus[]
    } 
  });

  // Navigate to the vehicle detail page when clicked
  const handleVehicleClick = (id: string) => {
    navigate(`/vehicles/${id}`);
  };

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
      isLoading={isLoadingVehicles}
      onVehicleClick={handleVehicleClick}
    />
  );
};

export default VehiclesInMaintenanceGrid;
