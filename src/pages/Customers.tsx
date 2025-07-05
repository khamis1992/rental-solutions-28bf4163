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
import { useLocation } from 'react-router-dom';
import { Users } from 'lucide-react';
import '@/styles/customer-mobile.css';

const Customers = () => {
  const { language } = useLanguage();
  const location = useLocation();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
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

  // Check if coming from quick actions to add customer
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const action = urlParams.get('action');
    
    if (action === 'add' || location.state?.openAddCustomer) {
      setIsAddCustomerModalOpen(true);
    }
  }, [location]);

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
    await CacheSynchronization.invalidateCustomerCaches();
    refetch();
    setIsImportModalOpen(false);
  };

  // Handle add customer complete
  const handleAddCustomerComplete = async () => {
    await CacheSynchronization.invalidateCustomerCaches();
    refetch();
    setIsAddCustomerModalOpen(false);
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
        <CustomerPageStatsCards 
          customers={transformedCustomers} 
          isLoading={isLoading} 
        />
        
        <CustomerPageToolbar
          filters={{ ...filters, search: filters?.search || '' }}
          setFilters={setFilters}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onImportClick={() => setIsImportModalOpen(true)}
          onAddCustomer={() => setIsAddCustomerModalOpen(true)}
          isEdgeFunctionAvailable={isEdgeFunctionAvailable}
        />
        
        <CustomerPageTabContent
          selectedTab={selectedTab}
          onTabChange={handleTabChange}
          customers={transformedCustomers}
          isLoading={isLoading}
          onCustomerSelect={handleCustomerSelect}
        />
        
        <div className="mt-8">
          <CustomerImportHistory />
        </div>
      </div>
      
      <CustomerPageModals
        isImportModalOpen={isImportModalOpen}
        onImportModalChange={setIsImportModalOpen}
        onImportComplete={handleImportComplete}
        isAddCustomerModalOpen={isAddCustomerModalOpen}
        onAddCustomerModalChange={setIsAddCustomerModalOpen}
        onAddCustomerComplete={handleAddCustomerComplete}
        selectedCustomer={selectedCustomer}
        isSidebarOpen={isSidebarOpen}
        onSidebarChange={setIsSidebarOpen}
      />
    </PageContainer>
  );
};

export default Customers;
