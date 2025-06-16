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
import { Car, Grid3x3, Plus, RefreshCw, TableProperties, Wrench, Filter } from 'lucide-react';
import { VehicleStats } from '@/components/vehicles/VehicleStats';
import { VehicleSearch } from '@/components/vehicles/VehicleSearch';
import { Badge } from '@/components/ui/badge';
import { useVehicleService } from '@/hooks/services/useVehicleService';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useTranslation } from '@/utils/translation-helper';
import PageHeader from '@/components/ui/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { vehicleService } from '@/services/VehicleService';
import { enhancedVehicleSearch } from '@/utils/searchUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { responsivePadding, responsiveSpacing, responsiveFlex } from '@/utils/responsive-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<VehicleFilterParams>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(isMobile ? 'grid' : 'table');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [error, setError] = useState<Error | null>(null);
  
  // Pagination state - Smaller page size for mobile
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(isMobile ? 6 : 10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Use the vehicle service hook
  const { loading, error: serviceError, getAllVehicles } = useVehicleService();

  // Update vehicles state with proper type
  const [vehicles, setVehicles] = useState<ExtendedVehicle[]>([]);
  
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

  // Fetch vehicles when filters or pagination changes
  const fetchVehicles = async () => {
    try {
      setError(null);
      
      // If there's a search term, use enhanced search
      if (filters.searchTerm?.trim()) {
        const searchResults = await performEnhancedSearch(filters.searchTerm);
        
        // Apply other filters to search results
        let filteredVehicles = searchResults as ExtendedVehicle[];
        
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
        
        // Calculate pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex);
        
        setTotalItems(filteredVehicles.length);
        return paginatedVehicles;
      }
      
      // Otherwise use regular vehicle fetching
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
        toast.info(language === 'ar' ? `عرض المركبات بحالة: ${statusFromUrl}` : `Showing vehicles with status: ${statusFromUrl}`);
      } else {
        toast.error(language === 'ar' ? `مرشح حالة غير صالح: ${statusFromUrl}` : `Invalid status filter: ${statusFromUrl}`);
        navigate('/vehicles');
      }
    }
  }, [searchParams, navigate, language]);

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
    <PageContainer className={cn(
      "max-w-7xl mx-auto",
      responsivePadding.page
    )}>
      <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="mb-4 sm:mb-6">
          <PageHeader
            title='المركبات'
            subtitle='إدارة وتتبع أسطول المركبات'
            icon={<Car className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />}
            align="right"
            dir="rtl"
          />
        </div>
        
        <div className={responsiveSpacing.stack}>
          <VehicleStats />
          
          <Card className="overflow-hidden">
            <div className="p-3 sm:p-4 border-b">
              <div className={cn(
                "flex flex-col gap-4",
                "sm:flex-row sm:justify-between sm:items-center sm:flex-row-reverse"
              )}>
                <Tabs 
                  defaultValue={activeTab} 
                  value={activeTab} 
                  onValueChange={handleTabChange}
                  className="w-full sm:w-auto"
                  dir="rtl"
                >
                  <TabsList className={cn(
                    "flex justify-end w-full sm:w-auto",
                    "overflow-x-auto"
                  )}>
                    <TabsTrigger value="all" className="text-xs sm:text-sm">الكل</TabsTrigger>
                    <TabsTrigger value="available" className="text-xs sm:text-sm">متاحة</TabsTrigger>
                    <TabsTrigger value="rented" className="text-xs sm:text-sm">مؤجرة</TabsTrigger>
                    <TabsTrigger value="maintenance" className="text-xs sm:text-sm">صيانة</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <div className="flex items-center justify-between sm:justify-start space-x-reverse space-x-2">
                  <div className="flex items-center space-x-reverse space-x-2">
                    <Button 
                      variant={viewMode === 'grid' ? 'default' : 'outline'} 
                      size="icon"
                      onClick={() => setViewMode('grid')}
                      title="عرض شبكي"
                      className="h-8 w-8 sm:h-9 sm:w-9"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={viewMode === 'table' ? 'default' : 'outline'} 
                      size="icon"
                      onClick={() => setViewMode('table')}
                      title="عرض جدولي"
                      className="h-8 w-8 sm:h-9 sm:w-9"
                    >
                      <TableProperties className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Mobile action menu */}
                  {isMobile ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4" />
                          <span className="mr-2">خيارات</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={handleAddVehicle}>
                          <Plus className="h-4 w-4 mr-2" />
                          إضافة مركبة
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/maintenance/add')}>
                          <Wrench className="h-4 w-4 mr-2" />
                          إضافة صيانة
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/vehicles/status-update')}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          تحديث الحالة
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
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
                        onClick={() => navigate('/maintenance/add')}
                        className="flex items-center justify-end"
                      >
                        <Wrench className="h-4 w-4 mr-2" />
                        إضافة صيانة
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
                    </div>
                  )}
                </div>
              </div>
              
              <div className={cn(
                "flex flex-col mt-4 gap-3",
                "sm:flex-row sm:justify-between sm:flex-row-reverse"
              )}>
                <div className="flex-1 max-w-full sm:max-w-md">
                  <VehicleSearch
                    searchQuery={searchQuery}
                    setSearchQuery={handleSearchChange}
                  />
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full sm:w-auto"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? 'إخفاء المرشحات' : 'إظهار المرشحات'}
                </Button>
              </div>
              
              {activeFilters.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 flex-row-reverse">
                  {activeFilters.map(([key, value]) => (
                    <Badge
                      key={key}
                      variant="secondary"
                      className="flex items-center gap-1 flex-row-reverse text-xs"
                    >
                      {key === 'searchTerm' ? 'البحث' : key}: {value}
                      <button
                        onClick={() => {
                          const updatedFilters = { ...filters };
                          delete updatedFilters[key as keyof VehicleFilterParams];
                          setFilters(updatedFilters);
                        }}
                        className="rounded-full hover:bg-accent p-1 mr-1"
                      >
                        <span className="sr-only">إزالة</span>
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
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
                    className="text-xs h-7 px-2"
                  >
                    مسح المرشحات
                  </Button>
                </div>
              )}
            </div>
            
            {showFilters && (
              <div className="border-b p-3 sm:p-4">
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
            
            <CardContent className="p-3 sm:p-4">
              {viewMode === 'grid' ? (
                <VehicleGrid 
                  vehicles={vehicles}
                  isLoading={loading}
                  onVehicleClick={handleSelectVehicle}
                />
              ) : (
                <div className="overflow-x-auto -mx-3 sm:mx-0">
                  <div className="min-w-[600px] px-3 sm:px-0">
                    <VehicleTable 
                      vehicles={vehicles}
                      isLoading={loading}
                      onRowClick={handleSelectVehicle}
                    />
                  </div>
                </div>
              )}
              
              {(error || serviceError) && (
                <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs sm:text-sm mt-4 text-right" dir="rtl">
                  <p className="font-medium">
                    خطأ في تحميل المركبات
                  </p>
                  <p>
                    {(error || serviceError)?.message || 'خطأ غير معروف'}
                  </p>
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
      </div>
    </PageContainer>
  );
};

export default Vehicles;
