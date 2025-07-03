import React, { useState, useEffect } from 'react';
import { useCustomerService } from '@/hooks/services/useCustomerService';
import { CustomerImportHistory } from '@/components/customers/CustomerImportHistory';
import { CustomerPageStatsCards } from '@/components/customers/CustomerPageStatsCards';
import { CustomerPageToolbar } from '@/components/customers/CustomerPageToolbar';
import { CustomerPageTabContent } from '@/components/customers/CustomerPageTabContent';
import { CustomerPageModals } from '@/components/customers/CustomerPageModals';
import type { CustomerInfo } from '@/types/customer';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/ui/PageHeader';
import { checkEdgeFunctionAvailability } from '@/utils/service-availability';
import { toast } from 'sonner';
import { CacheSynchronization } from '@/utils/cache-synchronization';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users } from 'lucide-react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import '@/styles/customer-mobile.css';

const Customers = () => {
  const { language } = useLanguage();
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
    refetch
  } = useCustomerService();
  
  // Use error handler
  const { error: errorState, handleError, clearError } = useErrorHandler();

  // Transform customers data to match CustomerInfo type
  const transformedCustomers: CustomerInfo[] = (customers || []).map(customer => ({
    id: customer.id || '',
    email: customer.email || '',
    full_name: customer.full_name || '',
    phone_number: customer.phone_number || customer.phone || '',
    address: customer.address || '',
    city: customer.city || '',
    state: customer.state || '',
    zip_code: customer.zip_code || '',
    role: 'customer',
    created_at: customer.created_at || '',
    updated_at: customer.updated_at || '',
    status: customer.status as 'active' | 'inactive' | 'blacklisted' | 'pending_review' | 'pending_payment' || 'active'
  }));

  // Check if edge function for importing is available
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const available = await checkEdgeFunctionAvailability('process-customer-imports', 2);
        setIsEdgeFunctionAvailable(available);
      } catch (error) {
        handleError(error, {
          showToast: true,
          logError: true,
          context: { page: 'customers', action: 'checkEdgeFunctionAvailability' }
        });
      }
    };
    
    checkAvailability();
  }, [handleError]);

  // Handle refreshing the customer data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      clearError();
      await CacheSynchronization.invalidateCustomerCaches();
      await refetch();
      toast.success(language === 'ar' ? 'تم تحديث بيانات العملاء' : 'Customer data refreshed');
    } catch (error) {
      handleError(error, {
        showToast: true,
        logError: true,
        context: { page: 'customers', action: 'refresh' }
      });
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
      setFilters({ ...filters, status: value as any });
    }
  };

  // Handle customer selection for sidebar view
  const handleCustomerSelect = (customer: CustomerInfo) => {
    setSelectedCustomer(customer);
    setIsSidebarOpen(true);
  };

  // Handle import complete
  const handleImportComplete = async () => {
    try {
      await CacheSynchronization.invalidateCustomerCaches();
      refetch();
      setIsImportModalOpen(false);
    } catch (error) {
      handleError(error, {
        showToast: true,
        logError: true,
        context: { page: 'customers', action: 'importComplete' }
      });
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="العملاء"
        subtitle="إدارة العملاء وعرض التفاصيل وتتبع معلومات العملاء"
        icon={<Users className="w-6 h-6 text-blue-500" />}
        align="right"
        dir="rtl"
      />
      
      <div 
        className="flex flex-col space-y-6 mt-6" 
        dir="rtl"
        style={{ textAlign: 'right', direction: 'rtl' }}
      >
        {/* Error Display */}
        {errorState.hasError && (
          <ErrorDisplay
            error={errorState.error}
            variant="card"
            showRetry={true}
            onRetry={() => {
              clearError();
              handleRefresh();
            }}
          />
        )}
        
        <ErrorBoundary 
          context={{ page: 'customers', component: 'stats' }}
          showRetry={true}
          showBack={false}
        >
          <CustomerPageStatsCards 
            customers={transformedCustomers} 
            isLoading={isLoading} 
          />
        </ErrorBoundary>
        
        <ErrorBoundary 
          context={{ page: 'customers', component: 'toolbar' }}
          showRetry={true}
          showBack={false}
        >
          <CustomerPageToolbar
            filters={{ ...filters, search: filters?.search || '' }}
            setFilters={setFilters}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            onImportClick={() => setIsImportModalOpen(true)}
            isEdgeFunctionAvailable={isEdgeFunctionAvailable}
          />
        </ErrorBoundary>
        
        <ErrorBoundary 
          context={{ page: 'customers', component: 'content' }}
          showRetry={true}
          showBack={false}
        >
          <CustomerPageTabContent
            selectedTab={selectedTab}
            onTabChange={handleTabChange}
            customers={transformedCustomers}
            isLoading={isLoading}
            onCustomerSelect={handleCustomerSelect}
          />
        </ErrorBoundary>
        
        <ErrorBoundary 
          context={{ page: 'customers', component: 'history' }}
          showRetry={true}
          showBack={false}
        >
          <div className="mt-8">
            <CustomerImportHistory />
          </div>
        </ErrorBoundary>
      </div>
      
      <ErrorBoundary 
        context={{ page: 'customers', component: 'modals' }}
        showRetry={true}
        showBack={false}
      >
        <CustomerPageModals
          isImportModalOpen={isImportModalOpen}
          onImportModalChange={setIsImportModalOpen}
          onImportComplete={handleImportComplete}
          selectedCustomer={selectedCustomer}
          isSidebarOpen={isSidebarOpen}
          onSidebarChange={setIsSidebarOpen}
        />
      </ErrorBoundary>
    </PageContainer>
  );
};

export default Customers;
