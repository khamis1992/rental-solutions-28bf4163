
import React, { Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { AgreementList } from '@/components/agreements/AgreementList-Simple';
import { ImportHistoryList } from '@/components/agreements/ImportHistoryList';
import { CSVImportModal } from '@/components/agreements/CSVImportModal';
import { Button } from '@/components/ui/button';
import { useAgreements } from '@/hooks/use-agreements';
import { checkEdgeFunctionAvailability } from '@/utils/service-availability';
import { toast } from 'sonner';
import { runPaymentScheduleMaintenanceJob } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { 
  FileUp, AlertTriangle, FilePlus, RefreshCw, BarChart4, Filter, Search
} from 'lucide-react';
import { AgreementStats } from '@/components/agreements/AgreementStats';
import { AgreementFilters } from '@/components/agreements/AgreementFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CustomerInfo } from '@/types/customer';
import { CustomerSearchResults } from '@/components/customers/CustomerSearchResults';

const Agreements = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEdgeFunctionAvailable, setIsEdgeFunctionAvailable] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { setSearchParams, searchParams } = useAgreements();
  const [showFilters, setShowFilters] = useState(false);
  
  // Add new state for customer search functionality
  const [searchResults, setSearchResults] = useState<CustomerInfo[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
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
  
  // Run payment schedule maintenance job silently on page load
  React.useEffect(() => {
    const runMaintenanceJob = async () => {
      try {
        console.log("Running automatic payment schedule maintenance check");
        await runPaymentScheduleMaintenanceJob();
      } catch (error) {
        console.error("Error running payment maintenance job:", error);
        // We don't show a toast here since this is a background task
      }
    };
    
    // Run after a 3-second delay to allow other initial page operations to complete
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

  // Handle search input changes
  const handleSearchInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone_number')
        .eq('role', 'customer')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone_number.ilike.%${query}%`)
        .limit(10);

      if (error) {
        console.error('Error searching customers:', error);
        setSearchResults([]);
      } else {
        setSearchResults(data as CustomerInfo[]);
      }
    } catch (error) {
      console.error('Error in customer search:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (customer: CustomerInfo) => {
    setSelectedCustomer(customer);
    setSearchQuery('');
    setSearchResults([]);
    
    // Update search params to filter agreements by selected customer
    setSearchParams(prev => ({
      ...prev,
      customer_id: customer.id
    }));
  };

  // Clear selected customer
  const clearSelectedCustomer = () => {
    setSelectedCustomer(null);
    
    // Remove customer_id filter
    setSearchParams(prev => {
      const newParams = { ...prev };
      delete newParams.customer_id;
      return newParams;
    });
  };

  const handleFilterChange = (filters: Record<string, any>) => {
    setSearchParams(prev => ({ ...prev, ...filters }));
  };

  // Create array of active filters for filter chips
  const activeFilters = Object.entries(searchParams || {})
    .filter(([key, value]) => key !== 'status' && key !== 'customer_id' && value !== undefined && value !== '');

  return (
    <PageContainer 
      title="Rental Agreements" 
      description="Manage customer rental agreements and contracts"
    >
      {/* Stats Overview */}
      <div className="mb-6">
        <AgreementStats />
      </div>

      {/* Search and Action Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-grow max-w-md relative">
          {selectedCustomer ? (
            <Card className="w-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Selected Customer</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearSelectedCustomer}
                  >
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div>
                  <h3 className="font-semibold text-base">{selectedCustomer.full_name}</h3>
                  <div className="text-xs text-muted-foreground mt-1">
                    <p>{selectedCustomer.email}</p>
                    <p>{selectedCustomer.phone_number}</p>
                  </div>
                  <div className="mt-2">
                    <Link 
                      to={`/customers/${selectedCustomer.id}`} 
                      className="text-primary text-xs hover:underline"
                    >
                      View Customer Details
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="relative w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="search" 
                  placeholder="Search for customers..." 
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                />
              </div>
              {searchQuery.trim().length > 0 && (
                <div className="absolute w-full z-20 mt-1">
                  <CustomerSearchResults 
                    results={searchResults} 
                    onSelect={handleCustomerSelect} 
                    isLoading={isSearching}
                  />
                </div>
              )}
            </div>
          )}
          <Button
            variant="outline"
            size="icon"
            className="ml-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

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

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map(([key, value]) => (
            <Badge 
              key={key} 
              variant="outline" 
              className="flex gap-1 items-center px-3 py-1"
            >
              <span className="font-medium">{key}:</span> {value}
              <button 
                className="ml-1 rounded-full hover:bg-muted p-0.5"
                onClick={() => {
                  setSearchParams(prev => {
                    const newParams = { ...prev };
                    delete newParams[key];
                    return newParams;
                  });
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </Badge>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setSearchParams({ status: 'all' });
              setSelectedCustomer(null);
            }}
            className="text-xs h-7 px-2"
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <Card className="mb-6 p-4">
          <AgreementFilters onFilterChange={handleFilterChange} currentFilters={searchParams} />
        </Card>
      )}
      
      {/* Main Content */}
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
    </PageContainer>
  );
};

export default Agreements;
