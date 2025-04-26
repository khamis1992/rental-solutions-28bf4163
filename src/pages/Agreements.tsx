
import React, { Suspense, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { AgreementList } from '@/components/agreements/AgreementList-Simple';
import { ImportHistoryList } from '@/components/agreements/ImportHistoryList';
import { CSVImportModal } from '@/components/agreements/CSVImportModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAgreements } from '@/hooks/use-agreements';
import { useVehicles } from '@/hooks/use-vehicles';
import { checkEdgeFunctionAvailability } from '@/utils/service-availability';
import { toast } from 'sonner';
import { runPaymentScheduleMaintenanceJob } from '@/lib/supabase';
import { 
  FileUp, AlertTriangle, FilePlus, RefreshCw, BarChart4, 
  Search, FilterX, SlidersHorizontal
} from 'lucide-react';
import { AgreementStats } from '@/components/agreements/AgreementStats';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgreementStatus } from '@/lib/validation-schemas/agreement';
import { VehicleSearchCommandPalette } from '@/components/ui/vehicle-search-command-palette';
import { Vehicle } from '@/types/vehicle';
import { supabase } from '@/integrations/supabase/client';

const Agreements = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEdgeFunctionAvailable, setIsEdgeFunctionAvailable] = useState(true);
  const [isVehicleSearchOpen, setIsVehicleSearchOpen] = useState(false);
  const { setSearchParams, searchParams } = useAgreements();
  const [searchQuery, setSearchQuery] = useState('');
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  
  // Load some initial vehicle data
  useEffect(() => {
    const loadInitialVehicles = async () => {
      try {
        setIsLoadingVehicles(true);
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(50);
          
        if (error) {
          console.error("Error loading vehicles:", error);
          toast.error("Failed to load vehicle data");
          return;
        }
        
        if (data) {
          setVehiclesList(data as Vehicle[]);
        }
      } catch (err) {
        console.error("Error fetching vehicles:", err);
      } finally {
        setIsLoadingVehicles(false);
      }
    };
    
    loadInitialVehicles();
  }, []);
  
  React.useEffect(() => {
    if (typeof sessionStorage !== 'undefined') {
      const cachedStatus = sessionStorage.getItem('edge_function_available_process-agreement-imports');
      if (cachedStatus) {
        try {
          const { available, timestamp } = JSON.parse(cachedStatus);
          const now = Date.now();
          if (now - timestamp < 60 * 60 * 1000) {
            setIsEdgeFunctionAvailable(available);
            return;
          }
        } catch (e) {
          console.warn('Error parsing cached edge function status:', e);
        }
      }
    }
    
    const checkAvailability = async () => {
      const available = await checkEdgeFunctionAvailability('process-agreement-imports');
      setIsEdgeFunctionAvailable(available);
      if (!available) {
        toast.error("CSV import feature is unavailable. Please try again later or contact support.", {
          duration: 6000,
        });
      }
    };
    
    checkAvailability();
  }, []);
  
  React.useEffect(() => {
    const runMaintenanceJob = async () => {
      try {
        console.log("Running automatic payment schedule maintenance check");
        await runPaymentScheduleMaintenanceJob();
      } catch (error) {
        console.error("Error running payment maintenance job:", error);
      }
    };
    
    const timer = setTimeout(() => {
      runMaintenanceJob();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleImportComplete = () => {
    setSearchParams({ 
      status: 'all' 
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ 
      ...searchParams, 
      query: searchQuery 
    });
  };

  const handleStatusChange = (value: string) => {
    setSearchParams({
      ...searchParams,
      status: value,
    });
  };
  
  const handleVehicleSelect = (vehicle: Vehicle) => {
    console.log('Vehicle selected:', vehicle);
    setSearchParams({
      ...searchParams,
      vehicle_id: vehicle.id,
    });
    setSearchQuery(`Vehicle: ${vehicle.license_plate} (${vehicle.make} ${vehicle.model})`);
    toast.success(`Filtering by vehicle: ${vehicle.license_plate}`);
  };

  const clearFilters = () => {
    setSearchParams({
      status: 'all',
    });
    setSearchQuery('');
  };

  const hasActiveFilters = Object.entries(searchParams || {})
    .filter(([key, value]) => key !== 'status' || value !== 'all')
    .some(([_, value]) => value !== undefined && value !== '');

  return (
    <PageContainer 
      title="Rental Agreements" 
      description="Manage customer rental agreements and contracts"
    >
      <div className="mb-6">
        <AgreementStats />
      </div>

      {/* Search and Filters Section */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex-grow">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by agreement #, vehicle plate or customer name"
                className="pl-10 pr-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute right-0 flex items-center space-x-1 mr-2">
                <Button
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsVehicleSearchOpen(true)}
                  title="Search by vehicle"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
                {searchQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setSearchQuery('');
                      if (searchParams?.query) {
                        setSearchParams({
                          ...searchParams,
                          query: '',
                        });
                      }
                    }}
                    title="Clear search"
                  >
                    <FilterX className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </form>

          <div className="flex items-center space-x-2">
            <Select
              value={searchParams?.status || 'all'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={AgreementStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={AgreementStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={AgreementStatus.CANCELLED}>Cancelled</SelectItem>
                <SelectItem value={AgreementStatus.CLOSED}>Closed</SelectItem>
                <SelectItem value={AgreementStatus.EXPIRED}>Expired</SelectItem>
                <SelectItem value={AgreementStatus.DRAFT}>Draft</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={clearFilters}
                title="Clear all filters"
              >
                <FilterX className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {searchParams?.status && searchParams.status !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Status: {searchParams.status}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => handleStatusChange('all')}
                >
                  <FilterX className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {searchParams?.query && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {searchParams.query}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => {
                    setSearchParams({
                      ...searchParams,
                      query: '',
                    });
                    setSearchQuery('');
                  }}
                >
                  <FilterX className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {searchParams?.vehicle_id && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Vehicle: {searchQuery.replace('Vehicle: ', '')}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => {
                    setSearchParams({
                      ...searchParams,
                      vehicle_id: undefined,
                    });
                    setSearchQuery('');
                  }}
                >
                  <FilterX className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2"
            disabled={!isEdgeFunctionAvailable}
          >
            {!isEdgeFunctionAvailable && (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
            <FileUp className="h-4 w-4" />
            Import CSV
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link to="/agreements/add">
              <FilePlus className="h-4 w-4 mr-2" />
              New Agreement
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="text-lg font-medium">Loading agreements...</span>
          </div>
        </div>
      }>
        <AgreementList />
      </Suspense>
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <BarChart4 className="h-5 w-5 mr-2" />
          Import History
        </h2>
        <ImportHistoryList />
      </div>
      
      <CSVImportModal 
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImportComplete={handleImportComplete}
      />

      <VehicleSearchCommandPalette
        isOpen={isVehicleSearchOpen}
        onClose={() => setIsVehicleSearchOpen(false)}
        onVehicleSelect={handleVehicleSelect}
        vehicles={vehiclesList}
        isLoading={isLoadingVehicles}
      />
    </PageContainer>
  );
};

export default Agreements;
