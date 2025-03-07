
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import VehicleGrid from '@/components/vehicles/VehicleGrid';
import { Car, Plus } from 'lucide-react';
import { CustomButton } from '@/components/ui/custom-button';
import VehicleFilters, { VehicleFilterValues } from '@/components/vehicles/VehicleFilters';

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
