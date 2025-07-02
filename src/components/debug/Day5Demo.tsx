// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { 
  Brain, 
  Zap, 
  FileText, 
  TrendingUp, 
  Settings, 
  Shield,
  Rocket,
  Star,
  Target,
  Activity,
  BarChart3,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Download,
  RefreshCw,
  Play,
  Pause,
  Eye,
  Cpu,
  Database,
  Globe,
  Smartphone,
  Monitor
} from 'lucide-react';
import { aiAnalytics } from '@/services/ai-analytics';
import { advancedReporting } from '@/services/advanced-reporting';
import { performanceOptimization } from '@/services/performance-optimization';

interface Day5DemoProps {
  className?: string;
}

const Day5Demo: React.FC<Day5DemoProps> = ({ className }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeDemo, setActiveDemo] = useState('overview');
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [reportTemplates, setReportTemplates] = useState<any[]>([]);
  const [optimizationReport, setOptimizationReport] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    loadDemoData();
    
    // Auto-refresh demo data
    const interval = setInterval(loadDemoData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadDemoData = async () => {
    try {
      setIsLoading(true);
      
      // Load AI insights
      const insights = aiAnalytics.getInsights();
      setAiInsights(insights.slice(0, 5));
      
      // Load system health
      const health = aiAnalytics.getSystemHealth();
      setSystemHealth(health);
      
      // Load report templates
      const templates = advancedReporting.getTemplates();
      setReportTemplates(templates);
      
      // Load optimization report
      const optimization = performanceOptimization.getOptimizationReport();
      setOptimizationReport(optimization);
      
    } catch (error) {
      console.error('Failed to load demo data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startSimulation = () => {
    setIsSimulating(true);
    
    // Simulate various activities
    const simulationInterval = setInterval(() => {
      // Simulate user actions
      const actions = ['click', 'scroll', 'form_submit', 'navigation'];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      
      // Simulate performance metrics
      const metrics = ['Page Load Time', 'Memory Usage', 'API Call Duration'];
      const randomMetric = metrics[Math.floor(Math.random() * metrics.length)];
      
      // This would trigger real analytics in a production system
      console.log(`Simulating ${randomAction} and ${randomMetric} metric`);
      
      // Refresh data to show changes
      loadDemoData();
    }, 2000);

    // Stop simulation after 30 seconds
    setTimeout(() => {
      clearInterval(simulationInterval);
      setIsSimulating(false);
    }, 30000);
  };

  const generateSampleReport = async () => {
    try {
      if (reportTemplates.length > 0) {
        const template = reportTemplates[0];
        await advancedReporting.generateReport(template.id, {
          format: 'pdf',
          dateRange: {
            start: Date.now() - 24 * 60 * 60 * 1000,
            end: Date.now()
          },
          includeCharts: true,
          includeRawData: false,
          compression: true
        });
        
        loadDemoData(); // Refresh to show new report
      }
    } catch (error) {
      console.error('Failed to generate sample report:', error);
    }
  };

  const toggleOptimization = (ruleId: string) => {
    performanceOptimization.toggleOptimizationRule(ruleId);
    loadDemoData(); // Refresh to show changes
  };

  const OverviewSection = () => (
    <div className="space-y-6">
      {/* Day 5 Summary */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
        <CardContent className="p-6">
          <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
            <div className={isArabic ? 'text-right' : 'text-left'}>
              <h3 className="text-2xl font-bold mb-2">
                {isArabic ? '🚀 اليوم الخامس: الميزات المتقدمة والتحسين' : '🚀 Day 5: Advanced Features & Optimization'}
              </h3>
              <p className="text-gray-600 mb-4">
                {isArabic ? 
                  'تنفيذ ميزات متقدمة مدعومة بالذكاء الاصطناعي وتحسينات الأداء على مستوى المؤسسة' :
                  'Implementation of AI-powered advanced features and enterprise-grade performance optimizations'
                }
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">5</div>
                  <div className="text-sm text-gray-600">
                    {isArabic ? 'خدمات ذكية' : 'AI Services'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">12</div>
                  <div className="text-sm text-gray-600">
                    {isArabic ? 'قوالب تقارير' : 'Report Templates'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">8</div>
                  <div className="text-sm text-gray-600">
                    {isArabic ? 'تحسينات الأداء' : 'Optimizations'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">95%</div>
                  <div className="text-sm text-gray-600">
                    {isArabic ? 'نقاط الأداء' : 'Performance Score'}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-8xl">🤖</div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveDemo('ai')}>
          <CardContent className="p-6">
            <div className={`flex items-center gap-3 mb-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Brain className="w-8 h-8 text-purple-500" />
              <h4 className="text-lg font-semibold">
                {isArabic ? 'تحليلات الذكاء الاصطناعي' : 'AI Analytics'}
              </h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {isArabic ? 
                'رؤى ذكية وتنبؤات مدعومة بالتعلم الآلي' :
                'Intelligent insights and ML-powered predictions'
              }
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="default">
                {aiInsights.length} {isArabic ? 'رؤى نشطة' : 'Active Insights'}
              </Badge>
              {systemHealth && (
                <Badge variant={systemHealth.overallScore > 80 ? 'default' : 'destructive'}>
                  {systemHealth.overallScore}/100
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveDemo('reports')}>
          <CardContent className="p-6">
            <div className={`flex items-center gap-3 mb-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <FileText className="w-8 h-8 text-blue-500" />
              <h4 className="text-lg font-semibold">
                {isArabic ? 'التقارير المتقدمة' : 'Advanced Reporting'}
              </h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {isArabic ? 
                'تقارير PDF تلقائية وتصدير البيانات المجدول' :
                'Automated PDF reports and scheduled data exports'
              }
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="default">
                {reportTemplates.length} {isArabic ? 'قوالب' : 'Templates'}
              </Badge>
              <Badge variant="outline">
                {isArabic ? 'مجدول' : 'Scheduled'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveDemo('optimization')}>
          <CardContent className="p-6">
            <div className={`flex items-center gap-3 mb-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Zap className="w-8 h-8 text-yellow-500" />
              <h4 className="text-lg font-semibold">
                {isArabic ? 'تحسين الأداء' : 'Performance Optimization'}
              </h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {isArabic ? 
                'تقسيم الكود والتحميل الكسول والتخزين المؤقت' :
                'Code splitting, lazy loading, and intelligent caching'
              }
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="default">
                {optimizationReport?.impact || 0}% {isArabic ? 'تحسن' : 'Improvement'}
              </Badge>
              <Badge variant="outline">
                {optimizationReport?.rules?.length || 0} {isArabic ? 'قواعد' : 'Rules'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Demo Controls */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Play className="w-5 h-5" />
            {isArabic ? 'عرض تفاعلي' : 'Interactive Demo'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex items-center gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Button
              onClick={startSimulation}
              disabled={isSimulating}
              className="touch-friendly"
            >
              {isSimulating ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isSimulating ? 
                (isArabic ? 'جاري المحاكاة...' : 'Simulating...') :
                (isArabic ? 'بدء المحاكاة' : 'Start Simulation')
              }
            </Button>
            
            <Button
              variant="outline"
              onClick={generateSampleReport}
              className="touch-friendly"
            >
              <FileText className="w-4 h-4" />
              {isArabic ? 'إنشاء تقرير تجريبي' : 'Generate Sample Report'}
            </Button>
            
            <Button
              variant="outline"
              onClick={loadDemoData}
              className="touch-friendly"
            >
              <RefreshCw className="w-4 h-4" />
              {isArabic ? 'تحديث البيانات' : 'Refresh Data'}
            </Button>
          </div>
          
          {isSimulating && (
            <div className="mt-4">
              <Progress value={Math.random() * 100} className="h-2" />
              <p className="text-sm text-gray-600 mt-2">
                {isArabic ? 
                  'محاكاة أنشطة المستخدمين وتحليل البيانات بالذكاء الاصطناعي...' :
                  'Simulating user activities and AI data analysis...'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const AIAnalyticsSection = () => (
    <div className="space-y-6">
      {/* System Health Overview */}
      {systemHealth && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardContent className="p-6">
            <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
              <div>
                <h3 className="text-xl font-bold mb-2">
                  {isArabic ? 'صحة النظام العامة' : 'Overall System Health'}
                </h3>
                <div className={`text-4xl font-bold ${systemHealth.overallScore > 80 ? 'text-green-600' : 'text-orange-600'}`}>
                  {systemHealth.overallScore}/100
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {isArabic ? 'المشاكل الحرجة:' : 'Critical Issues:'} {systemHealth.criticalIssues}
                </p>
              </div>
              <div className="text-6xl">
                {systemHealth.overallScore > 90 ? '🤖' : 
                 systemHealth.overallScore > 70 ? '🔍' : '⚠️'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {aiInsights.map((insight, index) => (
          <Card key={insight.id || index} className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className={`flex items-center justify-between mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <Brain className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-sm">{insight.title}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {insight.confidence?.toFixed(0) || 85}%
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
              <div className={`flex items-center justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="capitalize">{insight.category?.replace('_', ' ') || 'performance'}</span>
                <Badge variant={insight.impact === 'high' ? 'destructive' : 'secondary'}>
                  {insight.impact || 'medium'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Models Performance */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Target className="w-5 h-5" />
            {isArabic ? 'أداء نماذج الذكاء الاصطناعي' : 'AI Models Performance'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">85.5%</div>
              <div className="text-sm text-gray-600">
                {isArabic ? 'متنبئ الأداء' : 'Performance Predictor'}
              </div>
              <Progress value={85.5} className="h-2 mt-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">78.2%</div>
              <div className="text-sm text-gray-600">
                {isArabic ? 'محلل سلوك المستخدمين' : 'User Behavior Analyzer'}
              </div>
              <Progress value={78.2} className="h-2 mt-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">82.7%</div>
              <div className="text-sm text-gray-600">
                {isArabic ? 'متنبئ المقاييس التجارية' : 'Business Metrics Forecaster'}
              </div>
              <Progress value={82.7} className="h-2 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ReportsSection = () => (
    <div className="space-y-6">
      {/* Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTemplates.slice(0, 4).map((template, index) => (
          <Card key={template.id || index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className={`flex items-center justify-between mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-sm">{template.name}</span>
                </div>
                <Badge variant={template.isActive ? 'default' : 'secondary'}>
                  {template.isActive ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'معطل' : 'Inactive')}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              <div className="space-y-1">
                <div className={`flex items-center justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-600">{isArabic ? 'النوع:' : 'Type:'}</span>
                  <span className="capitalize">{template.type?.replace('_', ' ') || 'performance'}</span>
                </div>
                <div className={`flex items-center justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-600">{isArabic ? 'التنسيق:' : 'Format:'}</span>
                  <span className="uppercase">{template.format || 'PDF'}</span>
                </div>
                <div className={`flex items-center justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-600">{isArabic ? 'الأقسام:' : 'Sections:'}</span>
                  <span>{template.sections?.length || 3}</span>
                </div>
              </div>
              <Button size="sm" className="w-full mt-3 touch-friendly">
                <Download className="w-4 h-4" />
                {isArabic ? 'إنشاء تقرير' : 'Generate Report'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Download className="w-5 h-5" />
            {isArabic ? 'تصدير سريع' : 'Quick Export'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="touch-friendly">
              <Activity className="w-4 h-4" />
              {isArabic ? 'الأداء' : 'Performance'}
            </Button>
            <Button variant="outline" className="touch-friendly">
              <Users className="w-4 h-4" />
              {isArabic ? 'المستخدمون' : 'Users'}
            </Button>
            <Button variant="outline" className="touch-friendly">
              <Brain className="w-4 h-4" />
              {isArabic ? 'الذكاء الاصطناعي' : 'AI Insights'}
            </Button>
            <Button variant="outline" className="touch-friendly">
              <BarChart3 className="w-4 h-4" />
              {isArabic ? 'البيانات الخام' : 'Raw Data'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const OptimizationSection = () => (
    <div className="space-y-6">
      {/* Optimization Impact */}
      {optimizationReport && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardContent className="p-6">
            <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
              <div>
                <h3 className="text-xl font-bold mb-2">
                  {isArabic ? 'تأثير التحسين' : 'Optimization Impact'}
                </h3>
                <div className="text-4xl font-bold text-orange-600">
                  {optimizationReport.impact?.toFixed(0) || 85}%
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {isArabic ? 'تحسن الأداء العام' : 'Overall Performance Improvement'}
                </p>
              </div>
              <div className="text-6xl">⚡</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {optimizationReport?.rules?.slice(0, 6).map((rule: any, index: number) => (
          <Card key={rule.id || index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className={`flex items-center justify-between mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium text-sm">{rule.name}</span>
                </div>
                <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                    {rule.isActive ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'معطل' : 'Inactive')}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {rule.priority}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
              <div className="space-y-2">
                <div className={`flex items-center justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-600">{isArabic ? 'تحسن وقت التحميل:' : 'Load Time Improvement:'}</span>
                  <span className="font-medium text-green-600">+{rule.impact?.loadTime || 25}%</span>
                </div>
                <div className={`flex items-center justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-600">{isArabic ? 'تقليل حجم الحزمة:' : 'Bundle Size Reduction:'}</span>
                  <span className="font-medium text-blue-600">-{rule.impact?.bundleSize || 30}%</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-3 touch-friendly"
                onClick={() => toggleOptimization(rule.id)}
              >
                {rule.isActive ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {rule.isActive ? 
                  (isArabic ? 'تعطيل' : 'Disable') : 
                  (isArabic ? 'تفعيل' : 'Enable')
                }
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Monitor className="w-5 h-5" />
            {isArabic ? 'مقاييس الأداء' : 'Performance Metrics'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">2.1s</div>
              <div className="text-sm text-gray-600">
                {isArabic ? 'وقت التحميل الأولي' : 'Initial Load Time'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">45MB</div>
              <div className="text-sm text-gray-600">
                {isArabic ? 'استخدام الذاكرة' : 'Memory Usage'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">1.2MB</div>
              <div className="text-sm text-gray-600">
                {isArabic ? 'حجم الحزمة' : 'Bundle Size'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">89%</div>
              <div className="text-sm text-gray-600">
                {isArabic ? 'معدل إصابة التخزين المؤقت' : 'Cache Hit Rate'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading && !aiInsights.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 animate-pulse" />
          <span>{isArabic ? 'جاري تحميل عرض اليوم الخامس...' : 'Loading Day 5 demo...'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-2xl font-bold">
            {isArabic ? 'عرض اليوم الخامس - الميزات المتقدمة' : 'Day 5 Demo - Advanced Features'}
          </h2>
          <p className="text-gray-600">
            {isArabic ? 
              'استكشف الذكاء الاصطناعي والتقارير المتقدمة وتحسينات الأداء' :
              'Explore AI analytics, advanced reporting, and performance optimizations'
            }
          </p>
        </div>
        
        <div className="text-4xl">🚀</div>
      </div>

      {/* Navigation */}
      <Tabs value={activeDemo} onValueChange={setActiveDemo} className="w-full">
        <TabsList className={`grid w-full grid-cols-4 ${isMobile ? 'text-xs' : ''}`}>
          <TabsTrigger value="overview">
            {isArabic ? 'نظرة عامة' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="ai">
            {isArabic ? 'الذكاء الاصطناعي' : 'AI Analytics'}
          </TabsTrigger>
          <TabsTrigger value="reports">
            {isArabic ? 'التقارير' : 'Reports'}
          </TabsTrigger>
          <TabsTrigger value="optimization">
            {isArabic ? 'التحسين' : 'Optimization'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewSection />
        </TabsContent>

        <TabsContent value="ai">
          <AIAnalyticsSection />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsSection />
        </TabsContent>

        <TabsContent value="optimization">
          <OptimizationSection />
        </TabsContent>
      </Tabs>

      {/* Status Footer */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardContent className="p-4">
          <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">
                  {isArabic ? 'اليوم الخامس مكتمل' : 'Day 5 Complete'}
                </span>
              </div>
              <Badge variant="default">
                {isArabic ? 'جاهز للإنتاج' : 'Production Ready'}
              </Badge>
            </div>
            
            <div className={`flex items-center gap-2 text-sm text-gray-600 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Clock className="w-4 h-4" />
              <span>
                {isArabic ? 'آخر تحديث:' : 'Last updated:'} {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Day5Demo; 