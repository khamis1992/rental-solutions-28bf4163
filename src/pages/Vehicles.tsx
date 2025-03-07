
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import VehicleGrid from '@/components/vehicles/VehicleGrid';
import { Car, Plus } from 'lucide-react';
import { CustomButton } from '@/components/ui/custom-button';
import VehicleFilters, { VehicleFilterValues } from '@/components/vehicles/VehicleFilters';
import { VehicleFilterParams } from '@/types/vehicle';
import { useVehicles } from '@/hooks/use-vehicles';

const Vehicles = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<VehicleFilterParams>({});
  const { useRealtimeUpdates } = useVehicles();
  
  // Setup real-time updates
  useRealtimeUpdates();

  const handleSelectVehicle = (id: string) => {
    navigate(`/vehicles/${id}`);
  };

  const handleAddVehicle = () => {
    navigate('/vehicles/add');
  };

  const handleFilterChange = (newFilters: VehicleFilterValues) => {
    // Convert from VehicleFilterValues to VehicleFilterParams
    const convertedFilters: VehicleFilterParams = {};
    
    if (newFilters.status) convertedFilters.status = newFilters.status;
    if (newFilters.make) convertedFilters.make = newFilters.make;
    if (newFilters.location) convertedFilters.location = newFilters.location;
    if (newFilters.year) convertedFilters.year = newFilters.year;
    
    // Handle the category to vehicle_type_id mapping
    if (newFilters.category) {
      convertedFilters.vehicle_type_id = newFilters.category;
    }
    
    setFilters(convertedFilters);
  };
  
  return (
    <PageContainer>
      <SectionHeader
        title="Vehicle Management"
        description="Manage your fleet inventory"
        icon={Car}
        actions={
          <CustomButton size="sm" glossy onClick={handleAddVehicle}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </CustomButton>
        }
      />
      
      <VehicleFilters 
        onFilterChange={handleFilterChange} 
        className="mb-6"
      />
      
      <VehicleGrid 
        onSelectVehicle={handleSelectVehicle} 
        filter={filters}
      />
    </PageContainer>
  );
};

export default Vehicles;
