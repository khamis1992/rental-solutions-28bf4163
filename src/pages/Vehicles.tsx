import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import VehicleGrid from '@/components/vehicles/VehicleGrid';
import VehicleTable from '@/components/vehicles/VehicleTable';
import VehicleFilters from '@/components/vehicles/VehicleFilters';
import { VehicleFilterParams, VehicleStatus, ExtendedVehicle } from '@/types/vehicle';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, Grid3x3, Plus, RefreshCw, TableProperties } from 'lucide-react';
import { VehicleStats } from '@/components/vehicles/VehicleStats';
import { VehicleSearch } from '@/components/vehicles/VehicleSearch';
import { Badge } from '@/components/ui/badge';
import { useVehicleService } from '@/hooks/services/useVehicleService';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useTranslation } from '@/utils/translation-helper';
import PageHeader from '@/components/ui/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { vehicleService } from '@/services/VehicleService';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';

// Global State Management & Communication
import { 
  useFilterState, 
  useLoadingState,
  useCacheState 
} from '@/hooks/use-global-state-management';
import { 
  useComponentMessaging, 
  useDataSync,
  useComponentLifecycle 
} from '@/components/providers/CommunicationProvider';
import { EVENTS } from '@/utils/component-communication';

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

const Vehicles = React.memo(() => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Global State Management
  const { filter: globalFilters, setFilter } = useFilterState('vehicles');
  const { isLoading: globalLoading, withLoading } = useLoadingState('vehicles');
  const { cache: cachedVehicles, setCache: setCachedVehicles } = useCacheState('vehicles');
  
  // Communication & Event Bus
  const messaging = useComponentMessaging();
  useComponentLifecycle('VehiclesPage');
  
  // Local state - use global state where possible
  const filters = globalFilters || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Use the vehicle service hook
  const { loading, error: serviceError, getAllVehicles } = useVehicleService();
  
  // Use error handler
  const { error: errorState, handleError, clearError } = useErrorHandler();

  // Update vehicles state with proper type - use cached data when available
  const [vehicles, setVehicles] = useState<ExtendedVehicle[]>(cachedVehicles || []);
  
  // Enhanced search function that uses fuzzy matching
  const performEnhancedSearch = async (searchTerm: string) => {
    if (!searchTerm?.trim()) return [];
    
    try {
      // Use the smart search from VehicleService
      const result = await vehicleService.smartSearch(searchTerm, {
        minConfidence: 30,
        maxResults: 50
      });
      
      if (result.success) {
        return result.data.map(({ matchScore, matchDetails, ...vehicle }) => vehicle);
      } else {
        console.error('Enhanced search failed:', result.error);
        return [];
      }
    } catch (error) {
      console.error('Enhanced search error:', error);
      return [];
    }
  };

  // Fetch vehicles with proper error handling and caching
  const fetchVehicles = async () => {
    return withLoading(async () => {
      try {
        clearError();
        
        // Emit event for data loading
        messaging.emit(EVENTS.DATA_LOADING, { entity: 'vehicles', action: 'fetch' });
        
        let filteredVehicles: ExtendedVehicle[] = [];
        
        // If there's a search term, use enhanced search
        if (filters.searchTerm?.trim()) {
          const searchResults = await performEnhancedSearch(filters.searchTerm);
          filteredVehicles = searchResults as ExtendedVehicle[];
        } else {
          // Use regular vehicle fetching
          const vehiclesData = await getAllVehicles();
          filteredVehicles = vehiclesData as ExtendedVehicle[];
        }
        
        // Apply filters
        if (filters.statuses?.length) {
          filteredVehicles = filteredVehicles.filter(v => 
            filters.statuses?.includes(v.status)
          );
        }
        
        if (filters.make) {
          filteredVehicles = filteredVehicles.filter(v => 
            v.make?.toLowerCase().includes(filters.make?.toLowerCase() || '')
          );
        }
        
        if (filters.location) {
          filteredVehicles = filteredVehicles.filter(v => 
            v.location?.toLowerCase().includes(filters.location?.toLowerCase() || '')
          );
        }
        
        if (filters.year) {
          filteredVehicles = filteredVehicles.filter(v => 
            v.year === filters.year
          );
        }
        
        if (filters.vehicle_type_id) {
          filteredVehicles = filteredVehicles.filter(v => 
            v.vehicle_type_id === filters.vehicle_type_id
          );
        }
        
        // Calculate pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex);
        
        setTotalItems(filteredVehicles.length);
        
        // Cache results
        setCachedVehicles(paginatedVehicles);
        
        // Emit success event
        messaging.emit(EVENTS.DATA_UPDATED, { entity: 'vehicles', count: paginatedVehicles.length });
        
        return paginatedVehicles;
      } catch (err) {
        handleError(err, {
          showToast: true,
          logError: true,
          context: { page: 'vehicles', action: 'fetchVehicles' }
        });
        
        // Emit error event
        messaging.emit(EVENTS.ERROR_OCCURRED, { entity: 'vehicles', error: err });
        
        return [];
      }
    });
  };

  // Load vehicles when filters change
  useEffect(() => {
    const loadVehicles = async () => {
      const data = await fetchVehicles();
      setVehicles(data);
    };
    loadVehicles();
  }, [filters, currentPage, itemsPerPage]);

  // Handle URL status parameter
  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    
    if (statusFromUrl && statusFromUrl !== 'all') {
      if (VALID_STATUSES.includes(statusFromUrl as VehicleStatus)) {
        setFilter({ 
          ...filters,
          statuses: [statusFromUrl as VehicleStatus]
        });
        
        setActiveTab(statusFromUrl);
        toast.info(language === 'ar' ? `عرض المركبات بحالة: ${statusFromUrl}` : `Showing vehicles with status: ${statusFromUrl}`);
      } else {
        toast.error(language === 'ar' ? `مرشح حالة غير صالح: ${statusFromUrl}` : `Invalid status filter: ${statusFromUrl}`);
        navigate('/vehicles');
      }
    }
  }, [searchParams, navigate, language, setFilter]);

  // Event handlers
  const handleSelectVehicle = (id: string) => {
    messaging.emit(EVENTS.USER_ACTION, { action: 'select_vehicle', vehicleId: id });
    navigate(`/vehicles/${id}`);
  };

  const handleAddVehicle = () => {
    messaging.emit(EVENTS.USER_ACTION, { action: 'add_vehicle' });
    navigate('/vehicles/add');
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    const newFilters = { ...filters };
    
    if (value === 'all') {
      delete newFilters.statuses;
    } else if (VALID_STATUSES.includes(value as VehicleStatus)) {
      newFilters.statuses = [value as VehicleStatus];
    }
    
    setFilter(newFilters);
    setCurrentPage(1);
    
    // Emit filter change event
    messaging.publish({
      type: EVENTS.FILTER_CHANGED,
      data: { entity: 'vehicles', filters: newFilters }
    });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    const newFilters = {
      ...filters,
      searchTerm: query?.trim() !== '' ? query : undefined
    } as VehicleFilterParams;
    
    setFilter(newFilters);
    setCurrentPage(1);
    
    // Emit search event
    messaging.publish({
      type: EVENTS.SEARCH_PERFORMED,
      data: { entity: 'vehicles', query }
    });
  };

  const handleFilterChange = (newFilters: any) => {
    const convertedFilters: VehicleFilterParams = { ...filters };
    
    if (newFilters.status && newFilters.status !== 'all') 
      convertedFilters.statuses = [newFilters.status as VehicleStatus];
    else
      delete convertedFilters.statuses;
    
    if (newFilters.make && newFilters.make !== 'all') 
      convertedFilters.make = newFilters.make;
    else
      delete convertedFilters.make;
    
    if (newFilters.location && newFilters.location !== 'all') 
      convertedFilters.location = newFilters.location;
    else
      delete convertedFilters.location;
    
    if (newFilters.year && newFilters.year !== 'all') 
      convertedFilters.year = parseInt(newFilters.year);
    else
      delete convertedFilters.year;
    
    if (newFilters.category && newFilters.category !== 'all') {
      convertedFilters.vehicle_type_id = newFilters.category;
    } else {
      delete convertedFilters.vehicle_type_id;
    }
    
    if (newFilters.search && newFilters.search.trim() !== '') {
      convertedFilters.searchTerm = newFilters.search.trim();
    } else if (searchQuery && searchQuery.trim() !== '') {
      convertedFilters.searchTerm = searchQuery.trim();
    } else {
      delete convertedFilters.searchTerm;
    }
    
    setFilter(convertedFilters);
    setCurrentPage(1);
    
    // Emit filter change event
    messaging.publish({
      type: EVENTS.FILTER_CHANGED,
      data: { entity: 'vehicles', filters: convertedFilters }
    });
  };

  // Create array of active filters for filter chips
  const activeFilters = Object.entries(filters)
    .filter(([key, value]) =>
      key !== 'statuses' &&
      key !== 'search' &&
      key !== 'searchTerm' &&
      value !== undefined &&
      value !== '');

  // Refresh function for data sync
  const handleRefresh = () => {
    messaging.publish({
      type: EVENTS.USER_ACTION,
      data: { action: 'refresh_vehicles' }
    });
    
    fetchVehicles().then(data => setVehicles(data));
  };

  // Error handling
  const currentError = errorState || serviceError;

  if (currentError) {
    return (
      <PageContainer className="max-w-full">
        <ErrorDisplay 
          error={currentError} 
          onRetry={handleRefresh}
          title="خطأ في تحميل المركبات"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="max-w-full">
      <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <PageHeader
          title='المركبات'
          subtitle='إدارة وتتبع أسطول المركبات'
          icon={<Car className="w-6 h-6 text-blue-500" />}
          align="right"
          dir="rtl"
        />
        <div className="space-y-6">
          <VehicleStats />
          
          <Card className="overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:flex-row-reverse">
                <Tabs 
                  defaultValue={activeTab} 
                  value={activeTab} 
                  onValueChange={handleTabChange}
                  className="w-full sm:w-auto"
                  dir="rtl"
                >
                  <TabsList className="flex justify-end">
                    <TabsTrigger value="maintenance" className="text-right">صيانة</TabsTrigger>
                    <TabsTrigger value="rented" className="text-right">مؤجرة</TabsTrigger>
                    <TabsTrigger value="available" className="text-right">متاحة</TabsTrigger>
                    <TabsTrigger value="all" className="text-right">الكل</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <div className="flex items-center space-x-reverse space-x-2">
                  <Button 
                    variant={viewMode === 'grid' ? 'default' : 'outline'} 
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    title="عرض شبكي"
                  >
                    <Grid3x3 size={18} />
                  </Button>
                  <Button 
                    variant={viewMode === 'table' ? 'default' : 'outline'} 
                    size="icon"
                    onClick={() => setViewMode('table')}
                    title="عرض جدولي"
                  >
                    <TableProperties size={18} />
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row justify-between mt-4 gap-4 md:flex-row-reverse">
                <div className="flex-1 max-w-md">
                  <VehicleSearch
                    searchQuery={searchQuery}
                    setSearchQuery={handleSearchChange}
                  />
                </div>
                
                <div className="flex items-center gap-2 flex-row-reverse">
                  <Button 
                    size="sm" 
                    onClick={handleAddVehicle}
                    className="flex items-center justify-end"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة مركبة
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/vehicles/status-update')}
                    className="flex items-center justify-end"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    تحديث الحالة
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    {showFilters ? 'إخفاء المرشحات' : 'إظهار المرشحات'}
                  </Button>
                </div>
              </div>
              
              {activeFilters.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 flex-row-reverse">
                  {activeFilters.map(([key, value]) => (
                    <Badge
                      key={key}
                      variant="secondary"
                      className="flex items-center gap-1 flex-row-reverse"
                    >
                      {key === 'searchTerm' ? 'البحث' : key}: {value}
                      <button
                        onClick={() => {
                          const updatedFilters = { ...filters };
                          delete updatedFilters[key as keyof VehicleFilterParams];
                          setFilter(updatedFilters);
                        }}
                        className="rounded-full hover:bg-accent p-1 mr-1"
                      >
                        <span className="sr-only">إزالة</span>
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
                      setFilter(cleanFilters);
                    }}
                  >
                    مسح المرشحات
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
            
            <div className="p-4">
              {loading || globalLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="mr-2 text-sm text-muted-foreground">جاري التحميل...</span>
                </div>
              ) : (
                <Tabs value={viewMode} className="w-full">
                  <TabsContent value="grid">
                    <VehicleGrid 
                      vehicles={vehicles} 
                      onSelectVehicle={handleSelectVehicle}
                      className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    />
                  </TabsContent>
                  <TabsContent value="table">
                    <VehicleTable 
                      vehicles={vehicles} 
                      onSelectVehicle={handleSelectVehicle}
                    />
                  </TabsContent>
                </Tabs>
              )}
              
              {totalItems > itemsPerPage && (
                <div className="mt-6 flex justify-center">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalItems / itemsPerPage)}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={setItemsPerPage}
                    totalItems={totalItems}
                  />
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
});

Vehicles.displayName = 'Vehicles';

export default Vehicles;
