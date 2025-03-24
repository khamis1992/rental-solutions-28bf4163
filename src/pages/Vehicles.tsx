
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import VehicleGrid from '@/components/vehicles/VehicleGrid';
import { Car, Plus } from 'lucide-react';
import { CustomButton } from '@/components/ui/custom-button';
import VehicleFilters, { VehicleFilterValues } from '@/components/vehicles/VehicleFilters';
import { VehicleFilterParams } from '@/types/vehicle';
import { useVehicles } from '@/hooks/use-vehicles';
import { toast } from 'sonner';

const Vehicles = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<VehicleFilterParams>({});
  const { useRealtimeUpdates } = useVehicles();
  
  // Setup real-time updates
  useRealtimeUpdates();

  // Get status from URL search params
  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    
    if (statusFromUrl) {
      setFilters(prevFilters => ({ 
        ...prevFilters,
        status: statusFromUrl
      }));
      
      // Show a toast to indicate filtered view
      toast.info(`Showing vehicles with status: ${statusFromUrl}`);
    }
  }, [searchParams]);

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
        initialValues={{
          status: filters.status as string || '',
          make: filters.make || '',
          location: filters.location || '',
          year: filters.year?.toString() || '',
          category: filters.vehicle_type_id || ''
        }}
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
