
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerService } from '@/hooks/services/useCustomerService';
import { CustomerListFilter } from '@/components/customers/CustomerListFilter';
import { CustomerDataGrid } from '@/components/customers/CustomerDataGrid';
import { CustomerStatsCards } from '@/components/customers/CustomerStatsCards';
import { CustomerImportHistory } from '@/components/customers/CustomerImportHistory';
import { CSVImportModal } from '@/components/customers/CSVImportModal';
import { CustomerDetailsSidebar } from '@/components/customers/CustomerDetailsSidebar';
import { CustomerInfo } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload, RefreshCw, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageContainer from '@/components/layout/PageContainer';
import { checkEdgeFunctionAvailability } from '@/utils/service-availability';
import { toast } from 'sonner';

const Customers = () => {
  const navigate = useNavigate();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEdgeFunctionAvailable, setIsEdgeFunctionAvailable] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Customer service hook with filtering capabilities
  const {
    customers,
    isLoading,
    error,
    filters,
    setFilters,
    refetch,
    isPending
  } = useCustomerService();

  // Check if edge function for importing is available
  useEffect(() => {
    const checkAvailability = async () => {
      const available = await checkEdgeFunctionAvailability('process-customer-imports', 2);
      setIsEdgeFunctionAvailable(available);
    };
    
    checkAvailability();
  }, []);

  // Handle refreshing the customer data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Customer data refreshed');
    } catch (error) {
      toast.error('Failed to refresh customer data');
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    
    if (value === 'all') {
      setFilters({ ...filters, status: undefined });
    } else {
      setFilters({ ...filters, status: value });
    }
  };

  // Handle customer selection for sidebar view
  const handleCustomerSelect = (customer: CustomerInfo) => {
    setSelectedCustomer(customer);
    setIsSidebarOpen(true);
  };

  // Handle adding a new customer
  const handleAddCustomer = () => {
    navigate('/customers/add');
  };

  // Handle import complete
  const handleImportComplete = () => {
    refetch();
    setIsImportModalOpen(false);
  };

  return (
    <PageContainer 
      title="Customer Management"
      description="Manage your customers, view details, and track customer information"
    >
      {/* Main content layout */}
      <div className="flex flex-col space-y-6">
        {/* Customer Stats Cards */}
        <CustomerStatsCards customers={customers} isLoading={isLoading} />
        
        {/* Toolbar with actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <CustomerListFilter 
            onSearch={(query) => setFilters({ ...filters, searchTerm: query })} 
            searchTerm={filters.searchTerm || ''}
          />
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
              disabled={!isEdgeFunctionAvailable}
              className="flex items-center gap-1"
            >
              {!isEdgeFunctionAvailable && <AlertTriangle className="h-4 w-4 text-amber-500" />}
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
            
            <Button 
              onClick={handleAddCustomer}
              size="sm"
              className="flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <PlusCircle className="h-4 w-4" />
              Add Customer
            </Button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <Tabs defaultValue="all" value={selectedTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-5 w-full sm:w-auto">
            <TabsTrigger value="all">All Customers</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
            <TabsTrigger value="pending_review">Pending Review</TabsTrigger>
            <TabsTrigger value="blacklisted">Blacklisted</TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedTab} className="mt-6">
            {/* Customer Data Grid */}
            <CustomerDataGrid 
              customers={customers} 
              isLoading={isLoading}
              onCustomerSelect={handleCustomerSelect}
            />
          </TabsContent>
        </Tabs>
        
        {/* Import History */}
        <div className="mt-8">
          <CustomerImportHistory />
        </div>
      </div>
      
      {/* Modals and Sidebars */}
      <CSVImportModal 
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImportComplete={handleImportComplete}
      />
      
      <CustomerDetailsSidebar
        customer={selectedCustomer}
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
      />
    </PageContainer>
  );
};

export default Customers;
