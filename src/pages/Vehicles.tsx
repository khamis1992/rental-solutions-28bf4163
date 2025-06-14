import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import VehicleGrid from '@/components/vehicles/VehicleGrid';
import VehicleTable from '@/components/vehicles/VehicleTable';
import VehicleFilters from '@/components/vehicles/VehicleFilters';
import { VehicleFilterParams, VehicleStatus, ExtendedVehicle } from '@/types/vehicle';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, Grid3x3, Plus, RefreshCw, TableProperties, Wrench } from 'lucide-react';
import { VehicleStats } from '@/components/vehicles/VehicleStats';
import { VehicleSearch } from '@/components/vehicles/VehicleSearch';
import { Badge } from '@/components/ui/badge';
import { useVehicleService } from '@/hooks/services/useVehicleService';
import { PaginationControls } from '@/components/ui/pagination-controls';

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
  const [error, setError] = useState<Error | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Use the vehicle service hook
  const { loading, error: serviceError, getAllVehicles } = useVehicleService();

  // Update vehicles state with proper type
  const [vehicles, setVehicles] = useState<ExtendedVehicle[]>([]);
  
  // Fetch vehicles with pagination
  const fetchVehicles = async () => {
    try {
      setError(null);
      const vehicles = await getAllVehicles();
      if (vehicles) {
        // Apply filters
        let filteredVehicles = vehicles as ExtendedVehicle[];
        
        // Filter by status
        if (filters.statuses?.length) {
          filteredVehicles = filteredVehicles.filter(v => 
            filters.statuses?.includes(v.status)
          );
        }
        
        // Filter by make
        if (filters.make) {
          filteredVehicles = filteredVehicles.filter(v => 
            v.make.toLowerCase().includes(filters.make?.toLowerCase() || '')
          );
        }
        
        // Filter by location
        if (filters.location) {
          filteredVehicles = filteredVehicles.filter(v => 
            v.location.toLowerCase().includes(filters.location?.toLowerCase() || '')
          );
        }
        
        // Filter by year
        if (filters.year) {
          filteredVehicles = filteredVehicles.filter(v => 
            v.year === filters.year
          );
        }
        
        // Filter by vehicle type
        if (filters.vehicle_type_id) {
          filteredVehicles = filteredVehicles.filter(v => 
            v.vehicle_type_id === filters.vehicle_type_id
          );
        }
        
        // Filter by search term
        if (filters.searchTerm) {
          const searchTerm = filters.searchTerm.toLowerCase();
          filteredVehicles = filteredVehicles.filter(v => 
            v.vin.toLowerCase().includes(searchTerm) ||
            v.make.toLowerCase().includes(searchTerm) ||
            v.model.toLowerCase().includes(searchTerm) ||
            v.license_plate?.toLowerCase().includes(searchTerm)
          );
        }
        
        // Calculate pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex);
        
        setTotalItems(filteredVehicles.length);
        return paginatedVehicles;
      }
      return [];
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch vehicles'));
      return [];
    }
  };

  // Fetch vehicles when filters or pagination changes
  useEffect(() => {
    const loadVehicles = async () => {
      const data = await fetchVehicles();
      setVehicles(data);
    };
    loadVehicles();
  }, [filters, currentPage, itemsPerPage]);

  // Get status from URL search params
  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    
    if (statusFromUrl && statusFromUrl !== 'all') {
      if (VALID_STATUSES.includes(statusFromUrl as VehicleStatus)) {
        setFilters(prevFilters => ({ 
          ...prevFilters,
          statuses: [statusFromUrl as VehicleStatus]
        }));
        
        setActiveTab(statusFromUrl);
        toast.info(`Showing vehicles with status: ${statusFromUrl}`);
      } else {
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
      setFilters(prev => ({ ...prev, statuses: undefined }));
    } else if (VALID_STATUSES.includes(value as VehicleStatus)) {
      setFilters(prev => ({ ...prev, statuses: [value as VehicleStatus] }));
    }
    
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    const updated = {
      ...filters,
      searchTerm: query?.trim() !== '' ? query : undefined
    } as VehicleFilterParams;
    setFilters(updated);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: any) => {
    const convertedFilters: VehicleFilterParams = {};
    
    if (newFilters.status && newFilters.status !== 'all') 
      convertedFilters.statuses = [newFilters.status as VehicleStatus];
    
    if (newFilters.make && newFilters.make !== 'all') 
      convertedFilters.make = newFilters.make;
    
    if (newFilters.location && newFilters.location !== 'all') 
      convertedFilters.location = newFilters.location;
    
    if (newFilters.year && newFilters.year !== 'all') 
      convertedFilters.year = parseInt(newFilters.year);
    
    if (newFilters.category && newFilters.category !== 'all') {
      convertedFilters.vehicle_type_id = newFilters.category;
    }
    
    if (newFilters.search && newFilters.search.trim() !== '') {
      convertedFilters.searchTerm = newFilters?.search?.trim() || '';
    } else if (searchQuery && searchQuery.trim() !== '') {
      convertedFilters.searchTerm = searchQuery?.trim() || '';
    }
    
    setFilters(convertedFilters);
    setCurrentPage(1);
  };

  // Create array of active filters for filter chips
  const activeFilters = Object.entries(filters)
    .filter(([key, value]) =>
      key !== 'statuses' &&
      key !== 'search' &&
      key !== 'searchTerm' &&
      value !== undefined &&
      value !== '');

  return (
    <PageContainer 
      title="Vehicle Management" 
      description="Manage your fleet inventory"
      className="max-w-full"
    >
      <div className="space-y-6">
        <VehicleStats />
        
        <Card className="overflow-hidden">
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
            
            {activeFilters.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {activeFilters.map(([key, value]) => (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {key === 'searchTerm' ? 'search' : key}: {value}
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
                    if (filters.statuses) cleanFilters.statuses = filters.statuses;
                    if (searchQuery) cleanFilters.searchTerm = searchQuery;
                    setFilters(cleanFilters);
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
          
          {showFilters && (
            <div className="border-b p-4">
              <VehicleFilters 
                onFilterChange={handleFilterChange} 
                initialValues={{
                  status: filters.statuses?.[0] || 'all',
                  make: filters.make || 'all',
                  location: filters.location || 'all',
                  year: filters.year?.toString() || 'all',
                  category: filters.vehicle_type_id || 'all',
                  search: filters.searchTerm || ''
                }}
              />
            </div>
          )}
          
          <CardContent className="p-4">
            {viewMode === 'grid' ? (
              <VehicleGrid 
                vehicles={vehicles}
                isLoading={loading}
                onVehicleClick={handleSelectVehicle}
              />
            ) : (
              <VehicleTable 
                vehicles={vehicles}
                isLoading={loading}
                onRowClick={handleSelectVehicle}
              />
            )}
            
            {(error || serviceError) && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm mt-4">
                <p className="font-medium">Error loading vehicles</p>
                <p>{(error || serviceError)?.message || 'An unknown error occurred'}</p>
              </div>
            )}
            
            <PaginationControls
              currentPage={currentPage}
              totalPages={Math.ceil(totalItems / itemsPerPage)}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              className="mt-4"
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Vehicles;
