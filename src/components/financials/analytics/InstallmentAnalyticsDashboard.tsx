import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useLanguage } from '@/contexts/LanguageContext';
import { installmentReportingService, InstallmentAnalytics } from '@/services/InstallmentReportingService';
import { cacheService } from '@/services/CacheService';
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
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  FileSpreadsheet,
  AlertTriangle,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

const InstallmentAnalyticsDashboard = () => {
  const { language } = useLanguage();
  const [analytics, setAnalytics] = useState<InstallmentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    // Force refresh on initial load to get updated contract counts
    loadAnalytics(true);
  }, []);

  const loadAnalytics = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const cacheKey = 'installment_analytics_dashboard';
      
      let analyticsData: InstallmentAnalytics;
      
      if (!forceRefresh) {
        const cached = cacheService.getAnalytics(cacheKey);
        if (cached) {
          setAnalytics(cached);
          setLastUpdated(new Date());
          setIsLoading(false);
          return;
        }
      }
      
      analyticsData = await installmentReportingService.generateInstallmentAnalytics();
      
      // Debug logging
      console.log('Analytics data loaded:', {
        activeContracts: analyticsData.activeContracts,
        totalPortfolioValue: analyticsData.totalPortfolioValue,
        completedContracts: analyticsData.completedContracts
      });
      
      // Cache the results
      cacheService.setAnalytics(cacheKey, analyticsData);
      
      setAnalytics(analyticsData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error(language === 'ar' ? 'خطأ في تحميل التحليلات' : 'Error loading analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAnalytics = () => {
    loadAnalytics(true);
  };

  const getStatusColor = (value: number, threshold: { good: number; warning: number }) => {
    if (value >= threshold.good) return 'text-green-600';
    if (value >= threshold.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

  if (isLoading && !analytics) {
    return (
      <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`text-center py-8 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
        <p className="text-muted-foreground">
          {language === 'ar' ? 'لا توجد بيانات تحليلية متاحة' : 'No analytics data available'}
        </p>
      </div>
    );
  }

  const collectionRate = analytics.totalPortfolioValue > 0 
    ? (analytics.totalCollected / analytics.totalPortfolioValue) * 100 
    : 0;

  const overdueRate = analytics.activeContracts > 0 
    ? (analytics.overdueAnalysis.overdueContracts / analytics.activeContracts) * 100 
    : 0;

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${language === 'ar' ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
        <Button onClick={refreshAnalytics} disabled={isLoading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {language === 'ar' ? 'تحديث' : 'Refresh'}
        </Button>
        
        <div className={language === 'ar' ? 'text-right' : 'text-left'}>
          <h1 className={`text-2xl font-bold ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            {language === 'ar' ? 'تحليلات الأقساط' : 'Installment Analytics'}
          </h1>
          <p className={`text-muted-foreground ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            {language === 'ar' ? 'تحليل شامل لأداء محفظة الأقساط' : 'Comprehensive analysis of installment portfolio performance'}
          </p>
          {lastUpdated && (
            <p className={`text-xs text-muted-foreground mt-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {language === 'ar' ? 'آخر تحديث: ' : 'Last updated: '}
              {lastUpdated.toLocaleString(language === 'ar' ? 'ar-QA' : 'en-US')}
            </p>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                <p className="text-sm font-medium text-muted-foreground">
                  {language === 'ar' ? 'قيمة المحفظة' : 'Portfolio Value'}
                </p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.totalPortfolioValue)}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
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
                <p className={`text-2xl font-bold ${getStatusColor(collectionRate, { good: 85, warning: 70 })}`}>
                  {collectionRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className={`h-8 w-8 ${getStatusColor(collectionRate, { good: 85, warning: 70 })}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                <p className="text-sm font-medium text-muted-foreground">
                  {language === 'ar' ? 'العقود النشطة' : 'Active Contracts'}
                </p>
                <p className="text-2xl font-bold text-blue-600">{analytics.activeContracts}</p>
              </div>
              <FileSpreadsheet className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                <p className="text-sm font-medium text-muted-foreground">
                  {language === 'ar' ? 'معدل التأخير' : 'Overdue Rate'}
                </p>
                <p className={`text-2xl font-bold ${getStatusColor(100 - overdueRate, { good: 90, warning: 80 })}`}>
                  {overdueRate.toFixed(1)}%
                </p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${getStatusColor(100 - overdueRate, { good: 90, warning: 80 })}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collection Trend */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : 'text-left'}`}>
            <BarChart3 className="h-5 w-5" />
            {language === 'ar' ? 'اتجاه التحصيل (آخر 12 شهر)' : 'Collection Trend (Last 12 Months)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.collectionTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), '']}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="collected" 
                stackId="1"
                stroke="#3B82F6" 
                fill="#3B82F6"
                fillOpacity={0.6}
                name={language === 'ar' ? 'المحصل' : 'Collected'}
              />
              <Area 
                type="monotone" 
                dataKey="expected" 
                stackId="2"
                stroke="#10B981" 
                fill="#10B981"
                fillOpacity={0.3}
                name={language === 'ar' ? 'المتوقع' : 'Expected'}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Portfolio Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Portfolio Status */}
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <PieChartIcon className="h-5 w-5" />
              {language === 'ar' ? 'حالة المحفظة' : 'Portfolio Status'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: language === 'ar' ? 'محصل' : 'Collected', value: analytics.totalCollected, color: '#10B981' },
                    { name: language === 'ar' ? 'معلق' : 'Pending', value: analytics.totalPending, color: '#F59E0B' },
                    { name: language === 'ar' ? 'متأخر' : 'Overdue', value: analytics.totalOverdue, color: '#EF4444' }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {[
                    { name: 'Collected', value: analytics.totalCollected, color: '#10B981' },
                    { name: 'Pending', value: analytics.totalPending, color: '#F59E0B' },
                    { name: 'Overdue', value: analytics.totalOverdue, color: '#EF4444' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Overdue Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <AlertTriangle className="h-5 w-5" />
              {language === 'ar' ? 'تحليل المتأخرات' : 'Overdue Analysis'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.overdueAnalysis.overdueByAge}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ageRange" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'count' ? value : formatCurrency(value), 
                    name === 'count' ? (language === 'ar' ? 'العدد' : 'Count') : (language === 'ar' ? 'المبلغ' : 'Amount')
                  ]}
                />
                <Bar dataKey="count" fill="#EF4444" name="count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Contracts */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : 'text-left'}`}>
            <TrendingUp className="h-5 w-5" />
            {language === 'ar' ? 'أفضل العقود أداءً' : 'Top Performing Contracts'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topPerformingContracts.slice(0, 5).map((contract, index) => (
              <div key={contract.contractId} className={`flex items-center justify-between p-4 border rounded-lg ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600`}>
                    {index + 1}
                  </div>
                  <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                    <p className="font-medium">{contract.carType}</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(contract.totalValue)}</p>
                  </div>
                </div>
                <div className={`text-right ${language === 'ar' ? 'text-left' : ''}`}>
                  <p className={`font-bold ${getStatusColor(contract.collectionRate, { good: 85, warning: 70 })}`}>
                    {contract.collectionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'معدل التحصيل' : 'Collection Rate'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className={`text-center ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {language === 'ar' ? 'متوسط قيمة العقد' : 'Average Contract Value'}
              </p>
              <p className="text-xl font-bold">{formatCurrency(analytics.averageContractValue)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className={`text-center ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {language === 'ar' ? 'العقود المكتملة' : 'Completed Contracts'}
              </p>
              <p className="text-xl font-bold text-green-600">{analytics.completedContracts}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className={`text-center ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {language === 'ar' ? 'متوسط أيام التأخير' : 'Average Days Overdue'}
              </p>
              <p className="text-xl font-bold text-red-600">
                {analytics.overdueAnalysis.averageDaysOverdue.toFixed(0)} 
                <span className="text-sm font-normal ml-1">
                  {language === 'ar' ? 'يوم' : 'days'}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InstallmentAnalyticsDashboard; 