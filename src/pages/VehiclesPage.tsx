import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { VehicleFilterValues } from '@/components/vehicles/VehicleFilters';
import { VehicleFilterParams, VehicleStatus } from '@/types/vehicle';
import { useVehicles } from '@/hooks/use-vehicles';
import { toast } from 'sonner';
import { VehiclesPageHeader } from '@/components/vehicles/VehiclesPageHeader';
import { VehiclesPageFilters } from '@/components/vehicles/VehiclesPageFilters';
import { VehiclesPageContent } from '@/components/vehicles/VehiclesPageContent';

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

type ViewMode = 'grid' | 'list';

const VehiclesPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<VehicleFilterParams>({});
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const { useList, useRealtimeUpdates } = useVehicles();
  
  // Setup real-time updates
  useRealtimeUpdates();

  // Fetch vehicles with current filters
  const { data: vehicles = [], isLoading, error, refetch } = useList(filters);

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
      convertedFilters.year = parseInt(newFilters.year);
    
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

  // Memoize filter values to prevent unnecessary re-renders
  const filterValues = useMemo(() => ({
    status: filters.status || 'all',
    make: filters.make || 'all',
    location: filters.location || 'all',
    year: filters.year?.toString() || 'all',
    category: filters.vehicle_type_id || 'all',
    search: filters.search || ''
  }), [filters]);

  const handleRefresh = () => {
    refetch();
    toast.success('Data refreshed');
  };
  
  return (
    <PageContainer>
      <div className="space-y-8">
        <VehiclesPageHeader 
          isLoading={isLoading}
          onRefresh={handleRefresh}
        />
        
        <VehiclesPageFilters
          onFilterChange={handleFilterChange}
          filterValues={filterValues}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <VehiclesPageContent
          vehicles={vehicles}
          isLoading={isLoading}
          error={error}
          viewMode={viewMode}
          onSelectVehicle={handleSelectVehicle}
        />
      </div>
    </PageContainer>
  );
};

export default VehiclesPage;