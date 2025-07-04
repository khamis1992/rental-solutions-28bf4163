import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { installmentReportingService, CollectionReport } from '@/services/InstallmentReportingService';
import { formatCurrency } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { errorLogger } from '@/lib/errors/error-logger';

const CollectionReportsPage = () => {
  const { language } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly'>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedQuarter, setSelectedQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [report, setReport] = useState<CollectionReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historicalData, setHistoricalData] = useState<CollectionReport[]>([]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: language === 'ar' ? 'يناير' : 'January' },
    { value: 2, label: language === 'ar' ? 'فبراير' : 'February' },
    { value: 3, label: language === 'ar' ? 'مارس' : 'March' },
    { value: 4, label: language === 'ar' ? 'أبريل' : 'April' },
    { value: 5, label: language === 'ar' ? 'مايو' : 'May' },
    { value: 6, label: language === 'ar' ? 'يونيو' : 'June' },
    { value: 7, label: language === 'ar' ? 'يوليو' : 'July' },
    { value: 8, label: language === 'ar' ? 'أغسطس' : 'August' },
    { value: 9, label: language === 'ar' ? 'سبتمبر' : 'September' },
    { value: 10, label: language === 'ar' ? 'أكتوبر' : 'October' },
    { value: 11, label: language === 'ar' ? 'نوفمبر' : 'November' },
    { value: 12, label: language === 'ar' ? 'ديسمبر' : 'December' }
  ];

  const quarters = [
    { value: 1, label: language === 'ar' ? 'الربع الأول' : 'Q1' },
    { value: 2, label: language === 'ar' ? 'الربع الثاني' : 'Q2' },
    { value: 3, label: language === 'ar' ? 'الربع الثالث' : 'Q3' },
    { value: 4, label: language === 'ar' ? 'الربع الرابع' : 'Q4' }
  ];

  useEffect(() => {
    generateReport();
    loadHistoricalData();
  }, [selectedPeriod, selectedYear, selectedMonth, selectedQuarter]);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      let reportData: CollectionReport;
      
      if (selectedPeriod === 'monthly') {
        reportData = await installmentReportingService.generateMonthlyReport(selectedYear, selectedMonth);
      } else {
        reportData = await installmentReportingService.generateQuarterlyReport(selectedYear, selectedQuarter);
      }
      
      setReport(reportData);
    } catch (error) {
      errorLogger.logError(error as Error, {
        context: 'CollectionReportsPage.generateReport',
        selectedPeriod,
        selectedYear,
        selectedMonth,
        selectedQuarter
      });
      toast.error(language === 'ar' ? 'خطأ في إنشاء التقرير' : 'Error generating report');
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistoricalData = async () => {
    try {
      const historical: CollectionReport[] = [];
      
      if (selectedPeriod === 'monthly') {
        // Load last 12 months
        for (let i = 11; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          
          const monthlyReport = await installmentReportingService.generateMonthlyReport(year, month);
          historical.push(monthlyReport);
        }
      } else {
        // Load last 8 quarters
        for (let i = 7; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - (i * 3));
          const year = date.getFullYear();
          const quarter = Math.ceil((date.getMonth() + 1) / 3);
          
          const quarterlyReport = await installmentReportingService.generateQuarterlyReport(year, quarter);
          historical.push(quarterlyReport);
        }
      }
      
      setHistoricalData(historical);
    } catch (error) {
      errorLogger.logError(error as Error, {
        context: 'CollectionReportsPage.loadHistoricalData',
        selectedPeriod,
        selectedYear
      });
    }
  };

  const exportReport = async () => {
    if (!report) return;
    
    try {
      const csvContent = await installmentReportingService.exportCollectionReport(report);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `collection_report_${report.period}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(language === 'ar' ? 'تم تصدير التقرير بنجاح' : 'Report exported successfully');
    } catch (error) {
      errorLogger.logError(error as Error, {
        context: 'CollectionReportsPage.exportReport',
        reportPeriod: report?.period
      });
      toast.error(language === 'ar' ? 'خطأ في تصدير التقرير' : 'Error exporting report');
    }
  };

  const getCollectionRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${language === 'ar' ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
        <Button onClick={exportReport} disabled={!report || isLoading} className="gap-2">
          <Download className="h-4 w-4" />
          {language === 'ar' ? 'تصدير التقرير' : 'Export Report'}
        </Button>
        
        <div className={language === 'ar' ? 'text-right' : 'text-left'}>
          <h1 className={`text-2xl font-bold ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            {language === 'ar' ? 'تقارير التحصيل' : 'Collection Reports'}
          </h1>
          <p className={`text-muted-foreground ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            {language === 'ar' ? 'تحليل شامل لأداء التحصيل والمدفوعات' : 'Comprehensive analysis of collection performance and payments'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-6">
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <div>
              <label className="text-sm font-medium mb-2 block">
                {language === 'ar' ? 'نوع التقرير' : 'Report Type'}
              </label>
              <Select value={selectedPeriod} onValueChange={(value: 'monthly' | 'quarterly') => setSelectedPeriod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{language === 'ar' ? 'شهري' : 'Monthly'}</SelectItem>
                  <SelectItem value="quarterly">{language === 'ar' ? 'ربع سنوي' : 'Quarterly'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                {language === 'ar' ? 'السنة' : 'Year'}
              </label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPeriod === 'monthly' && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {language === 'ar' ? 'الشهر' : 'Month'}
                </label>
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(month => (
                      <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedPeriod === 'quarterly' && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {language === 'ar' ? 'الربع' : 'Quarter'}
                </label>
                <Select value={selectedQuarter.toString()} onValueChange={(value) => setSelectedQuarter(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {quarters.map(quarter => (
                      <SelectItem key={quarter.value} value={quarter.value.toString()}>{quarter.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Summary */}
      {report && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'إجمالي التحصيل' : 'Total Collections'}
                  </p>
                  <p className="text-2xl font-bold">{formatCurrency(report.totalCollections)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'معدل التحصيل' : 'Collection Rate'}
                  </p>
                  <p className={`text-2xl font-bold ${getCollectionRateColor(report.collectionRate)}`}>
                    {report.collectionRate.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className={`h-8 w-8 ${getCollectionRateColor(report.collectionRate)}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'المبالغ المتأخرة' : 'Overdue Amount'}
                  </p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(report.overdueAmount)}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'عدد العقود' : 'Number of Contracts'}
                  </p>
                  <p className="text-2xl font-bold">{report.numberOfContracts}</p>
                </div>
                <FileSpreadsheet className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Historical Trend Chart */}
      {historicalData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className={language === 'ar' ? 'text-right' : 'text-left'}>
              {language === 'ar' ? 'اتجاه التحصيل' : 'Collection Trend'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelFormatter={(label) => `Period: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="totalCollections" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name={language === 'ar' ? 'التحصيل الفعلي' : 'Actual Collections'}
                />
                <Line 
                  type="monotone" 
                  dataKey="expectedCollections" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name={language === 'ar' ? 'التحصيل المتوقع' : 'Expected Collections'}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Collection vs Expected Chart */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle className={language === 'ar' ? 'text-right' : 'text-left'}>
              {language === 'ar' ? 'التحصيل مقابل المتوقع' : 'Collections vs Expected'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[{
                name: report.period,
                collected: report.totalCollections,
                expected: report.expectedCollections,
                overdue: report.overdueAmount
              }]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                <Bar dataKey="collected" fill="#3B82F6" name={language === 'ar' ? 'المحصل' : 'Collected'} />
                <Bar dataKey="expected" fill="#10B981" name={language === 'ar' ? 'المتوقع' : 'Expected'} />
                <Bar dataKey="overdue" fill="#EF4444" name={language === 'ar' ? 'متأخر' : 'Overdue'} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CollectionReportsPage;  