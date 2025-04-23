
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import VehicleGrid, { ViewMode } from '@/components/vehicles/VehicleGrid';
import { Car, ExternalLink, FileDown, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EnhancedVehicleFilters from '@/components/vehicles/EnhancedVehicleFilters';
import { VehicleFilterParams, VehicleStatus } from '@/types/vehicle';
import { useVehicles } from '@/hooks/use-vehicles';
import { toast } from 'sonner';
import ViewToggle from '@/components/vehicles/ViewToggle';
import VehicleStats from '@/components/vehicles/VehicleStats';

// Define valid statuses based on app enum
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
  const [filters, setFilters] = useState<VehicleFilterParams>({});
  const { useRealtimeUpdates, useList } = useVehicles();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const { data: allVehicles = [], isLoading: isLoadingAll } = useList();

  // Setup real-time updates
  useRealtimeUpdates();

  // Calculate metrics from all vehicles data
  const vehicleStats = React.useMemo(() => {
    const stats = {
      total: allVehicles.length,
      available: 0,
      rented: 0,
      maintenance: 0,
      other: 0
    };
    
    allVehicles.forEach(vehicle => {
      switch (vehicle.status) {
        case 'available':
          stats.available++;
          break;
        case 'rented':
          stats.rented++;
          break;
        case 'maintenance':
          stats.maintenance++;
          break;
        default:
          stats.other++;
          break;
      }
    });
    
    return stats;
  }, [allVehicles]);

  // Get status from URL search params
  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    
    if (statusFromUrl && statusFromUrl !== 'all') {
      // Validate that the status is a valid enum value
      if (VALID_STATUSES.includes(statusFromUrl as VehicleStatus)) {
        // Use the app status value in our filter
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

  const handleStatusUpdate = (id: string) => {
    navigate(`/vehicles/${id}/status-update`);
  };

  const handleFilterChange = (newFilters: any) => {
    // Convert from VehicleFilterValues to VehicleFilterParams
    const convertedFilters: VehicleFilterParams = {};
    
    if (newFilters.status && newFilters.status !== 'all') {
      // Ensure we're using the application VehicleStatus type
      convertedFilters.status = newFilters.status as VehicleStatus;
    }
    
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

  const handleExportData = () => {
    toast.info('Exporting vehicle data...', {
      description: 'This feature is coming soon.'
    });
  };

  const handlePrintData = () => {
    window.print();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Extract unique makes, locations and years for filters
  const uniqueMakes = [...new Set(allVehicles.map(v => v.make))].sort();
  const uniqueLocations = [...new Set(allVehicles.map(v => v.location).filter(Boolean))].sort();
  const uniqueYears = [...new Set(allVehicles.map(v => v.year))].sort((a, b) => b - a).map(String);
  
  // Get vehicle types for filter
  const { data: vehicleTypes = [] } = useVehicles().useVehicleTypes();
  const vehicleTypeOptions = vehicleTypes.map(vt => ({ id: vt.id, name: vt.name }));
  
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
          <div className="flex gap-2 flex-wrap justify-end">
            <Button 
              size="sm"
              variant="outline"
              onClick={() => navigate('/vehicles/status-update')}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Status Update
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportData}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              size="sm"
              onClick={handleAddVehicle}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <VehicleStats data={vehicleStats} />
        
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex-1">
            <EnhancedVehicleFilters 
              onFilterChange={handleFilterChange}
              initialValues={{
                status: filters.status || 'all',
                make: filters.make || 'all',
                location: filters.location || 'all',
                year: filters.year?.toString() || 'all',
                category: filters.vehicle_type_id || 'all',
                search: filters.search || ''
              }}
              makes={uniqueMakes}
              locations={uniqueLocations}
              years={uniqueYears}
              categories={vehicleTypeOptions}
            />
          </div>
          <ViewToggle 
            view={viewMode}
            onViewChange={setViewMode}
            onRefresh={handleRefresh}
            onExport={handleExportData}
            onPrint={handlePrintData}
          />
        </div>
        
        <VehicleGrid 
          onSelectVehicle={handleSelectVehicle}
          filter={filters}
          viewMode={viewMode}
          onStatusUpdate={handleStatusUpdate}
        />
      </div>
    </PageContainer>
  );
};

export default Vehicles;
