
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { VehicleFilterSidebar } from '@/components/vehicles/VehicleFilterSidebar';
import VehicleGrid from '@/components/vehicles/VehicleGrid';
import { VehicleFilterParams } from '@/types/vehicle';

const Vehicles = () => {
  const [filters, setFilters] = React.useState<VehicleFilterParams>({});
  const navigate = useNavigate();

  const handleSelectVehicle = (id: string) => {
    navigate(`/vehicles/${id}`);
  };

  const handleFilterChange = (newFilters: VehicleFilterParams) => {
    setFilters(newFilters);
  };

  return (
    <PageContainer>
      <div className="flex min-h-screen">
        <VehicleFilterSidebar onFilterChange={handleFilterChange} />
        <div className="flex-1 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">966 vehicles to rent</h1>
            <select className="border rounded-lg px-4 py-2 bg-background">
              <option>Closest to me</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Newest First</option>
            </select>
          </div>
          <VehicleGrid 
            onSelectVehicle={handleSelectVehicle} 
            filter={filters}
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default Vehicles;
