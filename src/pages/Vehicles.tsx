
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import VehicleGrid from '@/components/vehicles/VehicleGrid';
import { Car, Plus } from 'lucide-react';
import { CustomButton } from '@/components/ui/custom-button';
import VehicleFilters, { VehicleFilterValues } from '@/components/vehicles/VehicleFilters';
import { Vehicle } from '@/types/vehicle';

const Vehicles = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<VehicleFilterValues>({});

  const handleSelectVehicle = (id: string) => {
    navigate(`/vehicles/${id}`);
  };

  const handleAddVehicle = () => {
    navigate('/vehicles/add');
  };

  const handleFilterChange = (newFilters: VehicleFilterValues) => {
    setFilters(newFilters);
  };
  
  // Convert VehicleFilterValues to Partial<Vehicle> for the Grid component
  const convertFiltersToVehiclePartial = (filters: VehicleFilterValues): Partial<Vehicle> => {
    const result: Partial<Vehicle> = {};
    
    if (filters.status) result.status = filters.status;
    if (filters.make) result.make = filters.make;
    if (filters.location) result.location = filters.location;
    if (filters.year) result.year = filters.year;
    
    // Only add category if it's a valid category from the Vehicle type
    if (filters.category) {
      const category = filters.category as Vehicle['category'];
      if (category) result.category = category;
    }
    
    return result;
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
        filter={convertFiltersToVehiclePartial(filters)}
      />
    </PageContainer>
  );
};

export default Vehicles;
