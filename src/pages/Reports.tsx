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
  
  // Set the initial tab based on the URL path
  useEffect(() => {
    const path = location.pathname;
    if (path === '/reports/financial') {
      setSelectedTab('financial');
    } else if (path === '/reports/operational') {
      setSelectedTab('fleet'); // Operational reports can map to fleet or another tab
    } else {
      setSelectedTab('fleet');
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
          icon={<FileText className="w-6 h-6 text-blue-500" />}
          align="right"
          dir="rtl"
        >
          <Button 
            variant="outline"
            onClick={() => navigate('/reports/scheduled')}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            <span>التقارير المجدولة</span>
          </Button>
        </PageHeader>
        
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>نصيحة احترافية</AlertTitle>
          <AlertDescription>
            يمكنك جدولة التقارير ليتم إنشاؤها وإرسالها تلقائياً إلى بريدك الإلكتروني بشكل دوري.
          </AlertDescription>
        </Alert>
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full" dir="rtl">
          <TabsList className="mb-4">
            <TabsTrigger value="standard-reports">التقارير المعيارية</TabsTrigger>
            <TabsTrigger value="cross-domain">التحليلات متعددة المجالات</TabsTrigger>
            <TabsTrigger value="trend-analysis">تحليل الاتجاهات</TabsTrigger>
          </TabsList>
          
          <TabsContent value="standard-reports">
            <Card className="mb-16">
              <CardContent className="pt-6">
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full" dir="rtl">
                  <TabsList className="grid grid-cols-6 mb-8 gap-2">
                    <TabsTrigger value="fleet">تقرير الأسطول</TabsTrigger>
                    <TabsTrigger value="financial">التقرير المالي</TabsTrigger>
                    <TabsTrigger value="customers">تقرير العملاء</TabsTrigger>
                    <TabsTrigger value="maintenance">تقرير الصيانة</TabsTrigger>
                    <TabsTrigger value="traffic">المخالفات المرورية</TabsTrigger>
                    <TabsTrigger value="legal">التقرير القانوني</TabsTrigger>
                  </TabsList>
                  
                  <div className="mb-6 px-4">
                    <ReportDownloadOptions 
                      reportType={selectedTab} 
                      getReportData={getReportData} 
                    />
                  </div>
                  
                  <div className="space-y-6">
                    <TabsContent value="fleet" className="mt-0">
                      <FleetReport />
                    </TabsContent>
                    
                    <TabsContent value="financial" className="mt-0">
                      <FinancialReport />
                    </TabsContent>
                    
                    <TabsContent value="customers" className="mt-0">
                      <CustomerReport />
                    </TabsContent>
                    
                    <TabsContent value="maintenance" className="mt-0">
                      <MaintenanceReport />
                    </TabsContent>
                    
                    <TabsContent value="traffic" className="mt-0">
                      <TrafficFineReport />
                    </TabsContent>
                    
                    <TabsContent value="legal" className="mt-0">
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
              data={transactions}
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
