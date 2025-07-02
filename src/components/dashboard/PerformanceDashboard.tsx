import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Zap,
  Smartphone,
  Monitor,
  Wifi,
  Database,
  RefreshCw,
  Download,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { performanceAnalytics, PerformanceMetric, UserAction, ErrorMetric } from '@/services/performance-analytics';

interface DashboardProps {
  className?: string;
}

const PerformanceDashboard: React.FC<DashboardProps> = ({ className }) => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [userActions, setUserActions] = useState<UserAction[]>([]);
  const [errors, setErrors] = useState<ErrorMetric[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState(30 * 60 * 1000); // 30 minutes

  const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    loadDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, timeRange]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Get data from performance analytics
      const metricsData = performanceAnalytics.getMetrics(undefined, timeRange);
      const actionsData = performanceAnalytics.getUserActions(timeRange);
      const errorsData = performanceAnalytics.getErrors(timeRange);
      const insightsData = performanceAnalytics.getPerformanceInsights();

      setMetrics(metricsData);
      setUserActions(actionsData);
      setErrors(errorsData);
      setInsights(insightsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMetricsByCategory = (category: string) => {
    return metrics.filter(m => m.category === category);
  };

  const getAverageMetric = (name: string) => {
    const metricValues = metrics
      .filter(m => m.name === name)
      .map(m => m.value);
    
    return metricValues.length > 0 
      ? metricValues.reduce((a, b) => a + b, 0) / metricValues.length 
      : 0;
  };

  const getMetricTrend = (name: string) => {
    const metricValues = metrics
      .filter(m => m.name === name)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(m => m.value);
    
    if (metricValues.length < 2) return 'stable';
    
    const recent = metricValues.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const previous = metricValues.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
    
    if (recent > previous * 1.1) return 'up';
    if (recent < previous * 0.9) return 'down';
    return 'stable';
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'ms') {
      return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(1)}s`;
    }
    if (unit === 'bytes') {
      if (value < 1024) return `${Math.round(value)}B`;
      if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)}KB`;
      return `${(value / (1024 * 1024)).toFixed(1)}MB`;
    }
    if (unit === 'count') {
      return Math.round(value).toString();
    }
    return `${value.toFixed(2)}${unit}`;
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const MetricCard: React.FC<{
    title: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
    icon: React.ReactNode;
    description?: string;
  }> = ({ title, value, trend, icon, description }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            {icon}
            <div className={isArabic ? 'text-right' : 'text-left'}>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {description && (
                <p className="text-xs text-gray-500 mt-1">{description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {trend === 'up' && <TrendingUp className="w-4 h-4 text-red-500" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4 text-green-500" />}
            {trend === 'stable' && <div className="w-4 h-4 bg-gray-300 rounded-full" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const AlertCard: React.FC<{ alert: any }> = ({ alert }) => (
    <Alert className={`mb-2 ${alert.severity === 'critical' ? 'border-red-500' : 'border-yellow-500'}`}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className={isArabic ? 'text-right' : 'text-left'}>
        <div className="flex items-center justify-between">
          <span>{alert.message}</span>
          <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
            {alert.severity}
          </Badge>
        </div>
      </AlertDescription>
    </Alert>
  );

  if (isLoading && metrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>{isArabic ? 'جاري التحميل...' : 'Loading...'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-2xl font-bold">
            {isArabic ? 'لوحة مراقبة الأداء' : 'Performance Dashboard'}
          </h1>
          <p className="text-gray-600">
            {isArabic ? 'مراقبة الأداء والتحليلات في الوقت الفعلي' : 'Real-time performance monitoring and analytics'}
          </p>
        </div>
        
        <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={isLoading}
            className="touch-friendly"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isArabic ? 'تحديث' : 'Refresh'}
          </Button>
          
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="touch-friendly"
          >
            <Activity className="w-4 h-4" />
            {isArabic ? 'تحديث تلقائي' : 'Auto Refresh'}
          </Button>
        </div>
      </div>

      {/* Performance Score */}
      {insights && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
              <div className={isArabic ? 'text-right' : 'text-left'}>
                <h3 className="text-lg font-semibold mb-2">
                  {isArabic ? 'نقاط الأداء العامة' : 'Overall Performance Score'}
                </h3>
                <div className={`text-4xl font-bold ${getPerformanceColor(insights.performanceScore)}`}>
                  {insights.performanceScore}/100
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {isArabic ? 'متوسط وقت التحميل:' : 'Avg Load Time:'} {formatValue(insights.averageLoadTime, 'ms')}
                </p>
                <p className="text-sm text-gray-600">
                  {isArabic ? 'معدل الأخطاء:' : 'Error Rate:'} {insights.errorRate.toFixed(1)}%
                </p>
              </div>
              
              <div className="text-6xl">
                {insights.performanceScore >= 90 ? '🚀' : 
                 insights.performanceScore >= 70 ? '⚡' : '🐌'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={isArabic ? 'وقت تحميل الصفحة' : 'Page Load Time'}
          value={formatValue(getAverageMetric('Page Load Time'), 'ms')}
          trend={getMetricTrend('Page Load Time')}
          icon={<Clock className="w-5 h-5 text-blue-500" />}
          description={isArabic ? 'متوسط وقت التحميل' : 'Average load time'}
        />
        
        <MetricCard
          title={isArabic ? 'إجراءات المستخدم' : 'User Actions'}
          value={userActions.length.toString()}
          trend="stable"
          icon={<Users className="w-5 h-5 text-green-500" />}
          description={isArabic ? 'في آخر 30 دقيقة' : 'Last 30 minutes'}
        />
        
        <MetricCard
          title={isArabic ? 'الأخطاء' : 'Errors'}
          value={errors.length.toString()}
          trend={errors.length > 5 ? 'up' : 'stable'}
          icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
          description={isArabic ? 'أخطاء حديثة' : 'Recent errors'}
        />
        
        <MetricCard
          title={isArabic ? 'استخدام الذاكرة' : 'Memory Usage'}
          value={formatValue(getAverageMetric('Memory Usage'), 'bytes')}
          trend={getMetricTrend('Memory Usage')}
          icon={<Database className="w-5 h-5 text-purple-500" />}
          description={isArabic ? 'متوسط الاستخدام' : 'Average usage'}
        />
      </div>

      {/* Alerts */}
      {performanceAnalytics.getAlerts().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              {isArabic ? 'تنبيهات الأداء' : 'Performance Alerts'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {performanceAnalytics.getAlerts().slice(0, 5).map(alert => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analytics */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className={`grid w-full grid-cols-4 ${isMobile ? 'text-xs' : ''}`}>
          <TabsTrigger value="performance">
            {isArabic ? 'الأداء' : 'Performance'}
          </TabsTrigger>
          <TabsTrigger value="users">
            {isArabic ? 'المستخدمون' : 'Users'}
          </TabsTrigger>
          <TabsTrigger value="errors">
            {isArabic ? 'الأخطاء' : 'Errors'}
          </TabsTrigger>
          <TabsTrigger value="insights">
            {isArabic ? 'الرؤى' : 'Insights'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <BarChart3 className="w-5 h-5" />
                  {isArabic ? 'مقاييس الأداء' : 'Performance Metrics'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Page Load Time', 'First Contentful Paint', 'Time to Interactive'].map(metricName => {
                    const value = getAverageMetric(metricName);
                    const trend = getMetricTrend(metricName);
                    return (
                      <div key={metricName} className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <span className="text-sm font-medium">{metricName}</span>
                        <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                          <span className="text-sm">{formatValue(value, 'ms')}</span>
                          {trend === 'up' && <TrendingUp className="w-3 h-3 text-red-500" />}
                          {trend === 'down' && <TrendingDown className="w-3 h-3 text-green-500" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <Smartphone className="w-5 h-5" />
                  {isArabic ? 'أداء الجوال' : 'Mobile Performance'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-medium">
                      {isArabic ? 'المستخدمون على الجوال' : 'Mobile Users'}
                    </span>
                    <span className="text-sm">
                      {Math.round((userActions.filter(a => a.metadata?.isMobile).length / userActions.length) * 100)}%
                    </span>
                  </div>
                  <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-medium">
                      {isArabic ? 'سرعة الاتصال' : 'Connection Speed'}
                    </span>
                    <span className="text-sm">{formatValue(getAverageMetric('Connection Speed'), 'mbps')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <Users className="w-5 h-5" />
                {isArabic ? 'نشاط المستخدمين' : 'User Activity'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`text-center ${isArabic ? 'text-right' : 'text-left'}`}>
                    <div className="text-2xl font-bold text-blue-600">{userActions.length}</div>
                    <div className="text-sm text-gray-600">
                      {isArabic ? 'إجمالي الإجراءات' : 'Total Actions'}
                    </div>
                  </div>
                  <div className={`text-center ${isArabic ? 'text-right' : 'text-left'}`}>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round((userActions.filter(a => a.success).length / userActions.length) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      {isArabic ? 'معدل النجاح' : 'Success Rate'}
                    </div>
                  </div>
                  <div className={`text-center ${isArabic ? 'text-right' : 'text-left'}`}>
                    <div className="text-2xl font-bold text-purple-600">
                      {insights?.userEngagement.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {isArabic ? 'إجراءات/دقيقة' : 'Actions/min'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <AlertTriangle className="w-5 h-5" />
                {isArabic ? 'تحليل الأخطاء' : 'Error Analysis'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {errors.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-600">
                    {isArabic ? 'لا توجد أخطاء في الفترة المحددة' : 'No errors in the selected time range'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {errors.slice(0, 10).map(error => (
                    <div key={error.id} className="border rounded-lg p-3">
                      <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <div className={isArabic ? 'text-right' : 'text-left'}>
                          <p className="font-medium">{error.type}</p>
                          <p className="text-sm text-gray-600">{error.component}</p>
                          <p className="text-xs text-gray-500 mt-1">{error.message}</p>
                        </div>
                        <Badge variant={
                          error.severity === 'critical' ? 'destructive' :
                          error.severity === 'high' ? 'secondary' : 'outline'
                        }>
                          {error.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {insights && (
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <Zap className="w-5 h-5" />
                  {isArabic ? 'رؤى الأداء' : 'Performance Insights'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">
                      {isArabic ? 'التوصيات' : 'Recommendations'}
                    </h4>
                    {insights.recommendations.length === 0 ? (
                      <p className="text-green-600">
                        {isArabic ? 'الأداء ممتاز! لا توجد توصيات حالياً.' : 'Performance is excellent! No recommendations at this time.'}
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {insights.recommendations.map((rec: string, index: number) => (
                          <li key={index} className={`flex items-start gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceDashboard; 