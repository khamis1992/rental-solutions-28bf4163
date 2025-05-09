import React, { Suspense, useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { AgreementList } from '@/components/agreements/AgreementList-Simple';
import { ImportHistoryList } from '@/components/agreements/ImportHistoryList';
import { CSVImportModal } from '@/components/agreements/CSVImportModal';
import { useAgreements } from '@/hooks/use-agreements';
import { checkEdgeFunctionAvailability } from '@/utils/service-availability';
import { toast } from 'sonner';
import { runPaymentScheduleMaintenanceJob } from '@/lib/supabase';
import { BarChart4, Calendar, Database, Download, Filter, Plus, RefreshCw, Upload } from 'lucide-react';
import { AgreementStats } from '@/components/agreements/AgreementStats';
import { Card, CardContent } from '@/components/ui/card';
import { CustomerInfo } from '@/types/customer';
import { AgreementSearch } from '@/components/agreements/page/AgreementSearch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AgreementTable from '@/components/agreements/AgreementTable';
import { Badge } from '@/components/ui/badge';
import { AgreementViewSelectors } from '@/components/agreements/AgreementViewSelectors';
import { AgreementAnalytics } from '@/components/agreements/AgreementAnalytics';
import { AgreementFilterPanel } from '@/components/agreements/AgreementFilterPanel';

const Agreements = () => {
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

  const handleFilterChange = (filters: Record<string, any>) => {
    setSearchParams(prev => ({ ...prev, ...filters }));
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

  // Create array of active filters for filter chips
  const activeFilters = Object.entries(searchParams || {})
    .filter(([key, value]) => key !== 'status' && key !== 'customer_id' && value !== undefined && value !== '');

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Tabs 
                defaultValue={activeTab} 
                value={activeTab} 
                onValueChange={handleTabChange}
                className="w-full sm:w-auto"
              >
                <TabsList>
                  <TabsTrigger value="agreements">All Agreements</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="history">Import History</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* View Mode Selector */}
              <div className="flex items-center gap-2">
                <AgreementViewSelectors viewMode={viewMode} setViewMode={setViewMode} />
              </div>
            </div>
            
            {/* Search and Action Bar */}
            <div className="flex flex-col md:flex-row justify-between mt-4 gap-4">
              <div className="flex-1 max-w-md">
                <AgreementSearch
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedCustomer={selectedCustomer}
                  setSelectedCustomer={setSelectedCustomer}
                  setSearchParams={setSearchParams}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? "Hide Filters" : "Filters"}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsImportModalOpen(true)}>
                      Import from CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem>Download Template</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Agreement
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
                      onClick={() => setSearchParams({ [key]: undefined })}
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
                    const cleanParams = { ...searchParams };
                    activeFilters.forEach(([key]) => {
                      delete cleanParams[key];
                    });
                    setSearchParams(cleanParams);
                  }}
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <div className="border-b">
              <AgreementFilterPanel onFilterChange={handleFilterChange} currentFilters={searchParams} />
            </div>
          )}
          
          {/* Content Area - Important to keep TabsContent within the Tabs component */}
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsContent value="agreements" className="m-0">
                <Suspense fallback={
                  <div className="flex items-center justify-center h-64">
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-lg font-medium">Loading agreements...</span>
                    </div>
                  </div>
                }>
                  <div className="p-4">
                    {viewMode === 'card' && <AgreementList />}
                    {viewMode === 'table' && <AgreementTable />}
                    {viewMode === 'compact' && <AgreementTable compact />}
                  </div>
                </Suspense>
              </TabsContent>
              
              <TabsContent value="active" className="m-0">
                <Suspense fallback={
                  <div className="flex items-center justify-center h-64">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  </div>
                }>
                  <div className="p-4">
                    {viewMode === 'card' && <AgreementList />}
                    {viewMode === 'table' && <AgreementTable />}
                    {viewMode === 'compact' && <AgreementTable compact />}
                  </div>
                </Suspense>
              </TabsContent>
              
              <TabsContent value="pending" className="m-0">
                <Suspense fallback={
                  <div className="flex items-center justify-center h-64">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  </div>
                }>
                  <div className="p-4">
                    {viewMode === 'card' && <AgreementList />}
                    {viewMode === 'table' && <AgreementTable />}
                    {viewMode === 'compact' && <AgreementTable compact />}
                  </div>
                </Suspense>
              </TabsContent>

              <TabsContent value="history" className="m-0">
                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Import History
                  </h2>
                  <ImportHistoryList />
                </div>
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
