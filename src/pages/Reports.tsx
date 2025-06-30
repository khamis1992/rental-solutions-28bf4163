import React, { useEffect, useState } from 'react';
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
import { FileText, Calendar, AlertCircle } from 'lucide-react';

const Reports = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTab, setSelectedTab] = useState('fleet');
  const [selectedMainTab, setSelectedMainTab] = useState('standard-reports');
  
  // Set the initial tab based on the URL path
  useEffect(() => {
    const path = location.pathname;
    if (path === '/reports/financial') {
      setSelectedTab('financial');
      setSelectedMainTab('standard-reports');
    } else if (path === '/reports/operational') {
      setSelectedTab('fleet');
      setSelectedMainTab('standard-reports');
    } else {
      setSelectedTab('fleet');
      setSelectedMainTab('standard-reports');
    }
  }, [location.pathname]);

  const { reportData } = useFleetReport();
  const { transactions } = useFinancials();
  const { customers } = useCustomers();
  const { getAllRecords } = useMaintenance();
  const { trafficFines } = useTrafficFines();
  const vehiclesHook = useVehicles();
  const { data: vehicles = [] } = vehiclesHook.useList();
  const [maintenanceData, setMaintenanceData] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const data = await getAllRecords();
        setMaintenanceData(data || []);
      } catch (error) {
        console.error("خطأ في جلب بيانات الصيانة:", error);
      }
    };
    
    fetchMaintenance();
  }, []);
  
  useEffect(() => {
    if (trafficFines) {
      console.log("تم تحميل بيانات المخالفات المرورية في التقارير:", trafficFines.length);
    }
  }, [trafficFines]);
  
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerateScheduledReport = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      setIsGenerating(false);
      toast.success('تم إنشاء التقرير المجدول بنجاح');
    }, 2000);
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
          <Button 
            variant="outline"
            onClick={() => navigate('/reports/scheduled')}
            className="flex items-center gap-2 h-9 text-sm"
          >
            <Calendar className="h-3 w-3" />
            <span>التقارير المجدولة</span>
          </Button>
        </PageHeader>
        
        <Alert className="mb-5">
          <AlertCircle className="h-3 w-3" />
          <AlertTitle className="text-sm">نصيحة احترافية</AlertTitle>
          <AlertDescription className="text-sm">
            يمكنك جدولة التقارير ليتم إنشاؤها وإرسالها تلقائياً إلى بريدك الإلكتروني بشكل دوري.
          </AlertDescription>
        </Alert>
        
        <Tabs value={selectedMainTab} onValueChange={setSelectedMainTab} className="w-full" dir="rtl">
          <TabsList className="mb-3">
            <TabsTrigger value="standard-reports" className="text-sm">التقارير المعيارية</TabsTrigger>
            <TabsTrigger value="cross-domain" className="text-sm">التحليلات متعددة المجالات</TabsTrigger>
            <TabsTrigger value="trend-analysis" className="text-sm">تحليل الاتجاهات</TabsTrigger>
          </TabsList>
          
          <TabsContent value="standard-reports">
            <Card className="mb-16">
              <CardContent className="pt-5">
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full" dir="rtl">
                  <TabsList className="grid grid-cols-6 mb-6 gap-2">
                    <TabsTrigger value="fleet" className="text-sm">تقرير الأسطول</TabsTrigger>
                    <TabsTrigger value="financial" className="text-sm">التقرير المالي</TabsTrigger>
                    <TabsTrigger value="customers" className="text-sm">تقرير العملاء</TabsTrigger>
                    <TabsTrigger value="maintenance" className="text-sm">تقرير الصيانة</TabsTrigger>
                    <TabsTrigger value="traffic" className="text-sm">المخالفات المرورية</TabsTrigger>
                    <TabsTrigger value="legal" className="text-sm">التقرير القانوني</TabsTrigger>
                  </TabsList>
                  
                  <div className="space-y-5">
                    <TabsContent value="fleet" className="mt-0">
                      <div className="mb-5 px-4">
                        <ReportDownloadOptions 
                          reportType="fleet" 
                          getReportData={() => reportData?.vehicles || []} 
                        />
                      </div>
                      <FleetReport />
                    </TabsContent>
                    
                    <TabsContent value="financial" className="mt-0">
                      <div className="mb-5 px-4">
                        <ReportDownloadOptions 
                          reportType="financial" 
                          getReportData={() => transactions || []} 
                        />
                      </div>
                      <FinancialReport />
                    </TabsContent>
                    
                    <TabsContent value="customers" className="mt-0">
                      <div className="mb-5 px-4">
                        <ReportDownloadOptions 
                          reportType="customers" 
                          getReportData={() => customers || []} 
                        />
                      </div>
                      <CustomerReport />
                    </TabsContent>
                    
                    <TabsContent value="maintenance" className="mt-0">
                      <div className="mb-5 px-4">
                        <ReportDownloadOptions 
                          reportType="maintenance" 
                          getReportData={() => maintenanceData || []} 
                        />
                      </div>
                      <MaintenanceReport />
                    </TabsContent>
                    
                    <TabsContent value="traffic" className="mt-0">
                      <div className="mb-5 px-4">
                        <ReportDownloadOptions 
                          reportType="traffic" 
                          getReportData={() => trafficFines || []} 
                        />
                      </div>
                      <TrafficFineReport />
                    </TabsContent>
                    
                    <TabsContent value="legal" className="mt-0">
                      <div className="mb-5 px-4">
                        <ReportDownloadOptions 
                          reportType="legal" 
                          getReportData={() => []} 
                        />
                      </div>
                      <LegalReport />
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="cross-domain">
            <CrossReportAnalytics />
          </TabsContent>
          
          <TabsContent value="trend-analysis">
            <TrendAnalysis 
              title="تحليل الاتجاهات المالية"
              description="تحليل الاتجاهات المالية عبر الزمن مع طرق مقارنة مختلفة"
              data={transactions || []}
              timeField="date"
              metrics={[
                { key: 'amount', name: 'مبلغ المعاملة', color: '#3b82f6', formatter: formatCurrency },
                { key: 'balance', name: 'رصيد الحساب', color: '#22c55e', formatter: formatCurrency }
              ]}
              comparisonOptions={[
                { 
                  key: 'year-over-year', 
                  name: 'سنة بعد سنة', 
                  calculate: (data, timeField, metric) => 
                    calculateYearOverYear(data, timeField, metric)
                },
                { 
                  key: 'month-over-month', 
                  name: 'شهر بعد شهر', 
                  calculate: (data, timeField, metric) => 
                    calculateMonthOverMonth(data, timeField, metric)
                },
                { 
                  key: 'moving-average', 
                  name: 'المتوسط المتحرك (3 فترات)', 
                  calculate: (data, timeField, metric) => 
                    calculateMovingAverage(data, timeField, metric, 3)
                },
                { 
                  key: 'cumulative', 
                  name: 'المجموع التراكمي', 
                  calculate: (data, timeField, metric) => 
                    calculateCumulativeSum(data, timeField, metric)
                }
              ]}
            />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </div>
  );
};

export default Reports;
