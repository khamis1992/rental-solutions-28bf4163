import React, { Suspense, useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/ui/PageHeader';

import { ImportHistoryList } from '@/components/agreements/ImportHistoryList';
import CSVImportModal from '@/components/agreements/CSVImportModal';
import { checkEdgeFunctionAvailability } from '@/utils/service-availability';

import { toast } from 'sonner';
import { runPaymentScheduleMaintenanceJob } from '@/lib/supabase';
import { BarChart4, Calendar, Database, Filter, Plus, RefreshCw, FileText, Download } from 'lucide-react';
import { AgreementStats } from '@/components/agreements/AgreementStats';
import { Card, CardContent } from '@/components/ui/card';
import { CustomerInfo } from '@/types/customer';
import { CustomerListFilterClone } from '@/components/agreements/CustomerListFilterClone';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

import { AgreementTabPanel } from '@/components/agreements/AgreementTabPanel';
import { Badge } from '@/components/ui/badge';
import { AgreementViewSelectors } from '@/components/agreements/AgreementViewSelectors';
import { AgreementAnalytics } from '@/components/agreements/AgreementAnalytics';
import { AgreementFilterPanel } from '@/components/agreements/AgreementFilterPanel';
import { ActiveFilters } from '@/components/agreements/page/ActiveFilters';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAgreementService } from '@/hooks/services/useAgreementService';
import { AgreementDebugPanel } from '@/components/debug/AgreementDebugPanel';
import { exportAllAgreementsToCSV } from '@/services/AgreementExportService';

const Agreements = () => {
  const navigate = useNavigate();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEdgeFunctionAvailable, setIsEdgeFunctionAvailable] = useState(true);
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => urlSearchParams.get('searchTerm') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('agreements');
  const [viewMode, setViewMode] = useState('card' as 'card' | 'table' | 'compact');
  const [isExporting, setIsExporting] = useState(false);
  
  // Use the agreement service hook
  const {
    agreements,
    isLoading,
    error,
    searchParams,
    setSearchParams,
    refetch,
    deleteAgreement,
    useRealtimeUpdates
  } = useAgreementService();
  
  console.log('📊 Agreements page state:', { 
    agreementsCount: agreements?.length || 0, 
    isLoading, 
    error: error?.message,
    searchParams 
  });
  
  useRealtimeUpdates();
  
  // Add state for customer search functionality
  const [selectedCustomer, setSelectedCustomer] = useState(null as CustomerInfo | null);
  
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
        toast.error("خدمة استيراد ملفات CSV غير متاحة. يرجى المحاولة مرة أخرى لاحقاً أو التواصل مع الدعم الفني.", {
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

  // Function to filter agreements based on tab and current filters
  const getFilteredAgreements = (tabValue: string) => {
    console.log('🔍 getFilteredAgreements called for tab:', tabValue, 'with agreements:', agreements?.length || 0);
    
    if (!agreements || !Array.isArray(agreements)) {
      console.warn('⚠️ No agreements data available for filtering');
      return [];
    }
    
    let filteredAgreements = [...agreements];
    
    // Apply tab-specific filters only if no global filters are applied
    // This allows users to see filtered results across all tabs
    if (!searchParams || Object.keys(searchParams).length === 0) {
      switch (tabValue) {
        case 'active':
          filteredAgreements = filteredAgreements.filter(agreement => agreement.status === 'active');
          break;
        case 'completed':
        case 'closed':
          filteredAgreements = filteredAgreements.filter(agreement => agreement.status === 'closed');
          break;
        case 'cancelled':
          filteredAgreements = filteredAgreements.filter(agreement => agreement.status === 'cancelled');
          break;
        case 'agreements':
        default:
          // Show all agreements for the main tab
          break;
      }
    } else {
      // If global filters are applied, show filtered results but also apply tab filter
      switch (tabValue) {
        case 'active':
          filteredAgreements = filteredAgreements.filter(agreement => agreement.status === 'active');
          break;
        case 'completed':
        case 'closed':
          filteredAgreements = filteredAgreements.filter(agreement => agreement.status === 'closed');
          break;
        case 'cancelled':
          filteredAgreements = filteredAgreements.filter(agreement => agreement.status === 'cancelled');
          break;
        case 'agreements':
        default:
          // Show all filtered agreements for the main tab
          break;
      }
    }
    
    console.log(`✅ Filtered agreements for tab ${tabValue}:`, filteredAgreements.length, 'out of', agreements.length);
    return filteredAgreements;
  };

  // Handle filter change with proper state management
  const handleFilterChange = (filters: Record<string, any>) => {
    setSearchParams(filters);
    console.log('Filters applied:', filters);
  };

  // Updated to ensure pagination resets when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Don't reset search params when changing tabs - let the filters persist
    // This allows the user to see filtered results in different tabs
  };

  // Handle search using the component - matching the CustomerListFilter behavior exactly
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSearchParams({ searchTerm: query || undefined });

    const newParams = new URLSearchParams(urlSearchParams.toString());
    if (query) {
      newParams.set('searchTerm', query);
    } else {
      newParams.delete('searchTerm');
    }
    setUrlSearchParams(newParams);
  };

  // Create array of active filters for filter chips
  const activeFilters = Object.entries(searchParams || {})
    .filter(
      ([key, value]) =>
        key !== 'status' &&
        key !== 'customerId' &&
        key !== 'searchTerm' &&
        value !== undefined &&
        value !== ''
    );

  // Function to navigate to add agreement page
  const handleAddAgreement = () => {
    navigate('/agreements/add');
  };

  // Export all agreements to CSV
  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const toastId = toast.loading('جاري تجهيز ملف CSV للعقود...');
      await exportAllAgreementsToCSV();
      toast.success('تم تنزيل ملف CSV بنجاح');
      toast.dismiss(toastId);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تصدير العقود');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <PageContainer 
      className="max-w-full"
      dir="rtl"
    >
      <PageHeader
        title="عقود الإيجار"
        subtitle="إدارة عقود وتعاهدات الإيجار مع العملاء"
        icon={<FileText className="w-6 h-6 text-blue-500" />}
        align="right"
        dir="rtl"
      />
      
      <div className="flex flex-col gap-6" dir="rtl">
        {/* Debug Panel - Development Only */}
        <AgreementDebugPanel 
          agreements={agreements || []}
          isLoading={isLoading}
          error={error}
          searchParams={searchParams}
        />
        
        {/* Analytics Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Stats Overview */}
          <div className="xl:col-span-2">
            <AgreementStats className="h-full" />
          </div>
          
          {/* Analytics Preview */}
          <div className="xl:col-span-1">
            <AgreementAnalytics onFilterApply={handleFilterChange} />
          </div>
        </div>
        
        {/* Main Content Area with Tabs */}
        <Card dir="rtl">
          <div className="p-4 border-b">
            <div className="flex flex-col sm:flex-row-reverse justify-between items-start sm:items-center gap-4">
              {/* View Mode Selector */}
              <div className="flex items-center gap-2">
                <AgreementViewSelectors viewMode={viewMode} setViewMode={setViewMode} />
              </div>
            </div>
            
            {/* Search and Action Bar */}
            <div className="flex flex-col md:flex-row-reverse justify-between mt-4 gap-4">
              <CustomerListFilterClone
                searchTerm={searchQuery}
                onSearch={handleSearch}
                onFilterChange={handleFilterChange}
              />
              
              <div className="flex items-center gap-2 flex-row-reverse">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex-row-reverse"
                >
                  <Filter className="h-4 w-4 ml-2" />
                  {showFilters ? "إخفاء المرشحات" : "مرشحات متقدمة"}
                </Button>
                
                <Button 
                  variant="secondary"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={isExporting}
                  className="flex-row-reverse"
                >
                  <Download className="h-4 w-4 ml-2" />
                  {isExporting ? 'جاري التصدير...' : 'تصدير CSV'}
                </Button>
                
                <Button 
                  size="sm"
                  onClick={handleAddAgreement}
                  className="flex-row-reverse"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  عقد جديد
                </Button>
              </div>
            </div>
            
            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="mt-4">
                <ActiveFilters 
                  activeFilters={activeFilters as [string, string][]}
                  setSearchParams={setSearchParams}
                />
              </div>
            )}
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <div className="border-b">
              <AgreementFilterPanel onFilterChange={handleFilterChange} currentFilters={searchParams} />
            </div>
          )}
          
          {/* Content Area */}
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto" dir="rtl">
              <TabsList className="justify-start">
                <TabsTrigger value="agreements" className="text-right">جميع العقود</TabsTrigger>
                <TabsTrigger value="active" className="text-right">نشطة</TabsTrigger>
                <TabsTrigger value="closed" className="text-right">مكتملة</TabsTrigger>
                <TabsTrigger value="cancelled" className="text-right">ملغاة</TabsTrigger>
                <TabsTrigger value="history" className="text-right">سجل الاستيراد</TabsTrigger>
              </TabsList>
              <AgreementTabPanel
                value="agreements"
                viewMode={viewMode}
                agreements={getFilteredAgreements('agreements')}
                isLoading={isLoading}
                onDeleteAgreement={deleteAgreement}
                loadingText="جاري تحميل العقود..."
              />
              <AgreementTabPanel
                value="active"
                viewMode={viewMode}
                agreements={getFilteredAgreements('active')}
                isLoading={isLoading}
                onDeleteAgreement={deleteAgreement}
                loadingText=""
              />
              <AgreementTabPanel
                value="closed"
                viewMode={viewMode}
                agreements={getFilteredAgreements('closed')}
                isLoading={isLoading}
                onDeleteAgreement={deleteAgreement}
                loadingText=""
              />
              <AgreementTabPanel
                value="cancelled"
                viewMode={viewMode}
                agreements={getFilteredAgreements('cancelled')}
                isLoading={isLoading}
                onDeleteAgreement={deleteAgreement}
                loadingText=""
              />
              <TabsContent value="history" className="m-0">
                <div className="p-4" dir="rtl">
                  <h2 className="text-lg font-semibold mb-4 flex items-center text-right justify-end">
                    <Database className="h-5 w-5 ml-2" />
                    سجل الاستيراد
                  </h2>
                  <ImportHistoryList items={[]} isLoading={false} />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <CSVImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </PageContainer>
  );
};

export default Agreements;
