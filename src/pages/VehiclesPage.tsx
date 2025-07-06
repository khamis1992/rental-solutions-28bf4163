import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { Car, Plus, RefreshCw, GridIcon, List } from 'lucide-react';
import { CustomButton } from '@/components/ui/custom-button';
import VehicleFilters, { VehicleFilterValues } from '@/components/vehicles/VehicleFilters';
import { VehicleFilterParams, VehicleStatus } from '@/types/vehicle';
import { useVehicles } from '@/hooks/use-vehicles';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OptimizedVehicleGrid } from '@/components/vehicles/OptimizedVehicleGrid';
import { VehicleStats } from '@/components/vehicles/VehicleStats';
import { Button } from '@/components/ui/button';

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
      <div className="space-y-6">
        {/* Header */}
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
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </CustomButton>
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
        
        {/* Filters and View Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <VehicleFilters 
              onFilterChange={handleFilterChange} 
              initialValues={filterValues}
            />
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <GridIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load vehicles. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
            <span className="ml-2 text-muted-foreground">Loading vehicles...</span>
          </div>
        )}

        {/* Stats */}
        {!isLoading && !error && vehicles.length > 0 && (
          <VehicleStats vehicles={vehicles} />
        )}

        {/* Content */}
        {!isLoading && !error && (
          <OptimizedVehicleGrid
            vehicles={vehicles}
            onSelectVehicle={handleSelectVehicle}
            viewMode={viewMode}
          />
        )}
      </div>
    </PageContainer>
  );
};

export default VehiclesPage;