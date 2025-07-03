import React, { useEffect, useState, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import FleetReport from '@/components/reports/FleetReport';
import FinancialReport from '@/components/reports/FinancialReport';
import CustomerReport from '@/components/reports/CustomerReport';
import MaintenanceReport from '@/components/reports/MaintenanceReport';
import LegalReport from '@/components/reports/LegalReport';
import TrafficFineReport from '@/components/reports/TrafficFineReport';
import ReportDownloadOptions from '@/components/reports/ReportDownloadOptions';
import CrossReportAnalytics from '@/components/reports/CrossReportAnalytics';
import TrendAnalysis from '@/components/reports/TrendAnalysis';
import PageHeader from '@/components/ui/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { calculateYearOverYear, calculateMonthOverMonth, calculateMovingAverage, calculateCumulativeSum } from '@/utils/trend-analysis-utils';
import { useFleetReport } from '@/hooks/use-fleet-report';
import { useFinancials } from '@/hooks/use-financials';
import { useCustomers } from '@/hooks/use-customers';
import { useMaintenance } from '@/hooks/use-maintenance';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { useVehicles } from '@/hooks/use-vehicles';
import { FileText, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

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

const Reports = memo(() => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Global State Management
  const { filter: globalFilters, setFilter } = useFilterState('reports');
  const { isLoading: globalLoading, withLoading } = useLoadingState('reports');
  const { cache: cachedReports, setCache: setCachedReports } = useCacheState('reports');
  const { selection, setSelection } = useSelectionState('reports');
  
  // Communication & Event Bus
  const messaging = useComponentMessaging();
  useComponentLifecycle('ReportsPage');
  
  // Local state - enhanced with global state integration
  const [selectedTab, setSelectedTab] = useState(globalFilters?.tab || 'fleet');
  const [selectedMainTab, setSelectedMainTab] = useState(globalFilters?.mainTab || 'standard-reports');
  
  // Error handler
  const { error, handleError, clearError } = useErrorHandler();
  
  // Set the initial tab based on the URL path
  useEffect(() => {
    const path = location.pathname;
    let tab = 'fleet';
    let mainTab = 'standard-reports';
    
    if (path === '/reports/financial') {
      tab = 'financial';
    } else if (path === '/reports/operational') {
      tab = 'fleet';
    }
    
    setSelectedTab(tab);
    setSelectedMainTab(mainTab);
    
    // Update global state
    setFilter({ ...globalFilters, tab, mainTab });
    
    // Emit navigation event
    messaging.emit(EVENTS.USER_ACTION, { 
      action: 'navigate_to_report', 
      path, 
      tab, 
      mainTab 
    });
  }, [location.pathname, globalFilters, setFilter, messaging]);

  const { reportData } = useFleetReport();
  const { transactions } = useFinancials();
  const { customers } = useCustomers();
  const { getAllRecords } = useMaintenance();
  const { trafficFines } = useTrafficFines();
  const vehiclesHook = useVehicles();
  const { data: vehicles = [] } = vehiclesHook.useList();
  const [maintenanceData, setMaintenanceData] = useState<any[]>([]);
  
  // Enhanced data loading with Global State Management
  useEffect(() => {
    const fetchMaintenance = async () => {
      return withLoading(async () => {
        try {
          clearError();
          
          // Emit loading event
          messaging.emit(EVENTS.DATA_LOADING, { entity: 'reports', type: 'maintenance' });
          
          const data = await getAllRecords();
          setMaintenanceData(data || []);
          
          // Cache the data
          setCachedReports({ 
            maintenance: data, 
            timestamp: Date.now(), 
            type: 'maintenance' 
          });
          
          // Emit success event
          messaging.emit(EVENTS.DATA_UPDATED, { 
            entity: 'reports', 
            type: 'maintenance',
            count: data?.length || 0 
          });
        } catch (error) {
          handleError(error, {
            showToast: true,
            logError: true,
            context: { page: 'reports', section: 'maintenance' }
          });
          
          // Emit error event
          messaging.emit(EVENTS.ERROR_OCCURRED, { entity: 'reports', error });
        }
      });
    };
    
    fetchMaintenance();
  }, [withLoading, messaging, getAllRecords, clearError, handleError, setCachedReports]);
  
  useEffect(() => {
    if (trafficFines) {
      console.log("تم تحميل بيانات المخالفات المرورية في التقارير:", trafficFines.length);
      
      // Emit traffic fines data loaded event
      messaging.emit(EVENTS.DATA_UPDATED, { 
        entity: 'reports', 
        type: 'traffic_fines',
        count: trafficFines.length 
      });
    }
  }, [trafficFines, messaging]);
  
  const [dateRange, setDateRange] = useState({
    startDate: globalFilters?.dateRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: globalFilters?.dateRange?.endDate || new Date()
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Enhanced report generation with event handling
  const handleGenerateScheduledReport = async () => {
    return withLoading(async () => {
      setIsGenerating(true);
      
      try {
        // Emit report generation start event
        messaging.emit('report:generation:start', { 
          type: 'scheduled', 
          timestamp: Date.now() 
        });
        
        // Simulate report generation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Emit success event
        messaging.emit('report:generation:complete', { 
          type: 'scheduled', 
          timestamp: Date.now() 
        });
        
        messaging.showSuccess('تقرير مكتمل', 'تم إنشاء التقرير المجدول بنجاح');
      } catch (error) {
        handleError(error, {
          showToast: true,
          logError: true,
          context: { page: 'reports', action: 'generateScheduledReport' }
        });
        
        // Emit error event
        messaging.emit('report:generation:error', { 
          type: 'scheduled', 
          error, 
          timestamp: Date.now() 
        });
      } finally {
        setIsGenerating(false);
      }
    });
  };

  // Enhanced tab change handlers
  const handleMainTabChange = (value: string) => {
    setSelectedMainTab(value);
    
    // Update global state
    setFilter({ ...globalFilters, mainTab: value });
    
    // Emit tab change event
    messaging.emit(EVENTS.USER_ACTION, { 
      action: 'main_tab_change', 
      tab: value, 
      entity: 'reports' 
    });
  };

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    
    // Update global state
    setFilter({ ...globalFilters, tab: value });
    
    // Emit tab change event
    messaging.emit(EVENTS.USER_ACTION, { 
      action: 'report_tab_change', 
      tab: value, 
      entity: 'reports' 
    });
  };

  // Enhanced date range handler
  const handleDateRangeChange = (newDateRange: { startDate: Date; endDate: Date }) => {
    setDateRange(newDateRange);
    
    // Update global state
    setFilter({ ...globalFilters, dateRange: newDateRange });
    
    // Emit date range change event
    messaging.emit(EVENTS.FILTER_CHANGED, { 
      entity: 'reports', 
      dateRange: newDateRange 
    });
  };

  // Enhanced refresh function
  const handleRefresh = async () => {
    return withLoading(async () => {
      try {
        clearError();
        
        // Emit refresh event
        messaging.emit(EVENTS.DATA_REFRESH, { entity: 'reports' });
        
        // Refresh maintenance data
        const data = await getAllRecords();
        setMaintenanceData(data || []);
        
        // Update cache
        setCachedReports({ 
          maintenance: data, 
          timestamp: Date.now(), 
          type: 'maintenance' 
        });
        
        // Emit success event
        messaging.emit(EVENTS.DATA_UPDATED, { 
          entity: 'reports', 
          action: 'refresh',
          count: data?.length || 0 
        });
        
        messaging.showSuccess('تحديث مكتمل', 'تم تحديث بيانات التقارير بنجاح');
      } catch (error) {
        handleError(error, {
          showToast: true,
          logError: true,
          context: { page: 'reports', action: 'refresh' }
        });
        
        // Emit error event
        messaging.emit(EVENTS.ERROR_OCCURRED, { entity: 'reports', error });
      }
    });
  };

  const getReportData = () => {
    switch (selectedTab) {
      case 'fleet':
        return reportData?.vehicles || [];
      case 'financial':
        return transactions || [];
      case 'customers':
        return customers || [];
      case 'maintenance':
        return maintenanceData || [];
      case 'traffic':
        return trafficFines || [];
      case 'legal':
        return []; // Legal data would come from a legal hook
      default:
        return [];
    }
  };

  // Error handling
  const currentError = error?.error;

  if (currentError) {
    return (
      <PageContainer>
        <ErrorDisplay 
          error={currentError} 
          onRetry={handleRefresh}
          title="خطأ في تحميل التقارير"
        />
      </PageContainer>
    );
  }

  return (
    <div dir="rtl">
      <PageContainer className="pb-20">
        <PageHeader
          title="التقارير والتحليلات"
          subtitle="تقارير وتحليلات شاملة لأعمال التأجير الخاصة بك"
          icon={<FileText className="w-5 h-5 text-blue-500" />}
          align="right"
          dir="rtl"
        >
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isGenerating || globalLoading}
              className="flex items-center gap-2 h-9 text-sm"
            >
              <RefreshCw className={`h-3 w-3 ${(isGenerating || globalLoading) ? 'animate-spin' : ''}`} />
              <span>تحديث</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/reports/scheduled')}
              className="flex items-center gap-2 h-9 text-sm"
            >
              <Calendar className="h-3 w-3" />
              <span>التقارير المجدولة</span>
            </Button>
          </div>
        </PageHeader>
        
        <Alert className="mb-5">
          <AlertCircle className="h-3 w-3" />
          <AlertTitle className="text-sm">نصيحة احترافية</AlertTitle>
          <AlertDescription className="text-sm">
            يمكنك جدولة التقارير ليتم إنشاؤها وإرسالها تلقائياً إلى بريدك الإلكتروني بشكل دوري.
          </AlertDescription>
        </Alert>
        
        <Tabs value={selectedMainTab} onValueChange={handleMainTabChange} className="w-full" dir="rtl">
          <TabsList className="mb-3">
            <TabsTrigger value="standard-reports" className="text-sm">التقارير المعيارية</TabsTrigger>
            <TabsTrigger value="cross-domain" className="text-sm">التحليلات متعددة المجالات</TabsTrigger>
            <TabsTrigger value="trend-analysis" className="text-sm">تحليل الاتجاهات</TabsTrigger>
          </TabsList>
          
          <TabsContent value="standard-reports">
            <ErrorBoundary>
              <Card className="mb-16">
                <CardContent className="pt-5">
                  <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full" dir="rtl">
                    <TabsList className="grid grid-cols-6 mb-6 gap-2">
                      <TabsTrigger value="fleet" className="text-sm">تقرير الأسطول</TabsTrigger>
                      <TabsTrigger value="financial" className="text-sm">التقرير المالي</TabsTrigger>
                      <TabsTrigger value="customers" className="text-sm">تقرير العملاء</TabsTrigger>
                      <TabsTrigger value="maintenance" className="text-sm">تقرير الصيانة</TabsTrigger>
                      <TabsTrigger value="traffic" className="text-sm">المخالفات المرورية</TabsTrigger>
                      <TabsTrigger value="legal" className="text-sm">التقرير القانوني</TabsTrigger>
                    </TabsList>
                    
                    <div className="space-y-5">
                      <TabsContent value="fleet">
                        <FleetReport 
                          dateRange={dateRange} 
                          onDateRangeChange={handleDateRangeChange}
                          isLoading={globalLoading}
                        />
                      </TabsContent>
                      
                      <TabsContent value="financial">
                        <FinancialReport 
                          dateRange={dateRange} 
                          onDateRangeChange={handleDateRangeChange}
                          isLoading={globalLoading}
                        />
                      </TabsContent>
                      
                      <TabsContent value="customers">
                        <CustomerReport 
                          dateRange={dateRange} 
                          onDateRangeChange={handleDateRangeChange}
                          isLoading={globalLoading}
                        />
                      </TabsContent>
                      
                      <TabsContent value="maintenance">
                        <MaintenanceReport 
                          dateRange={dateRange} 
                          onDateRangeChange={handleDateRangeChange}
                          isLoading={globalLoading}
                          data={maintenanceData}
                        />
                      </TabsContent>
                      
                      <TabsContent value="traffic">
                        <TrafficFineReport 
                          dateRange={dateRange} 
                          onDateRangeChange={handleDateRangeChange}
                          isLoading={globalLoading}
                        />
                      </TabsContent>
                      
                      <TabsContent value="legal">
                        <LegalReport 
                          dateRange={dateRange} 
                          onDateRangeChange={handleDateRangeChange}
                          isLoading={globalLoading}
                        />
                      </TabsContent>
                      
                      <ReportDownloadOptions 
                        reportType={selectedTab}
                        reportData={getReportData()}
                        dateRange={dateRange}
                        isGenerating={isGenerating}
                        onGenerate={handleGenerateScheduledReport}
                      />
                    </div>
                  </Tabs>
                </CardContent>
              </Card>
            </ErrorBoundary>
          </TabsContent>
          
          <TabsContent value="cross-domain">
            <ErrorBoundary>
              <CrossReportAnalytics 
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                isLoading={globalLoading}
              />
            </ErrorBoundary>
          </TabsContent>
          
          <TabsContent value="trend-analysis">
            <ErrorBoundary>
              <TrendAnalysis 
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                isLoading={globalLoading}
              />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </PageContainer>
    </div>
  );
});

Reports.displayName = 'Reports';

export default Reports;
