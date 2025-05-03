
import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { Car, Plus, RefreshCw, Filter, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VehicleFilters, { VehicleFilterValues } from '@/components/vehicles/VehicleFilters';
import { VehicleFilterParams, VehicleStatus } from '@/types/vehicle';
import { useVehicles } from '@/hooks/use-vehicles';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocalStorage } from '@/hooks/use-local-storage';

// Lazy load the VehicleGrid component for better initial load time
const VehicleGrid = lazy(() => import('@/components/vehicles/VehicleGrid'));

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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<VehicleFilterParams>({});
  const { useRealtimeUpdates, useConnectionStatus } = useVehicles();
  const [activeTab, setActiveTab] = useLocalStorage<string>('vehicles-view-tab', 'grid');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check connection status
  const { data: isConnected = true } = useConnectionStatus();

  // Setup real-time updates
  useRealtimeUpdates();

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

  // Memoize handlers to prevent unnecessary re-renders
  const handleSelectVehicle = useCallback((id: string) => {
    navigate(`/vehicles/${id}`);
  }, [navigate]);

  const handleAddVehicle = useCallback(() => {
    navigate('/vehicles/add');
  }, [navigate]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);

    // Reload the page after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 300);
  }, []);

  const handleFilterChange = useCallback((newFilters: VehicleFilterValues) => {
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
  }, []);

  // Memoize initial filter values to prevent unnecessary re-renders
  const initialFilterValues = useMemo(() => ({
    status: filters.status || 'all',
    make: filters.make || 'all',
    location: filters.location || 'all',
    year: filters.year?.toString() || 'all',
    category: filters.vehicle_type_id || 'all',
    search: filters.search || ''
  }), [filters]);

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <SectionHeader
            title="Vehicle Management"
            description="Manage your fleet inventory"
            icon={Car}
            className="sm:mb-0"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleAddVehicle}
              className="bg-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Vehicle</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        <Card className="border border-border/40">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-lg font-medium">Vehicle Inventory</CardTitle>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList className="grid w-full sm:w-auto grid-cols-2 h-8">
                  <TabsTrigger value="grid" className="text-xs">
                    <Car className="h-3.5 w-3.5 mr-1.5" />
                    Grid View
                  </TabsTrigger>
                  <TabsTrigger value="list" className="text-xs">
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    List View
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <VehicleFilters
                onFilterChange={handleFilterChange}
                initialValues={initialFilterValues}
              />
            </div>

            <Suspense fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="overflow-hidden border border-border/60 rounded-lg animate-pulse">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-5">
                      <Skeleton className="h-6 w-2/3 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                    <div className="px-5 pb-5 pt-0">
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            }>
              <TabsContent value="grid" className="m-0 pt-4">
                <VehicleGrid
                  onSelectVehicle={handleSelectVehicle}
                  filter={filters}
                />
              </TabsContent>

              <TabsContent value="list" className="m-0 pt-4">
                <div className="bg-muted/50 border border-border text-muted-foreground p-8 rounded-md text-center">
                  <h3 className="text-lg font-semibold mb-2">List View Coming Soon</h3>
                  <p className="mb-4">We're working on a detailed list view for your vehicles.</p>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('grid')}
                  >
                    Switch to Grid View
                  </Button>
                </div>
              </TabsContent>
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Vehicles;
