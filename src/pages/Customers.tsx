import React, { useState, useEffect, memo } from 'react';
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

// Global State Management & Communication
import { 
  useLoadingState,
  useCacheState,
  useSelectionState
} from '@/hooks/use-global-state-management';
import { 
  useComponentMessaging, 
  useComponentLifecycle 
} from '@/components/providers/CommunicationProvider';
import { EVENTS } from '@/utils/component-communication';

// Advanced Systems
import { useAdvancedStateSync, useSmartCache } from '@/hooks/use-advanced-state-sync';
import { useCrossPageSync } from '@/utils/cross-page-sync';
import { VirtualizedList } from '@/components/ui/VirtualizedList';

const Customers = memo(() => {
  const { language } = useLanguage();
  
  // Global State Management
  const { isLoading: globalLoading, withLoading } = useLoadingState('customers');
  const { setCache: setCachedCustomers } = useCacheState('customers');
  const { selection, setSelection } = useSelectionState('customers');
  
  // Communication & Event Bus
  const messaging = useComponentMessaging();
  useComponentLifecycle('CustomersPage');
  
  // Local state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEdgeFunctionAvailable, setIsEdgeFunctionAvailable] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(
    selection?.customer || null
  );
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

  // Handle refreshing the customer data with global state management
  const handleRefresh = async () => {
    return withLoading(async () => {
      setIsRefreshing(true);
      try {
        clearError();
        
        // Emit refresh event
        messaging.emit(EVENTS.DATA_REFRESH, { entity: 'customers' });
        
        await CacheSynchronization.invalidateCustomerCaches();
        await refetch();
        
        // Cache the results
        setCachedCustomers(transformedCustomers);
        
        // Emit success event
        messaging.emit(EVENTS.DATA_UPDATED, { entity: 'customers', count: transformedCustomers.length });
        
        toast.success(language === 'ar' ? 'تم تحديث بيانات العملاء' : 'Customer data refreshed');
      } catch (error) {
        handleError(error, {
          showToast: true,
          logError: true,
          context: { page: 'customers', action: 'refresh' }
        });
        
        // Emit error event
        messaging.emit(EVENTS.ERROR_OCCURRED, { entity: 'customers', error });
      } finally {
        setIsRefreshing(false);
      }
    });
  };

  // Handle tab change with event emission
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    
    const newFilters = { ...filters };
    if (value === 'all') {
      delete newFilters.status;
    } else {
      newFilters.status = value as any;
    }
    
    setFilters(newFilters);
    
    // Emit filter change event
    messaging.emit(EVENTS.FILTER_CHANGED, { entity: 'customers', filters: newFilters });
  };

  // Handle customer selection for sidebar view
  const handleCustomerSelect = (customer: CustomerInfo) => {
    setSelectedCustomer(customer);
    setSelection({ customer });
    setIsSidebarOpen(true);
    
    // Emit selection event
    messaging.emit(EVENTS.USER_SELECTION, { entity: 'customers', item: customer });
  };

  // Handle import complete with caching
  const handleImportComplete = async () => {
    try {
      // Emit import complete event
      messaging.emit(EVENTS.DATA_CREATED, { entity: 'customers', action: 'import' });
      
      await CacheSynchronization.invalidateCustomerCaches();
      await refetch();
      
      // Update cache
      setCachedCustomers(transformedCustomers);
      
      setIsImportModalOpen(false);
      
      toast.success(language === 'ar' ? 'تم استيراد العملاء بنجاح' : 'Customers imported successfully');
    } catch (error) {
      handleError(error, {
        showToast: true,
        logError: true,
        context: { page: 'customers', action: 'importComplete' }
      });
    }
  };

  // Error handling
  const currentError = errorState?.error || error;

  if (currentError) {
    return (
      <PageContainer>
        <ErrorDisplay 
          error={currentError} 
          onRetry={handleRefresh}
          title="خطأ في تحميل العملاء"
        />
      </PageContainer>
    );
  }

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
        <ErrorBoundary 
          context={{ page: 'customers', component: 'stats' }}
          showRetry={true}
          showBack={false}
        >
          <CustomerPageStatsCards 
            customers={transformedCustomers} 
            isLoading={isLoading || globalLoading} 
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
            isLoading={isLoading || globalLoading}
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
});

Customers.displayName = 'Customers';

export default Customers;
