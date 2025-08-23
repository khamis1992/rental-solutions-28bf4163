// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  BarChart3, 
  Users, 
  Zap, 
  Clock, 
  Smartphone,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Play,
  Pause,
  Target,
  Eye,
  MousePointer
} from 'lucide-react';
import PerformanceDashboard from '@/components/dashboard/PerformanceDashboard';
import PerformanceChart from '@/components/analytics/PerformanceChart';
import UserBehaviorAnalytics from '@/components/analytics/UserBehaviorAnalytics';
import { usePerformanceTracking } from '@/hooks/usePerformanceTracking';
import { performanceAnalytics, trackUserAction, trackError, trackPerformance } from '@/services/performance-analytics';

const PerformanceAnalyticsDemo: React.FC = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationCount, setSimulationCount] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Use performance tracking hooks
  const tracking = usePerformanceTracking({
    componentName: 'PerformanceAnalyticsDemo',
    trackMount: true,
    trackUnmount: true,
    trackRenders: true,
    trackUserInteractions: true
  });

  const { trackApi } = useApiTracking('PerformanceAnalyticsDemo');
  const formTracking = useFormTracking('PerformanceAnalyticsDemo', 'demo-form');
  const engagementTracking = useEngagementTracking('PerformanceAnalyticsDemo');

  useEffect(() => {
    // Track page view
    tracking.trackPageView('Performance Analytics Demo', {
      isArabic,
      isMobile,
      timestamp: Date.now()
    });

    // Start engagement tracking
    const handleScroll = () => {
      const scrollPercentage = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      engagementTracking.trackScroll(Math.min(100, Math.max(0, scrollPercentage)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tracking, engagementTracking, isArabic, isMobile]);

  // Simulate realistic performance data
  const simulatePerformanceData = () => {
    const scenarios = [
      // Fast page load
      () => {
        trackPerformance('Page Load Time', 800 + Math.random() * 400, 'ms');
        trackPerformance('First Contentful Paint', 600 + Math.random() * 300, 'ms');
        trackPerformance('Time to Interactive', 1200 + Math.random() * 500, 'ms');
      },
      // Slow page load
      () => {
        trackPerformance('Page Load Time', 3000 + Math.random() * 2000, 'ms');
        trackPerformance('First Contentful Paint', 2000 + Math.random() * 1000, 'ms');
        trackPerformance('Time to Interactive', 4000 + Math.random() * 2000, 'ms');
      },
      // Memory usage
      () => {
        trackPerformance('Memory Usage', 20 * 1024 * 1024 + Math.random() * 30 * 1024 * 1024, 'bytes');
      },
      // API calls
      () => {
        const endpoints = ['/api/customers', '/api/agreements', '/api/payments', '/api/vehicles'];
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        const duration = 100 + Math.random() * 500;
        const success = Math.random() > 0.1; // 90% success rate
        
        tracking.trackApiCall(endpoint, 'GET', success, duration);
      },
      // User actions
      () => {
        const actions = ['click', 'form_submit', 'navigation', 'search', 'filter'];
        const components = ['CustomerList', 'AgreementForm', 'PaymentTable', 'VehicleCard'];
        const action = actions[Math.floor(Math.random() * actions.length)];
        const component = components[Math.floor(Math.random() * components.length)];
        const success = Math.random() > 0.05; // 95% success rate
        
        trackUserAction(action, component, success, {
          isMobile: Math.random() > 0.6,
          timestamp: Date.now()
        });
      },
      // Errors (occasional)
      () => {
        if (Math.random() < 0.1) { // 10% chance of error
          const errorTypes = ['NetworkError', 'ValidationError', 'AuthError', 'ServerError'];
          const components = ['CustomerForm', 'PaymentProcessor', 'AgreementValidator', 'VehicleService'];
          const severities: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical'];
          
          const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
          const component = components[Math.floor(Math.random() * components.length)];
          const severity = severities[Math.floor(Math.random() * severities.length)];
          
          trackError(errorType, `Simulated ${errorType} in ${component}`, component, severity);
        }
      }
    ];

    // Run multiple scenarios
    scenarios.forEach(scenario => {
      if (Math.random() > 0.3) { // 70% chance to run each scenario
        scenario();
      }
    });

    setSimulationCount(prev => prev + 1);
  };

  // Auto-simulation
  useEffect(() => {
    if (isSimulating) {
      const interval = setInterval(simulatePerformanceData, 2000); // Every 2 seconds
      return () => clearInterval(interval);
    }
  }, [isSimulating]);

  const handleStartSimulation = () => {
    setIsSimulating(true);
    tracking.trackAction('start_simulation', true, { timestamp: Date.now() });
  };

  const handleStopSimulation = () => {
    setIsSimulating(false);
    tracking.trackAction('stop_simulation', true, { 
      timestamp: Date.now(),
      simulationCount 
    });
  };

  const handleManualDataGeneration = () => {
    simulatePerformanceData();
    tracking.trackAction('manual_data_generation', true, { timestamp: Date.now() });
  };

  const handleTestError = () => {
    try {
      throw new Error('Test error for demonstration');
    } catch (error) {
      tracking.trackError(error as Error, 'medium');
    }
  };

  const handleTestApiCall = async () => {
    const stopTimer = tracking.startTimer('Demo API Call');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      tracking.trackApiCall('/api/demo', 'GET', true, 500 + Math.random() * 1000);
      stopTimer();
    } catch (error) {
      tracking.trackApiCall('/api/demo', 'GET', false, 500);
      stopTimer();
    }
  };

  const handleFormTest = () => {
    const stopFormTimer = formTracking.trackFormStart();
    
    // Simulate form interaction
    setTimeout(() => {
      formTracking.trackFormField('email', 'test@example.com');
    }, 500);
    
    setTimeout(() => {
      formTracking.trackFormField('name', 'Test User');
    }, 1000);
    
    setTimeout(() => {
      formTracking.trackFormValidation(true);
      formTracking.trackFormSubmission(true);
      stopFormTimer();
    }, 1500);
  };

  const insights = performanceAnalytics.getPerformanceInsights();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold">
            {isArabic ? 'عرض تحليل الأداء - اليوم 4' : 'Performance Analytics Demo - Day 4'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isArabic ? 
              'نظام مراقبة الأداء الشامل مع التحليلات في الوقت الفعلي وتتبع سلوك المستخدمين' :
              'Comprehensive performance monitoring system with real-time analytics and user behavior tracking'
            }
          </p>
        </div>
        
        <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <Badge variant="outline" className="text-sm">
            {isArabic ? 'اليوم 4' : 'Day 4'}
          </Badge>
          <Badge variant="default" className="text-sm">
            {isArabic ? 'تحليل الأداء' : 'Performance Analytics'}
          </Badge>
        </div>
      </div>

      {/* Performance Score Overview */}
      {insights && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
              <div className={isArabic ? 'text-right' : 'text-left'}>
                <h3 className="text-xl font-semibold mb-2">
                  {isArabic ? 'نقاط الأداء الحالية' : 'Current Performance Score'}
                </h3>
                <div className={`text-5xl font-bold ${
                  insights.performanceScore >= 90 ? 'text-green-600' :
                  insights.performanceScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {insights.performanceScore}/100
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">
                    {isArabic ? 'متوسط وقت التحميل:' : 'Avg Load Time:'} {insights.averageLoadTime.toFixed(0)}ms
                  </p>
                  <p className="text-sm text-gray-600">
                    {isArabic ? 'معدل الأخطاء:' : 'Error Rate:'} {insights.errorRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">
                    {isArabic ? 'مشاركة المستخدمين:' : 'User Engagement:'} {insights.userEngagement.toFixed(1)}/min
                  </p>
                </div>
              </div>
              
              <div className="text-8xl">
                {insights.performanceScore >= 90 ? '🚀' : 
                 insights.performanceScore >= 70 ? '⚡' : '🐌'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Activity className="w-5 h-5" />
            {isArabic ? 'لوحة التحكم في المحاكاة' : 'Simulation Control Panel'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={isSimulating ? handleStopSimulation : handleStartSimulation}
              variant={isSimulating ? 'destructive' : 'default'}
              className="touch-friendly"
            >
              {isSimulating ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isArabic ? 
                (isSimulating ? 'إيقاف المحاكاة' : 'بدء المحاكاة') :
                (isSimulating ? 'Stop Simulation' : 'Start Simulation')
              }
            </Button>
            
            <Button
              onClick={handleManualDataGeneration}
              variant="outline"
              className="touch-friendly"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {isArabic ? 'توليد بيانات' : 'Generate Data'}
            </Button>
            
            <Button
              onClick={handleTestError}
              variant="outline"
              className="touch-friendly"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              {isArabic ? 'اختبار خطأ' : 'Test Error'}
            </Button>
            
            <Button
              onClick={handleTestApiCall}
              variant="outline"
              className="touch-friendly"
            >
              <Zap className="w-4 h-4 mr-2" />
              {isArabic ? 'اختبار API' : 'Test API'}
            </Button>
          </div>
          
          {isSimulating && (
            <Alert className="mt-4">
              <Activity className="h-4 w-4 animate-pulse" />
              <AlertDescription>
                {isArabic ? 
                  `المحاكاة نشطة - تم توليد ${simulationCount} مجموعة بيانات` :
                  `Simulation active - Generated ${simulationCount} data sets`
                }
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Feature Showcase */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-4 ${isMobile ? 'text-xs' : ''}`}>
          <TabsTrigger value="overview" onClick={() => tracking.trackClick('overview-tab')}>
            {isArabic ? 'نظرة عامة' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="dashboard" onClick={() => tracking.trackClick('dashboard-tab')}>
            {isArabic ? 'لوحة القيادة' : 'Dashboard'}
          </TabsTrigger>
          <TabsTrigger value="charts" onClick={() => tracking.trackClick('charts-tab')}>
            {isArabic ? 'الرسوم البيانية' : 'Charts'}
          </TabsTrigger>
          <TabsTrigger value="behavior" onClick={() => tracking.trackClick('behavior-tab')}>
            {isArabic ? 'سلوك المستخدمين' : 'User Behavior'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  {isArabic ? 'الميزات المنجزة' : 'Completed Features'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: isArabic ? 'خدمة تحليل الأداء' : 'Performance Analytics Service', status: 'complete' },
                    { name: isArabic ? 'لوحة مراقبة الأداء' : 'Performance Dashboard', status: 'complete' },
                    { name: isArabic ? 'رسوم بيانية للأداء' : 'Performance Charts', status: 'complete' },
                    { name: isArabic ? 'تحليل سلوك المستخدمين' : 'User Behavior Analytics', status: 'complete' },
                    { name: isArabic ? 'خطافات تتبع الأداء' : 'Performance Tracking Hooks', status: 'complete' },
                    { name: isArabic ? 'مراقبة الأخطاء' : 'Error Monitoring', status: 'complete' },
                    { name: isArabic ? 'تحسين الجوال' : 'Mobile Optimization', status: 'complete' },
                    { name: isArabic ? 'دعم اللغة العربية' : 'Arabic Language Support', status: 'complete' }
                  ].map((feature, index) => (
                    <div key={index} className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{feature.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <Target className="w-5 h-5 text-blue-500" />
                  {isArabic ? 'المقاييس الرئيسية' : 'Key Metrics'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-medium">
                      {isArabic ? 'مقاييس الأداء المتتبعة:' : 'Performance Metrics Tracked:'}
                    </span>
                    <Badge variant="outline">15+</Badge>
                  </div>
                  <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-medium">
                      {isArabic ? 'إجراءات المستخدمين المسجلة:' : 'User Actions Recorded:'}
                    </span>
                    <Badge variant="outline">{performanceAnalytics.getUserActions().length}</Badge>
                  </div>
                  <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-medium">
                      {isArabic ? 'الأخطاء المرصودة:' : 'Errors Monitored:'}
                    </span>
                    <Badge variant="outline">{performanceAnalytics.getErrors().length}</Badge>
                  </div>
                  <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-medium">
                      {isArabic ? 'التنبيهات النشطة:' : 'Active Alerts:'}
                    </span>
                    <Badge variant="outline">{performanceAnalytics.getAlerts().length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <Eye className="w-5 h-5 text-purple-500" />
                {isArabic ? 'اختبار التفاعل' : 'Interaction Testing'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={handleFormTest}
                  variant="outline"
                  className="touch-friendly"
                >
                  <MousePointer className="w-4 h-4 mr-2" />
                  {isArabic ? 'اختبار النموذج' : 'Test Form'}
                </Button>
                
                <Button
                  onClick={() => tracking.trackClick('demo-button', { timestamp: Date.now() })}
                  variant="outline"
                  className="touch-friendly"
                >
                  <Target className="w-4 h-4 mr-2" />
                  {isArabic ? 'اختبار النقر' : 'Test Click'}
                </Button>
                
                <Button
                  onClick={() => {
                    const stopTimer = tracking.startTimer('Demo Timer');
                    setTimeout(stopTimer, 1000 + Math.random() * 2000);
                  }}
                  variant="outline"
                  className="touch-friendly"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {isArabic ? 'اختبار التوقيت' : 'Test Timing'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard">
          <PerformanceDashboard />
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceChart
              metricName="Page Load Time"
              title={isArabic ? 'وقت تحميل الصفحة' : 'Page Load Time'}
              chartType="line"
              height={300}
              showTrend={true}
              showAverage={true}
            />
            
            <PerformanceChart
              metricName="Memory Usage"
              title={isArabic ? 'استخدام الذاكرة' : 'Memory Usage'}
              chartType="area"
              height={300}
              showTrend={true}
            />
            
            <PerformanceChart
              metricName="API Call Duration"
              title={isArabic ? 'مدة استدعاء API' : 'API Call Duration'}
              chartType="bar"
              height={300}
            />
            
            <PerformanceChart
              metricName="User Action"
              title={isArabic ? 'إجراءات المستخدمين' : 'User Actions'}
              chartType="line"
              height={300}
            />
          </div>
        </TabsContent>

        <TabsContent value="behavior">
          <UserBehaviorAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceAnalyticsDemo; 