import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import VehicleGrid from '@/components/vehicles/VehicleGrid';
import { Car, Plus, RefreshCw } from 'lucide-react';
import { CustomButton } from '@/components/ui/custom-button';
import VehicleFilters, { VehicleFilterValues } from '@/components/vehicles/VehicleFilters';
import { VehicleFilterParams, VehicleStatus } from '@/types/vehicle';
import { useVehicles } from '@/hooks/use-vehicles';
import { toast } from 'sonner';

// Define valid statuses based on database enum
const VALID_STATUSES: VehicleStatus[] = [
  'available',
  'rented',
  'reserved',
  'maintenance',
  'police_station',
  'accident',
  'stolen',
  'retired'
];

const Vehicles = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<VehicleFilterParams>({
    status: 'all',
    make: '',
    model: '',
    year: 0,
    minYear: 0,
    maxYear: 0,
    searchTerm: '',
    location: '',
    vehicle_type_id: ''
  });
  const { useRealtimeUpdates } = useVehicles();
  
  // Setup real-time updates
  useRealtimeUpdates();

  // Get status from URL search params
  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    
    if (statusFromUrl && statusFromUrl !== 'all') {
      // Validate that the status is a valid enum value
      if (VALID_STATUSES.includes(statusFromUrl as VehicleStatus)) {
        setFilters(prevFilters => ({ 
          ...prevFilters,
          status: statusFromUrl as VehicleStatus
        }));
        
        // Show a toast to indicate filtered view
        toast.info(`Showing vehicles with status: ${statusFromUrl}`);
      } else {
        // If invalid status, show error toast and reset filters
        toast.error(`Invalid status filter: ${statusFromUrl}`);
        navigate('/vehicles');
      }
    }
  }, [searchParams, navigate]);

  const handleSelectVehicle = (id: string) => {
    navigate(`/vehicles/${id}`);
  };

  const handleAddVehicle = () => {
    navigate('/vehicles/add');
  };

  const handleFilterChange = (newFilters: VehicleFilterValues) => {
    // Convert from VehicleFilterValues to VehicleFilterParams
    const convertedFilters: VehicleFilterParams = {};
    
    if (newFilters.status && newFilters.status !== 'all') 
      convertedFilters.status = newFilters.status as VehicleStatus;
    
    if (newFilters.make && newFilters.make !== 'all') 
      convertedFilters.make = newFilters.make;
    
    if (newFilters.location && newFilters.location !== 'all') 
      convertedFilters.location = newFilters.location;
    
    if (newFilters.year && newFilters.year !== 'all') 
      convertedFilters.year = newFilters.year;
    
    // Handle the category to vehicle_type_id mapping
    if (newFilters.category && newFilters.category !== 'all') {
      convertedFilters.vehicle_type_id = newFilters.category;
    }
    
    // Handle search parameter - specifically for VIN
    if (newFilters.search && newFilters.search.trim() !== '') {
      convertedFilters.search = newFilters.search.trim();
    }
    
    setFilters(convertedFilters);
  };
  
  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <SectionHeader
            title="Vehicle Management"
            description="Manage your fleet inventory"
            icon={Car}
            className="md:mb-0"
          />
          <div className="flex flex-wrap gap-2">
            <CustomButton 
              size="sm"
              variant="outline"
              onClick={() => navigate('/vehicles/status-update')}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Status Update
            </CustomButton>
            <CustomButton size="sm" glossy onClick={handleAddVehicle}>
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </CustomButton>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <VehicleFilters 
              onFilterChange={handleFilterChange} 
              initialValues={{
                status: filters.status || 'all',
                make: filters.make || 'all',
                location: filters.location || 'all',
                year: filters.year || 'all',
                category: filters.vehicle_type_id || 'all',
                search: filters.search || ''
              }}
            />
          </div>
        </div>
        
        <VehicleGrid 
          onSelectVehicle={handleSelectVehicle} 
          filter={filters}
        />
      </div>
    </PageContainer>
  );
};

export default Vehicles;
