
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { CSVImportModal } from '@/components/agreements/CSVImportModal';
import { useAgreements } from '@/hooks/use-agreements';
import { checkEdgeFunctionAvailability } from '@/utils/service-availability';
import { toast } from 'sonner';
import { runPaymentScheduleMaintenanceJob } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { CustomerInfo } from '@/types/customer';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { AgreementStats } from '@/components/agreements/AgreementStats';
import { AgreementAnalytics } from '@/components/agreements/AgreementAnalytics';
import { AgreementFilterPanel } from '@/components/agreements/AgreementFilterPanel';
import { AgreementHeader } from '@/components/agreements/page/AgreementHeader';
import { AgreementFiltersBar } from '@/components/agreements/page/AgreementFiltersBar';
import { AgreementContent } from '@/components/agreements/page/AgreementContent';
import { AgreementActiveFilters } from '@/components/agreements/page/AgreementActiveFilters';

const Agreements = () => {
  const navigate = useNavigate();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEdgeFunctionAvailable, setIsEdgeFunctionAvailable] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { setSearchParams, searchParams } = useAgreements();
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('agreements');
  const [viewMode, setViewMode] = useState<'card' | 'table' | 'compact'>('card');
  
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

  // Fix for the TypeScript error by using a properly typed function
  const handleFilterChange = (key: string, value: string) => {
    setSearchParams((prev) => {
      // Create a new object with the spread of previous params
      const updatedParams: Record<string, string> = {};
      
      // Copy existing params
      for (const [paramKey, paramValue] of Object.entries(prev)) {
        updatedParams[paramKey] = paramValue;
      }
      
      // Update or add the new key-value pair
      if (value) {
        updatedParams[key] = value;
      } else {
        delete updatedParams[key];
      }
      
      return updatedParams;
    });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'all' || value === 'agreements') {
      setSearchParams({ status: undefined });
    } else if (value === 'active' || value === 'pending' || value === 'history') {
      // Only set the status filter for valid status values
      setSearchParams({ status: value === 'history' ? undefined : value });
    }
  };
  
  const handleAddAgreement = () => {
    navigate('/agreements/add');
  };

  // Create array of active filters for filter chips
  const activeFilters = Object.entries(searchParams || {})
    .filter(([key, value]) => key !== 'status' && key !== 'customer_id' && value !== undefined && value !== '');

  // Adapter function to match the expected function signature for AgreementFilterPanel
  const filterChangeAdapter = (filters: Record<string, any>) => {
    Object.entries(filters).forEach(([key, value]) => {
      handleFilterChange(key, value as string);
    });
  };

  return (
    <PageContainer 
      title="Rental Agreements" 
      description="Manage your rental agreements and contracts with customers"
      className="max-w-full"
    >
      <div className="flex flex-col gap-6">
        {/* Analytics Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Stats Overview */}
          <div className="xl:col-span-2">
            <AgreementStats className="h-full" />
          </div>
          
          {/* Analytics Preview */}
          <div className="xl:col-span-1">
            <AgreementAnalytics />
          </div>
        </div>
        
        {/* Main Content Area with Tabs */}
        <Card>
          <div className="p-4 border-b">
            {/* Header with Tabs and View Mode Selectors */}
            <AgreementHeader
              activeTab={activeTab}
              handleTabChange={handleTabChange}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
            
            {/* Search and Action Bar */}
            <AgreementFiltersBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
              setSearchParams={setSearchParams}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              setIsImportModalOpen={setIsImportModalOpen}
              onAddAgreement={handleAddAgreement}
            />
            
            {/* Active Filters */}
            <AgreementActiveFilters
              activeFilters={activeFilters}
              setSearchParams={setSearchParams}
            />
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <div className="border-b">
              <AgreementFilterPanel onFilterChange={filterChangeAdapter} currentFilters={searchParams} />
            </div>
          )}
          
          {/* Content Area - Important to keep TabsContent within the Tabs component */}
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsContent value="agreements" className="m-0">
                <AgreementContent activeTab={activeTab} viewMode={viewMode} />
              </TabsContent>
              
              <TabsContent value="active" className="m-0">
                <AgreementContent activeTab={activeTab} viewMode={viewMode} />
              </TabsContent>
              
              <TabsContent value="pending" className="m-0">
                <AgreementContent activeTab={activeTab} viewMode={viewMode} />
              </TabsContent>

              <TabsContent value="history" className="m-0">
                <AgreementContent activeTab="history" viewMode={viewMode} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
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
