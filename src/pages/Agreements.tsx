import React, { Suspense, useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/ui/PageHeader';

import { ImportHistoryList } from '@/components/agreements/ImportHistoryList';
import { CSVImportModal } from '@/components/agreements/CSVImportModal';
import { checkEdgeFunctionAvailability } from '@/utils/service-availability';
import { toast } from 'sonner';
import { runPaymentScheduleMaintenanceJob } from '@/lib/supabase';
import { BarChart4, Calendar, Database, Download, Filter, Plus, RefreshCw, Upload, FileText, MoreVertical } from 'lucide-react';
import { AgreementStats } from '@/components/agreements/AgreementStats';
import { Card, CardContent } from '@/components/ui/card';
import { CustomerInfo } from '@/types/customer';
import { CustomerListFilterClone } from '@/components/agreements/CustomerListFilterClone';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AgreementTabPanel } from '@/components/agreements/AgreementTabPanel';
import { Badge } from '@/components/ui/badge';
import { AgreementViewSelectors } from '@/components/agreements/AgreementViewSelectors';
import { AgreementAnalytics } from '@/components/agreements/AgreementAnalytics';
import { AgreementFilterPanel } from '@/components/agreements/AgreementFilterPanel';
import { ActiveFilters } from '@/components/agreements/page/ActiveFilters';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAgreementService } from '@/hooks/services/useAgreementService';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { responsivePadding, responsiveSpacing } from '@/utils/responsive-utils';

const Agreements = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEdgeFunctionAvailable, setIsEdgeFunctionAvailable] = useState(true);
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => urlSearchParams.get('searchTerm') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('agreements');
  const [viewMode, setViewMode] = useState<'card' | 'table' | 'compact'>(isMobile ? 'card' : 'table');
  
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

  const handleFilterChange = (filters: Record<string, any>) => {
    setSearchParams(filters); // Simplified to match CustomerListFilter behavior
  };

  // Updated to ensure pagination resets when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'all' || value === 'agreements' || value === 'history') {
      setSearchParams({});
    } else if (
      value === 'active' ||
      value === 'closed' ||
      value === 'cancelled'
    ) {
      setSearchParams({ statuses: [value] });
    }
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

  return (
    <PageContainer 
      className={cn(
        "max-w-7xl mx-auto",
        responsivePadding.page
      )}
      dir="rtl"
    >
      <div className="mb-4 sm:mb-6">
        <PageHeader
          title="عقود الإيجار"
          subtitle="إدارة عقود وتعاهدات الإيجار مع العملاء"
          icon={<FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />}
          align="right"
          dir="rtl"
        />
      </div>
      
      <div className={cn("flex flex-col", responsiveSpacing.stack)} dir="rtl">
        {/* Analytics Section - Mobile optimized */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Stats Overview */}
          <div className="lg:col-span-2">
            <AgreementStats className="h-full" />
          </div>
          
          {/* Analytics Preview - Hidden on mobile for cleaner UI */}
          {!isMobile && (
            <div className="lg:col-span-1">
              <AgreementAnalytics />
            </div>
          )}
        </div>
        
        {/* Main Content Area with Tabs */}
        <Card dir="rtl" className="overflow-hidden">
          <div className="p-3 sm:p-4 border-b">
            <div className={cn(
              "flex flex-col gap-4",
              "sm:flex-row-reverse sm:justify-between sm:items-center"
            )}>
              {/* View Mode Selector */}
              <div className="flex items-center gap-2 justify-end">
                <AgreementViewSelectors viewMode={viewMode} setViewMode={setViewMode} />
              </div>
              
              {/* Mobile Actions Menu */}
              {isMobile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                      <span className="mr-2">خيارات</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleAddAgreement}>
                      <Plus className="h-4 w-4 mr-2" />
                      عقد جديد
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsImportModalOpen(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      استيراد من CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      تصدير
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {/* Search and Action Bar - Mobile responsive */}
            <div className={cn(
              "flex flex-col mt-4 gap-3",
              "md:flex-row-reverse md:justify-between"
            )}>
              <div className="flex-1 max-w-full md:max-w-md">
                <CustomerListFilterClone
                  searchTerm={searchQuery}
                  onSearch={handleSearch}
                  onFilterChange={handleFilterChange}
                />
              </div>
              
              <div className="flex items-center gap-2 flex-row-reverse">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex-row-reverse w-full sm:w-auto"
                >
                  <Filter className="h-4 w-4 ml-2" />
                  {showFilters ? "إخفاء المرشحات" : "مرشحات متقدمة"}
                </Button>
                
                {/* Desktop Actions */}
                {!isMobile && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-row-reverse"
                    >
                      <Download className="h-4 w-4 ml-2" />
                      تصدير
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-row-reverse">
                          <Upload className="h-4 w-4 ml-2" />
                          استيراد
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="text-right">
                        <DropdownMenuItem onClick={() => setIsImportModalOpen(true)} className="text-right">
                          استيراد من ملف CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-right">تحميل النموذج</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button 
                      size="sm"
                      onClick={handleAddAgreement}
                      className="flex-row-reverse"
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      عقد جديد
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {/* Active Filters - Mobile optimized */}
            {activeFilters.length > 0 && (
              <div className="mt-3">
                <ActiveFilters 
                  activeFilters={activeFilters as [string, string][]}
                  setSearchParams={setSearchParams}
                />
              </div>
            )}
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <div className="border-b p-3 sm:p-4">
              <AgreementFilterPanel onFilterChange={handleFilterChange} currentFilters={searchParams} />
            </div>
          )}
          
          {/* Content Area - Mobile optimized tabs */}
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full" dir="rtl">
              <div className="border-b overflow-x-auto">
                <TabsList className="justify-start inline-flex w-full sm:w-auto">
                  <TabsTrigger value="agreements" className="text-xs sm:text-sm whitespace-nowrap">جميع العقود</TabsTrigger>
                  <TabsTrigger value="active" className="text-xs sm:text-sm whitespace-nowrap">نشطة</TabsTrigger>
                  <TabsTrigger value="closed" className="text-xs sm:text-sm whitespace-nowrap">مغلقة</TabsTrigger>
                  <TabsTrigger value="cancelled" className="text-xs sm:text-sm whitespace-nowrap">ملغاة</TabsTrigger>
                  <TabsTrigger value="history" className="text-xs sm:text-sm whitespace-nowrap">سجل الاستيراد</TabsTrigger>
                </TabsList>
              </div>
              
              <div className="p-3 sm:p-4">
                <AgreementTabPanel
                  value="agreements"
                  viewMode={viewMode}
                  agreements={agreements}
                  isLoading={isLoading}
                  onDeleteAgreement={deleteAgreement}
                  loadingText="جاري تحميل العقود..."
                />
                <AgreementTabPanel
                  value="active"
                  viewMode={viewMode}
                  agreements={agreements}
                  isLoading={isLoading}
                  onDeleteAgreement={deleteAgreement}
                  loadingText=""
                />
                <AgreementTabPanel
                  value="closed"
                  viewMode={viewMode}
                  agreements={agreements}
                  isLoading={isLoading}
                  onDeleteAgreement={deleteAgreement}
                  loadingText=""
                />
                <AgreementTabPanel
                  value="cancelled"
                  viewMode={viewMode}
                  agreements={agreements}
                  isLoading={isLoading}
                  onDeleteAgreement={deleteAgreement}
                  loadingText=""
                />
                <TabsContent value="history" className="m-0">
                  <div dir="rtl">
                    <h2 className="text-base sm:text-lg font-semibold mb-4 flex items-center text-right justify-end">
                      <Database className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                      سجل الاستيراد
                    </h2>
                    <ImportHistoryList items={[]} isLoading={false} />
                  </div>
                </TabsContent>
              </div>
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
