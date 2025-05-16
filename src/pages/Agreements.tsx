
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { CSVImportModal } from '@/components/agreements/CSVImportModal';
import { AgreementFilterPanel } from '@/components/agreements/AgreementFilterPanel';
import { ActiveFilters } from '@/components/agreements/page/ActiveFilters';
import { AgreementHeader } from '@/components/agreements/page/AgreementHeader';
import { SearchActionBar } from '@/components/agreements/page/SearchActionBar';
import { AgreementContent } from '@/components/agreements/page/AgreementContent';
import { AgreementTopSection } from '@/components/agreements/page/AgreementTopSection';
import { checkEdgeFunctionAvailability } from '@/utils/service-availability';
import { runPaymentScheduleMaintenanceJob } from '@/lib/supabase';
import { useAgreementService } from '@/hooks/services/useAgreementService';

const Agreements = () => {
  const navigate = useNavigate();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEdgeFunctionAvailable, setIsEdgeFunctionAvailable] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('agreements');
  const [viewMode, setViewMode] = useState<'card' | 'table' | 'compact'>('card');
  
  // Use the agreement service hook
  const { 
    searchParams, 
    setSearchParams, 
    refetch 
  } = useAgreementService();
  
  // Initial edge function check
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
    // Reset filters and refresh data
    setSearchParams({});
    refetch();
  };

  const handleFilterChange = (filters: Record<string, any>) => {
    setSearchParams(filters);
  };

  // Updated to ensure pagination resets when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'all' || value === 'agreements') {
      setSearchParams({ status: undefined });
    } else if (value === 'active' || value === 'pending' || value === 'history') {
      // Only set the status filter for valid status values
      setSearchParams({ status: value === 'history' ? undefined : value });
    }
  };

  // Handle search using the component
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSearchParams({ searchTerm: query || undefined });
  };

  // Create array of active filters for filter chips
  const activeFilters = Object.entries(searchParams || {})
    .filter(([key, value]) => key !== 'status' && key !== 'customerId' && key !== 'searchTerm' && value !== undefined && value !== '');

  // Function to navigate to add agreement page
  const handleAddAgreement = () => {
    navigate('/agreements/add');
  };

  return (
    <PageContainer 
      title="Rental Agreements" 
      description="Manage your rental agreements and contracts with customers"
      className="max-w-full"
    >
      <div className="flex flex-col gap-6">
        {/* Analytics and Stats Section */}
        <AgreementTopSection />
        
        {/* Main Content Area with Tabs */}
        <Card>
          <div className="p-4 border-b">
            {/* Tabs and View Mode Selection */}
            <AgreementHeader 
              activeTab={activeTab}
              onTabChange={handleTabChange}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
            
            {/* Search and Action Bar */}
            <SearchActionBar 
              searchQuery={searchQuery}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              onSearch={handleSearch}
              onFilterChange={handleFilterChange}
              onImportClick={() => setIsImportModalOpen(true)}
              onAddAgreementClick={handleAddAgreement}
            />
            
            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="mt-4">
                <ActiveFilters 
                  activeFilters={activeFilters}
                  setSearchParams={setSearchParams}
                />
              </div>
            )}
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <div className="border-b">
              <AgreementFilterPanel 
                onFilterChange={handleFilterChange} 
                currentFilters={searchParams} 
              />
            </div>
          )}
          
          {/* Content Area */}
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <AgreementContent 
                activeTab={activeTab} 
                viewMode={viewMode}
              />
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Import Modal */}
      <CSVImportModal 
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImportComplete={handleImportComplete}
      />
    </PageContainer>
  );
};

export default Agreements;
