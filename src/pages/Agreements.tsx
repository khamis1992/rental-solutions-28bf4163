
import React, { Suspense, useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { AgreementList } from '@/components/agreements/AgreementList-Simple';
import { ImportHistoryList } from '@/components/agreements/ImportHistoryList';
import { CSVImportModal } from '@/components/agreements/CSVImportModal';
import { useAgreements } from '@/hooks/use-agreements';
import { checkEdgeFunctionAvailability } from '@/utils/service-availability';
import { toast } from 'sonner';
import { runPaymentScheduleMaintenanceJob } from '@/lib/supabase';
import { BarChart4, RefreshCw } from 'lucide-react';
import { AgreementStats } from '@/components/agreements/AgreementStats';
import { AgreementFilters } from '@/components/agreements/AgreementFilters';
import { Card } from '@/components/ui/card';
import { CustomerInfo } from '@/types/customer';
import { AgreementSearch } from '@/components/agreements/page/AgreementSearch';
import { AgreementActionButtons } from '@/components/agreements/page/AgreementActionButtons';
import { ActiveFilters } from '@/components/agreements/page/ActiveFilters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Agreements = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEdgeFunctionAvailable, setIsEdgeFunctionAvailable] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { setSearchParams, searchParams } = useAgreements();
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // Add state for customer search functionality
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null);
  
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

  const handleFilterChange = (filters: Record<string, any>) => {
    setSearchParams(prev => ({ ...prev, ...filters }));
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'all') {
      setSearchParams({ status: undefined });
    } else {
      setSearchParams({ status: value });
    }
  };

  // Create array of active filters for filter chips
  const activeFilters = Object.entries(searchParams || {})
    .filter(([key, value]) => key !== 'status' && key !== 'customer_id' && value !== undefined && value !== '');

  return (
    <PageContainer 
      title="Rental Agreements" 
      description="Manage your rental agreements and contracts with customers"
      className="max-w-full"
    >
      {/* Stats Overview */}
      <div className="mb-6">
        <AgreementStats />
      </div>

      <Tabs 
        defaultValue="agreements"
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList>
            <TabsTrigger value="agreements">Agreements</TabsTrigger>
            <TabsTrigger value="history">Import History</TabsTrigger>
          </TabsList>

          {/* Search and Action Buttons */}
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex flex-grow relative w-full sm:w-auto max-w-md">
              <AgreementSearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCustomer={selectedCustomer}
                setSelectedCustomer={setSelectedCustomer}
                setSearchParams={setSearchParams}
              />
            </div>

            <AgreementActionButtons
              isImportModalOpen={isImportModalOpen}
              setIsImportModalOpen={setIsImportModalOpen}
              isEdgeFunctionAvailable={isEdgeFunctionAvailable}
            />
          </div>
        </div>
        
        {/* Active Filters */}
        <ActiveFilters
          activeFilters={activeFilters}
          setSearchParams={setSearchParams}
        />

        <TabsContent value="agreements" className="space-y-6">
          {/* Filter Panel */}
          <Card className="p-4 cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
            <h3 className="text-sm font-medium flex items-center">
              {showFilters ? "Hide Filters" : "Show Advanced Filters"}
            </h3>
            {showFilters && (
              <div className="mt-4">
                <AgreementFilters onFilterChange={handleFilterChange} currentFilters={searchParams} />
              </div>
            )}
          </Card>
          
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
        </TabsContent>

        <TabsContent value="history">
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart4 className="h-5 w-5 mr-2" />
              Import History
            </h2>
            <ImportHistoryList />
          </div>
        </TabsContent>
      </Tabs>
      
      <CSVImportModal 
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImportComplete={handleImportComplete}
      />
    </PageContainer>
  );
};

export default Agreements;
