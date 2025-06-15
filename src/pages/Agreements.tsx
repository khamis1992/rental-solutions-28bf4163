import React, { Suspense, useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/ui/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';

import { ImportHistoryList } from '@/components/agreements/ImportHistoryList';
import { CSVImportModal } from '@/components/agreements/CSVImportModal';
import { checkEdgeFunctionAvailability } from '@/utils/service-availability';
import { toast } from 'sonner';
import { runPaymentScheduleMaintenanceJob } from '@/lib/supabase';
import { BarChart4, Calendar, Database, Download, Filter, Plus, RefreshCw, Upload, FileText } from 'lucide-react';
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

const Agreements = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEdgeFunctionAvailable, setIsEdgeFunctionAvailable] = useState(true);
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => urlSearchParams.get('searchTerm') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('agreements');
  const [viewMode, setViewMode] = useState('card' as 'card' | 'table' | 'compact');
  
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
        toast.error(language === 'ar' ? 
          "ميزة استيراد CSV غير متاحة. يرجى المحاولة مرة أخرى لاحقاً أو التواصل مع الدعم الفني." :
          "CSV import feature is unavailable. Please try again later or contact support.", {
          duration: 6000,
        });
      }
    };
    
    checkAvailability();
  }, [language]);
  
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
    <PageContainer className="max-w-full">
      <PageHeader
        title="عقود الإيجار"
        subtitle="إدارة عقود الإيجار والاتفاقيات مع العملاء"
        icon={<FileText className="w-6 h-6 text-blue-500" />}
        align={language === 'ar' ? 'right' : 'left'}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      />
      
      <div className="flex flex-col gap-6 mt-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
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
            <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${language === 'ar' ? 'sm:flex-row-reverse' : ''}`}>
              {/* View Mode Selector */}
              <div className="flex items-center gap-2">
                <AgreementViewSelectors viewMode={viewMode} setViewMode={setViewMode} />
              </div>
            </div>
            
            {/* Search and Action Bar */}
            <div className={`flex flex-col md:flex-row justify-between mt-4 gap-4 ${language === 'ar' ? 'md:flex-row-reverse' : ''}`}>
              <CustomerListFilterClone
                searchTerm={searchQuery}
                onSearch={handleSearch}
                onFilterChange={handleFilterChange}
              />
              
              <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {showFilters ? 
                    (language === 'ar' ? 'إخفاء المرشحات' : 'Hide Filters') : 
                    (language === 'ar' ? 'إظهار المرشحات' : 'Show Filters')
                  }
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                      {language === 'ar' ? 'تصدير' : 'Export'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={language === 'ar' ? 'start' : 'end'}>
                    <DropdownMenuItem>
                      <BarChart4 className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                      {language === 'ar' ? 'تصدير إلى Excel' : 'Export to Excel'}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Database className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                      {language === 'ar' ? 'تصدير إلى CSV' : 'Export to CSV'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsImportModalOpen(true)}
                  disabled={!isEdgeFunctionAvailable}
                >
                  <Upload className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {language === 'ar' ? 'استيراد' : 'Import'}
                </Button>
                
                <Button size="sm" onClick={handleAddAgreement}>
                  <Plus className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {language === 'ar' ? 'إضافة عقد' : 'Add Agreement'}
                </Button>
              </div>
            </div>
            
            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className={`mt-4 flex flex-wrap gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <ActiveFilters 
                  filters={searchParams || {}} 
                  onRemoveFilter={(key) => {
                    const newParams = { ...searchParams };
                    delete newParams[key];
                    setSearchParams(newParams);
                  }}
                  onClearAll={() => setSearchParams({})}
                />
              </div>
            )}
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <div className="border-b p-4">
              <AgreementFilterPanel 
                onFilterChange={handleFilterChange}
                initialFilters={searchParams || {}}
              />
            </div>
          )}
          
          {/* Tabs Content */}
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="px-4 pt-4">
                <TabsList className={`grid grid-cols-4 w-full ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <TabsTrigger value="agreements" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <FileText className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {language === 'ar' ? 'العقود' : 'Agreements'}
                  </TabsTrigger>
                  <TabsTrigger value="active" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <Calendar className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {language === 'ar' ? 'نشطة' : 'Active'}
                  </TabsTrigger>
                  <TabsTrigger value="closed" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <Database className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {language === 'ar' ? 'مغلقة' : 'Closed'}
                  </TabsTrigger>
                  <TabsTrigger value="history" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <RefreshCw className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {language === 'ar' ? 'السجل' : 'History'}
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="p-4">
                <TabsContent value="agreements" className="mt-0">
                  <AgreementTabPanel
                    agreements={agreements}
                    isLoading={isLoading}
                    viewMode={viewMode}
                    onDeleteAgreement={deleteAgreement}
                  />
                </TabsContent>
                
                <TabsContent value="active" className="mt-0">
                  <AgreementTabPanel
                    agreements={agreements?.filter(a => a.status === 'active') || []}
                    isLoading={isLoading}
                    viewMode={viewMode}
                    onDeleteAgreement={deleteAgreement}
                  />
                </TabsContent>
                
                <TabsContent value="closed" className="mt-0">
                  <AgreementTabPanel
                    agreements={agreements?.filter(a => a.status === 'closed') || []}
                    isLoading={isLoading}
                    viewMode={viewMode}
                    onDeleteAgreement={deleteAgreement}
                  />
                </TabsContent>
                
                <TabsContent value="history" className="mt-0">
                  <div className="space-y-4">
                    <h3 className={`text-lg font-semibold ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {language === 'ar' ? 'سجل الاستيراد' : 'Import History'}
                    </h3>
                    <ImportHistoryList />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Import Modal */}
      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </PageContainer>
  );
};

export default Agreements;
