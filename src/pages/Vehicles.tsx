
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import VehicleGrid from '@/components/vehicles/VehicleGrid';
import VehicleTable from '@/components/vehicles/VehicleTable';
import VehicleFilters from '@/components/vehicles/VehicleFilters';
import { VehicleFilterParams, VehicleStatus } from '@/types/vehicle';
import { useVehicles } from '@/hooks/use-vehicles';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, Grid3x3, Plus, RefreshCw, TableProperties, Wrench } from 'lucide-react';
import { VehicleStats } from '@/components/vehicles/VehicleStats';
import { VehicleSearch } from '@/components/vehicles/VehicleSearch';
import { Badge } from '@/components/ui/badge';

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
  const [filters, setFilters] = useState<VehicleFilterParams>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Get vehicles using the hook's useList functionality
  const { useList, useRealtimeUpdates } = useVehicles();
  const { data: vehicles = [], isLoading, error } = useList(filters);
  
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
        
        setActiveTab(statusFromUrl);
        
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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === 'all') {
      setFilters(prev => ({ ...prev, status: undefined }));
    } else if (VALID_STATUSES.includes(value as VehicleStatus)) {
      setFilters(prev => ({ ...prev, status: value as VehicleStatus }));
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setFilters(prev => ({ 
      ...prev, 
      search: query.trim() !== '' ? query : undefined 
    }));
  };

  const handleFilterChange = (newFilters: any) => {
    // Convert from form values to filter parameters
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
    
    // Handle search parameter if it exists
    if (searchQuery && searchQuery.trim() !== '') {
      convertedFilters.search = searchQuery.trim();
    }
    
    setFilters(convertedFilters);
  };

  // Create array of active filters for filter chips
  const activeFilters = Object.entries(filters)
    .filter(([key, value]) => 
      key !== 'status' && 
      key !== 'search' && 
      value !== undefined && 
      value !== '');

  return (
    <PageContainer 
      title="Vehicle Management" 
      description="Manage your fleet inventory"
      className="max-w-full"
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <VehicleStats />
        
        {/* Main Content Card */}
        <Card className="overflow-hidden">
          {/* Header with Tabs */}
          <div className="p-4 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Tabs 
                defaultValue={activeTab} 
                value={activeTab} 
                onValueChange={handleTabChange}
                className="w-full sm:w-auto"
              >
                <TabsList>
                  <TabsTrigger value="all">All Vehicles</TabsTrigger>
                  <TabsTrigger value="available">Available</TabsTrigger>
                  <TabsTrigger value="rented">Rented</TabsTrigger>
                  <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <Button 
                  variant={viewMode === 'grid' ? 'default' : 'outline'} 
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 size={18} />
                </Button>
                <Button 
                  variant={viewMode === 'table' ? 'default' : 'outline'} 
                  size="icon"
                  onClick={() => setViewMode('table')}
                >
                  <TableProperties size={18} />
                </Button>
              </div>
            </div>
            
            {/* Search and Action Bar */}
            <div className="flex flex-col md:flex-row justify-between mt-4 gap-4">
              <div className="flex-1 max-w-md">
                <VehicleSearch
                  searchQuery={searchQuery}
                  setSearchQuery={handleSearchChange}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/vehicles/status-update')}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Status Update
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/maintenance/add')}
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Add Maintenance
                </Button>
                
                <Button size="sm" onClick={handleAddVehicle}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vehicle
                </Button>
              </div>
            </div>
            
            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {activeFilters.map(([key, value]) => (
                  <Badge 
                    key={key} 
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {key}: {value}
                    <button
                      onClick={() => {
                        const updatedFilters = { ...filters };
                        delete updatedFilters[key as keyof VehicleFilterParams];
                        setFilters(updatedFilters);
                      }}
                      className="ml-1 rounded-full hover:bg-accent p-1"
                    >
                      <span className="sr-only">Remove</span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </button>
                  </Badge>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    const cleanFilters: VehicleFilterParams = {};
                    if (filters.status) cleanFilters.status = filters.status;
                    if (searchQuery) cleanFilters.search = searchQuery;
                    setFilters(cleanFilters);
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <div className="border-b p-4">
              <VehicleFilters 
                onFilterChange={handleFilterChange} 
                initialValues={{
                  status: filters.status || 'all',
                  make: filters.make || 'all',
                  location: filters.location || 'all',
                  year: filters.year?.toString() || 'all',
                  category: filters.vehicle_type_id || 'all',
                  search: filters.search || ''
                }}
              />
            </div>
          )}
          
          {/* Content Area */}
          <CardContent className="p-4">
            {viewMode === 'grid' ? (
              <VehicleGrid 
                vehicles={vehicles}
                isLoading={isLoading}
                onVehicleClick={handleSelectVehicle}
              />
            ) : (
              <VehicleTable 
                vehicles={vehicles}
                isLoading={isLoading}
                onRowClick={handleSelectVehicle}
              />
            )}
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm mt-4">
                <p className="font-medium">Error loading vehicles</p>
                <p>{error?.message || 'An unknown error occurred'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Vehicles;
