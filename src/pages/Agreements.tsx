import React, { Suspense, useState, memo } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/ui/PageHeader';

import { ImportHistoryList } from '@/components/agreements/ImportHistoryList';
import CSVImportModal from '@/components/agreements/CSVImportModal';
import { checkEdgeFunctionAvailability } from '@/utils/service-availability';

import { toast } from 'sonner';
import { runPaymentScheduleMaintenanceJob } from '@/lib/supabase';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { BarChart4, Calendar, Database, Filter, Plus, RefreshCw, FileText } from 'lucide-react';
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

// Global State Management & Communication
import { 
  useFilterState,
  useLoadingState,
  useCacheState,
  useSelectionState
} from '@/hooks/use-global-state-management';
import { 
  useComponentMessaging, 
  useComponentLifecycle 
} from '@/components/providers/CommunicationProvider';
import { EVENTS } from '@/utils/component-communication';

const Agreements = memo(() => {
  const navigate = useNavigate();
  
  // Global State Management
  const { filter: globalFilters, setFilter } = useFilterState('agreements');
  const { isLoading: globalLoading, withLoading } = useLoadingState('agreements');
  const { cache: cachedAgreements, setCache: setCachedAgreements } = useCacheState('agreements');
  const { selection, setSelection } = useSelectionState('agreements');
  
  // Communication & Event Bus
  const messaging = useComponentMessaging();
  useComponentLifecycle('AgreementsPage');
  
  // Local state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEdgeFunctionAvailable, setIsEdgeFunctionAvailable] = useState(true);
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => urlSearchParams.get('searchTerm') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState(globalFilters?.tab || 'agreements');
  const [viewMode, setViewMode] = useState(globalFilters?.viewMode || 'card' as 'card' | 'table' | 'compact');
  
  // Use the agreement service hook
  const {
    agreements,
    isLoading,
    searchParams,
    setSearchParams,
    refetch,
    deleteAgreement,
    useRealtimeUpdates
  } = useAgreementService();
  
  useRealtimeUpdates();
  
  // Use error handler
  const { error: errorState, handleError, clearError } = useErrorHandler();
  
  // Add state for customer search functionality
  const [selectedCustomer, setSelectedCustomer] = useState(
    selection?.customer || null as CustomerInfo | null
  );
  
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
      return withLoading(async () => {
        try {
          // Emit loading event
          messaging.emit(EVENTS.DATA_LOADING, { entity: 'agreements', action: 'edge_function_check' });
          
          const available = await checkEdgeFunctionAvailability('process-agreement-imports');
          setIsEdgeFunctionAvailable(available);
          
          if (!available) {
            messaging.showError(
              "خدمة الاستيراد غير متاحة",
              "خدمة استيراد ملفات CSV غير متاحة. يرجى المحاولة مرة أخرى لاحقاً أو التواصل مع الدعم الفني."
            );
          }
          
          // Emit success event
          messaging.emit(EVENTS.DATA_UPDATED, { entity: 'agreements', edgeFunctionAvailable: available });
        } catch (error) {
          handleError(error, {
            showToast: true,
            logError: true,
            context: { page: 'agreements', action: 'checkEdgeFunctionAvailability' }
          });
          
          // Emit error event
          messaging.emit(EVENTS.ERROR_OCCURRED, { entity: 'agreements', error });
        }
      });
    };
    
    checkAvailability();
  }, [withLoading, messaging, handleError]);
  
  // Run payment schedule maintenance job silently on page load
  React.useEffect(() => {
    const runMaintenanceJob = async () => {
      try {
        console.log("Running automatic payment schedule maintenance check");
        
        // Emit maintenance start event
        messaging.emit('maintenance:payment_schedule:start', { timestamp: Date.now() });
        
        await runPaymentScheduleMaintenanceJob();
        
        // Emit maintenance complete event
        messaging.emit('maintenance:payment_schedule:complete', { timestamp: Date.now() });
      } catch (error) {
        handleError(error, {
          showToast: false,
          logError: true,
          context: { page: 'agreements', action: 'runPaymentScheduleMaintenanceJob' }
        });
        
        // Emit maintenance error event
        messaging.emit('maintenance:payment_schedule:error', { error, timestamp: Date.now() });
      }
    };
    
    // Run after a 3-second delay to allow other initial page operations to complete
    const timer = setTimeout(() => {
      runMaintenanceJob();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [messaging, handleError]);
  
  const handleImportComplete = () => {
    // Reset filters and refresh data
    setSearchParams({});
    
    // Emit import complete event
    messaging.emit(EVENTS.DATA_CREATED, { entity: 'agreements', action: 'import' });
    messaging.showSuccess("استيراد مكتمل", "تم استيراد العقود بنجاح");
    
    refetch();
  };

  const handleFilterChange = (filters: Record<string, any>) => {
    setSearchParams(filters);
    
    // Update global filters
    setFilter({ ...globalFilters, ...filters });
    
    // Emit filter change event
    messaging.emit(EVENTS.FILTER_CHANGED, { entity: 'agreements', filters });
  };

  // Updated to ensure pagination resets when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update global state
    setFilter({ ...globalFilters, tab: value });
    
    if (value === 'all' || value === 'agreements' || value === 'history') {
      setSearchParams({});
    } else if (
      value === 'active' ||
      value === 'completed' ||
      value === 'cancelled'
    ) {
      setSearchParams({ statuses: [value] });
    }
    
    // Emit tab change event
    messaging.emit(EVENTS.USER_ACTION, { action: 'tab_change', tab: value });
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
    
    // Emit search event
    messaging.emit(EVENTS.SEARCH_PERFORMED, { entity: 'agreements', query });
  };

  // Handle view mode change
  const handleViewModeChange = (mode: 'card' | 'table' | 'compact') => {
    setViewMode(mode);
    
    // Update global state
    setFilter({ ...globalFilters, viewMode: mode });
    
    // Emit view change event
    messaging.emit(EVENTS.USER_ACTION, { action: 'view_mode_change', viewMode: mode });
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
    // Emit navigation event
    messaging.emit(EVENTS.USER_ACTION, { action: 'navigate_to_add', entity: 'agreements' });
    
    navigate('/agreements/add');
  };

  // Enhanced refresh function
  const handleRefresh = async () => {
    return withLoading(async () => {
      try {
        clearError();
        
        // Emit refresh event
        messaging.emit(EVENTS.DATA_REFRESH, { entity: 'agreements' });
        
        await refetch();
        
        // Cache the results
        setCachedAgreements(agreements);
        
        // Emit success event
        messaging.emit(EVENTS.DATA_UPDATED, { entity: 'agreements', count: agreements?.length || 0 });
        
        messaging.showSuccess("تحديث مكتمل", "تم تحديث بيانات العقود بنجاح");
      } catch (error) {
        handleError(error, {
          showToast: true,
          logError: true,
          context: { page: 'agreements', action: 'refresh' }
        });
        
        // Emit error event
        messaging.emit(EVENTS.ERROR_OCCURRED, { entity: 'agreements', error });
      }
    });
  };

  // Error handling
  const currentError = errorState?.error;

  if (currentError) {
    return (
      <PageContainer>
        <ErrorDisplay 
          error={currentError} 
          onRetry={handleRefresh}
          title="خطأ في تحميل العقود"
        />
      </PageContainer>
    );
  }

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
        <Card dir="rtl">
          <div className="p-4 border-b">
            <div className="flex flex-col sm:flex-row-reverse justify-between items-start sm:items-center gap-4">
              {/* View Mode Selector */}
              <div className="flex items-center gap-2">
                <AgreementViewSelectors 
                  viewMode={viewMode} 
                  setViewMode={handleViewModeChange} 
                />
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
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading || globalLoading}
                  className="flex-row-reverse"
                >
                  <RefreshCw className={`h-4 w-4 ml-2 ${(isLoading || globalLoading) ? 'animate-spin' : ''}`} />
                  تحديث
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
                agreements={agreements}
                isLoading={isLoading || globalLoading}
                onDeleteAgreement={deleteAgreement}
                loadingText="جاري تحميل العقود..."
              />
              <AgreementTabPanel
                value="active"
                viewMode={viewMode}
                agreements={agreements}
                isLoading={isLoading || globalLoading}
                onDeleteAgreement={deleteAgreement}
                loadingText=""
              />
              <AgreementTabPanel
                value="completed"
                viewMode={viewMode}
                agreements={agreements}
                isLoading={isLoading || globalLoading}
                onDeleteAgreement={deleteAgreement}
                loadingText=""
              />
              <AgreementTabPanel
                value="cancelled"
                viewMode={viewMode}
                agreements={agreements}
                isLoading={isLoading || globalLoading}
                onDeleteAgreement={deleteAgreement}
                loadingText=""
              />
              <TabsContent value="history" className="m-0">
                <div className="p-4" dir="rtl">
                  <h2 className="text-lg font-semibold mb-4 flex items-center text-right justify-end">
                    <Database className="h-5 w-5 ml-2" />
                    سجل الاستيراد
                  </h2>
                  <ImportHistoryList items={[]} isLoading={isLoading || globalLoading} />
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
});

Agreements.displayName = 'Agreements';

export default Agreements;
