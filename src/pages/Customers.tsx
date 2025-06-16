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
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { responsivePadding, responsiveSpacing } from '@/utils/responsive-utils';

const Customers = () => {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
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
      const available = await checkEdgeFunctionAvailability('process-customer-imports', 2);
      setIsEdgeFunctionAvailable(available);
    };
    
    checkAvailability();
  }, []);

  // Handle refreshing the customer data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await CacheSynchronization.invalidateCustomerCaches();
      await refetch();
      toast.success(language === 'ar' ? 'تم تحديث بيانات العملاء' : 'Customer data refreshed');
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل في تحديث بيانات العملاء' : 'Failed to refresh customer data');
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

  // Handle import complete
  const handleImportComplete = async () => {
    await CacheSynchronization.invalidateCustomerCaches();
    refetch();
    setIsImportModalOpen(false);
  };

  return (
    <PageContainer className={cn(
      "max-w-7xl mx-auto",
      responsivePadding.page
    )}>
      <div className="mb-4 sm:mb-6">
        <PageHeader
          title="العملاء"
          subtitle="إدارة العملاء وعرض التفاصيل وتتبع معلومات العملاء"
          icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />}
          align="right"
          dir="rtl"
        />
      </div>
      
      <div 
        className={cn(
          "flex flex-col",
          responsiveSpacing.stack
        )}
        dir="rtl"
        style={{ textAlign: 'right', direction: 'rtl' }}
      >
        {/* Stats Cards - Mobile optimized grid */}
        <div className="w-full">
          <CustomerPageStatsCards 
            customers={transformedCustomers} 
            isLoading={isLoading} 
          />
        </div>
        
        {/* Toolbar - Mobile responsive */}
        <div className="w-full">
          <CustomerPageToolbar
            filters={{ ...filters, search: filters?.search || '' }}
            setFilters={setFilters}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            onImportClick={() => setIsImportModalOpen(true)}
            isEdgeFunctionAvailable={isEdgeFunctionAvailable}
          />
        </div>
        
        {/* Tab Content - Mobile optimized */}
        <div className="w-full">
          <CustomerPageTabContent
            selectedTab={selectedTab}
            onTabChange={handleTabChange}
            customers={transformedCustomers}
            isLoading={isLoading}
            onCustomerSelect={handleCustomerSelect}
          />
        </div>
        
        {/* Import History - Hidden on mobile for cleaner UI */}
        {!isMobile && (
          <div className="mt-6 sm:mt-8">
            <CustomerImportHistory />
          </div>
        )}
      </div>
      
      {/* Modals - Mobile optimized */}
      <CustomerPageModals
        isImportModalOpen={isImportModalOpen}
        onImportModalChange={setIsImportModalOpen}
        onImportComplete={handleImportComplete}
        selectedCustomer={selectedCustomer}
        isSidebarOpen={isSidebarOpen}
        onSidebarChange={setIsSidebarOpen}
      />
    </PageContainer>
  );
};

export default Customers;
