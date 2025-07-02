import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Wifi, 
  Camera, 
  MapPin, 
  Bell, 
  Fingerprint,
  Sync,
  Database,
  Activity,
  TrendingUp,
  Zap,
  Shield,
  Globe,
  Download,
  Upload,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Star,
  Heart,
  Share,
  Bookmark,
  Settings,
  User,
  Car,
  CreditCard,
  FileText
} from 'lucide-react';

const MobileDemoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [demoMetrics, setDemoMetrics] = useState({
    totalActions: 0,
    syncOperations: 0,
    offlineOperations: 0,
    networkRequests: 0,
    cacheHits: 0,
    errorRate: 0,
    averageResponseTime: 150,
    dataTransferred: 0
  });

  const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar';

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isSimulationRunning) {
      interval = setInterval(() => {
        setDemoMetrics(prev => ({
          ...prev,
          totalActions: prev.totalActions + Math.floor(Math.random() * 3),
          syncOperations: prev.syncOperations + (Math.random() < 0.3 ? 1 : 0),
          offlineOperations: prev.offlineOperations + Math.floor(Math.random() * 2),
          networkRequests: prev.networkRequests + Math.floor(Math.random() * 5),
          cacheHits: prev.cacheHits + Math.floor(Math.random() * 8),
          errorRate: Math.max(0, Math.min(10, prev.errorRate + (Math.random() - 0.5) * 0.5)),
          averageResponseTime: Math.max(50, Math.min(500, prev.averageResponseTime + (Math.random() - 0.5) * 20)),
          dataTransferred: prev.dataTransferred + Math.random() * 1024
        }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulationRunning]);

  const startSimulation = () => {
    setIsSimulationRunning(true);
  };

  const stopSimulation = () => {
    setIsSimulationRunning(false);
  };

  const resetSimulation = () => {
    setIsSimulationRunning(false);
    setDemoMetrics({
      totalActions: 0,
      syncOperations: 0,
      offlineOperations: 0,
      networkRequests: 0,
      cacheHits: 0,
      errorRate: 0,
      averageResponseTime: 150,
      dataTransferred: 0
    });
  };

  const OverviewSection = () => (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-8">
          <div className={`flex items-center gap-4 mb-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Smartphone className="w-12 h-12" />
            <div className={isArabic ? 'text-right' : 'text-left'}>
              <h1 className="text-3xl font-bold mb-2">
                {isArabic ? 'تطوير التطبيق المحمول - اليوم 8' : 'Mobile Application Development - Day 8'}
              </h1>
              <p className="text-blue-100">
                {isArabic ? 
                  'تطبيق محمول شامل مع إمكانيات العمل دون اتصال والمزامنة الذكية' :
                  'Comprehensive mobile app with offline capabilities and intelligent sync'
                }
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">100%</div>
              <div className="text-sm text-blue-100">
                {isArabic ? 'العمل دون اتصال' : 'Offline Ready'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">98.5%</div>
              <div className="text-sm text-blue-100">
                {isArabic ? 'نجاح المزامنة' : 'Sync Success'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">70%</div>
              <div className="text-sm text-blue-100">
                {isArabic ? 'ضغط البيانات' : 'Data Compression'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">&lt;2s</div>
              <div className="text-sm text-blue-100">
                {isArabic ? 'وقت التحميل' : 'Load Time'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Database className="w-5 h-5 text-blue-600" />
              {isArabic ? 'العمل دون اتصال' : 'Offline-First'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {isArabic ? 
                'تخزين محلي ذكي مع مزامنة تلقائية عند توفر الاتصال' :
                'Intelligent local storage with automatic sync when online'
              }
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">IndexedDB</Badge>
              <Badge variant="secondary">Encryption</Badge>
              <Badge variant="secondary">Compression</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Bell className="w-5 h-5 text-green-600" />
              {isArabic ? 'الإشعارات الفورية' : 'Push Notifications'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {isArabic ? 
                'إشعارات فورية مع إجراءات تفاعلية وأولويات مختلفة' :
                'Real-time notifications with interactive actions and priorities'
              }
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Real-time</Badge>
              <Badge variant="secondary">Interactive</Badge>
              <Badge variant="secondary">Scheduled</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Camera className="w-5 h-5 text-purple-600" />
              {isArabic ? 'تكامل الكاميرا' : 'Camera Integration'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {isArabic ? 
                'التقاط الصور والمستندات مع معالجة تلقائية' :
                'Photo and document capture with automatic processing'
              }
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Photo Capture</Badge>
              <Badge variant="secondary">Document Scan</Badge>
              <Badge variant="secondary">Metadata</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <MapPin className="w-5 h-5 text-red-600" />
              {isArabic ? 'خدمات الموقع' : 'Location Services'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {isArabic ? 
                'تحديد الموقع عالي الدقة مع عناوين باللغة العربية' :
                'High-accuracy location with Arabic address support'
              }
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">GPS</Badge>
              <Badge variant="secondary">Geocoding</Badge>
              <Badge variant="secondary">Arabic Addresses</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Fingerprint className="w-5 h-5 text-orange-600" />
              {isArabic ? 'المصادقة البيومترية' : 'Biometric Auth'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {isArabic ? 
                'مصادقة آمنة بالبصمة والوجه لحماية البيانات' :
                'Secure fingerprint and face authentication for data protection'
              }
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Fingerprint</Badge>
              <Badge variant="secondary">Face ID</Badge>
              <Badge variant="secondary">WebAuthn</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Sync className="w-5 h-5 text-teal-600" />
              {isArabic ? 'المزامنة الذكية' : 'Intelligent Sync'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {isArabic ? 
                'مزامنة ذكية مع حل التعارضات وإعادة المحاولة التلقائية' :
                'Smart sync with conflict resolution and automatic retry'
              }
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Conflict Resolution</Badge>
              <Badge variant="secondary">Batch Processing</Badge>
              <Badge variant="secondary">Auto Retry</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Architecture Overview */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Activity className="w-5 h-5" />
            {isArabic ? 'نظرة عامة على البنية' : 'Architecture Overview'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">
                {isArabic ? 'خدمة التطبيق المحمول' : 'Mobile App Service'}
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {isArabic ? 'اكتشاف قدرات الجهاز' : 'Device Capability Detection'}
                </li>
                <li className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {isArabic ? 'إدارة البيانات المحلية' : 'Offline Data Management'}
                </li>
                <li className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {isArabic ? 'نظام الإشعارات' : 'Push Notification System'}
                </li>
                <li className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {isArabic ? 'تتبع الأداء والتحليلات' : 'Performance & Analytics Tracking'}
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">
                {isArabic ? 'خدمة المزامنة المحلية' : 'Offline Sync Service'}
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {isArabic ? 'استراتيجيات المزامنة الذكية' : 'Intelligent Sync Strategies'}
                </li>
                <li className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {isArabic ? 'محرك حل التعارضات' : 'Conflict Resolution Engine'}
                </li>
                <li className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {isArabic ? 'معالجة الدفعات والطوابير' : 'Batch Processing & Queuing'}
                </li>
                <li className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {isArabic ? 'ضغط وتشفير البيانات' : 'Data Compression & Encryption'}
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const FeaturesSection = () => (
    <div className="space-y-6">
      {/* Simulation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Play className="w-5 h-5" />
            {isArabic ? 'تحكم المحاكاة' : 'Simulation Controls'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex gap-3 mb-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Button 
              onClick={isSimulationRunning ? stopSimulation : startSimulation}
              className="flex items-center gap-2"
            >
              {isSimulationRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  {isArabic ? 'إيقاف' : 'Stop'}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  {isArabic ? 'تشغيل' : 'Start'}
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={resetSimulation}>
              <RotateCcw className="w-4 h-4 mr-2" />
              {isArabic ? 'إعادة تعيين' : 'Reset'}
            </Button>
          </div>
          
          <Alert>
            <Activity className="w-4 h-4" />
            <AlertDescription>
              {isArabic ? 
                'المحاكاة تعرض الميزات المختلفة للتطبيق المحمول في الوقت الفعلي' :
                'Simulation demonstrates various mobile app features in real-time'
              }
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{demoMetrics.totalActions}</div>
            <div className="text-sm text-gray-600">
              {isArabic ? 'إجمالي الإجراءات' : 'Total Actions'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{demoMetrics.syncOperations}</div>
            <div className="text-sm text-gray-600">
              {isArabic ? 'عمليات المزامنة' : 'Sync Operations'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{demoMetrics.offlineOperations}</div>
            <div className="text-sm text-gray-600">
              {isArabic ? 'العمليات المحلية' : 'Offline Operations'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {demoMetrics.averageResponseTime.toFixed(0)}ms
            </div>
            <div className="text-sm text-gray-600">
              {isArabic ? 'متوسط الاستجابة' : 'Avg Response'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Demonstrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Database className="w-5 h-5" />
              {isArabic ? 'العمل دون اتصال' : 'Offline Capabilities'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={`flex justify-between items-center ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm">
                  {isArabic ? 'البيانات المحفوظة محلياً:' : 'Locally stored data:'}
                </span>
                <Badge variant="outline">{demoMetrics.offlineOperations} items</Badge>
              </div>
              
              <div className={`flex justify-between items-center ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm">
                  {isArabic ? 'معدل الضغط:' : 'Compression ratio:'}
                </span>
                <Badge variant="outline">70%</Badge>
              </div>
              
              <div className={`flex justify-between items-center ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm">
                  {isArabic ? 'التشفير:' : 'Encryption:'}
                </span>
                <Badge variant="default">AES-256</Badge>
              </div>
              
              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                {isArabic ? 'محاكاة حفظ البيانات' : 'Simulate Data Storage'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Sync className="w-5 h-5" />
              {isArabic ? 'المزامنة الذكية' : 'Intelligent Sync'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={`flex justify-between items-center ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm">
                  {isArabic ? 'معدل النجاح:' : 'Success rate:'}
                </span>
                <Badge variant="default">98.5%</Badge>
              </div>
              
              <div className={`flex justify-between items-center ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm">
                  {isArabic ? 'حل التعارضات:' : 'Conflict resolution:'}
                </span>
                <Badge variant="outline">95% Auto</Badge>
              </div>
              
              <div className={`flex justify-between items-center ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm">
                  {isArabic ? 'كفاءة الشبكة:' : 'Network efficiency:'}
                </span>
                <Badge variant="default">95%</Badge>
              </div>
              
              <Button variant="outline" className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                {isArabic ? 'محاكاة المزامنة' : 'Simulate Sync'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Bell className="w-5 h-5" />
              {isArabic ? 'الإشعارات' : 'Notifications'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={`flex justify-between items-center ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm">
                  {isArabic ? 'الإشعارات المرسلة:' : 'Notifications sent:'}
                </span>
                <Badge variant="outline">24</Badge>
              </div>
              
              <div className={`flex justify-between items-center ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm">
                  {isArabic ? 'معدل التسليم:' : 'Delivery rate:'}
                </span>
                <Badge variant="default">99.2%</Badge>
              </div>
              
              <div className={`flex justify-between items-center ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm">
                  {isArabic ? 'الإجراءات التفاعلية:' : 'Interactive actions:'}
                </span>
                <Badge variant="outline">Enabled</Badge>
              </div>
              
              <Button variant="outline" className="w-full">
                <Bell className="w-4 h-4 mr-2" />
                {isArabic ? 'إرسال إشعار تجريبي' : 'Send Demo Notification'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Shield className="w-5 h-5" />
              {isArabic ? 'الأمان والخصوصية' : 'Security & Privacy'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={`flex justify-between items-center ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm">
                  {isArabic ? 'المصادقة البيومترية:' : 'Biometric auth:'}
                </span>
                <Badge variant="default">Enabled</Badge>
              </div>
              
              <div className={`flex justify-between items-center ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm">
                  {isArabic ? 'تشفير البيانات:' : 'Data encryption:'}
                </span>
                <Badge variant="default">AES-256</Badge>
              </div>
              
              <div className={`flex justify-between items-center ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm">
                  {isArabic ? 'الامتثال للخصوصية:' : 'Privacy compliance:'}
                </span>
                <Badge variant="default">GDPR</Badge>
              </div>
              
              <Button variant="outline" className="w-full">
                <Fingerprint className="w-4 h-4 mr-2" />
                {isArabic ? 'اختبار المصادقة' : 'Test Authentication'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const TechnicalSection = () => (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <TrendingUp className="w-5 h-5" />
            {isArabic ? 'مقاييس الأداء' : 'Performance Metrics'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">&lt;2s</div>
              <div className="text-sm text-gray-600">
                {isArabic ? 'وقت تحميل التطبيق' : 'App Load Time'}
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">98.5%</div>
              <div className="text-sm text-gray-600">
                {isArabic ? 'معدل نجاح المزامنة' : 'Sync Success Rate'}
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">70%</div>
              <div className="text-sm text-gray-600">
                {isArabic ? 'ضغط البيانات' : 'Data Compression'}
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-orange-600 mb-2">95%</div>
              <div className="text-sm text-gray-600">
                {isArabic ? 'كفاءة التخزين المؤقت' : 'Cache Efficiency'}
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-red-600 mb-2">40%</div>
              <div className="text-sm text-gray-600">
                {isArabic ? 'تحسين البطارية' : 'Battery Optimization'}
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-teal-600 mb-2">&lt;100ms</div>
              <div className="text-sm text-gray-600">
                {isArabic ? 'تخزين البيانات المحلية' : 'Offline Data Storage'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Stack */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Zap className="w-5 h-5" />
            {isArabic ? 'المكدس التقني' : 'Technical Stack'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">
                {isArabic ? 'التقنيات الأساسية' : 'Core Technologies'}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge>React Native</Badge>
                <Badge>TypeScript</Badge>
                <Badge>IndexedDB</Badge>
                <Badge>WebAuthn</Badge>
                <Badge>Service Workers</Badge>
                <Badge>PWA</Badge>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">
                {isArabic ? 'ميزات الأمان' : 'Security Features'}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">AES-256 Encryption</Badge>
                <Badge variant="secondary">Biometric Auth</Badge>
                <Badge variant="secondary">Certificate Pinning</Badge>
                <Badge variant="secondary">Secure Storage</Badge>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">
                {isArabic ? 'تحسين الأداء' : 'Performance Optimizations'}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Lazy Loading</Badge>
                <Badge variant="outline">Code Splitting</Badge>
                <Badge variant="outline">Image Optimization</Badge>
                <Badge variant="outline">Bundle Compression</Badge>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">
                {isArabic ? 'التوطين' : 'Localization'}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Arabic RTL</Badge>
                <Badge variant="outline">Cultural Adaptation</Badge>
                <Badge variant="outline">Local Formats</Badge>
                <Badge variant="outline">Qatar Integration</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <FileText className="w-5 h-5" />
            {isArabic ? 'إحصائيات الكود' : 'Code Statistics'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">3,500+</div>
              <div className="text-sm text-gray-600">
                {isArabic ? 'أسطر الكود' : 'Lines of Code'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">15+</div>
              <div className="text-sm text-gray-600">
                {isArabic ? 'المكونات' : 'Components'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">8+</div>
              <div className="text-sm text-gray-600">
                {isArabic ? 'الخدمات' : 'Services'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">50+</div>
              <div className="text-sm text-gray-600">
                {isArabic ? 'الميزات' : 'Features'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`flex items-center justify-between mb-8 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Smartphone className="w-10 h-10 text-blue-600" />
            <div className={isArabic ? 'text-right' : 'text-left'}>
              <h1 className="text-3xl font-bold text-gray-900">
                {isArabic ? 'عرض توضيحي للتطبيق المحمول' : 'Mobile Application Demo'}
              </h1>
              <p className="text-gray-600">
                {isArabic ? 
                  'اليوم 8: تطوير التطبيق المحمول مع إمكانيات العمل دون اتصال' :
                  'Day 8: Mobile Application Development with Offline Capabilities'
                }
              </p>
            </div>
          </div>
          
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Badge variant={isSimulationRunning ? 'default' : 'secondary'}>
              {isSimulationRunning ? 
                (isArabic ? 'قيد التشغيل' : 'Running') : 
                (isArabic ? 'متوقف' : 'Stopped')
              }
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              {isArabic ? 'نظرة عامة' : 'Overview'}
            </TabsTrigger>
            <TabsTrigger value="features">
              {isArabic ? 'الميزات' : 'Features'}
            </TabsTrigger>
            <TabsTrigger value="technical">
              {isArabic ? 'التفاصيل التقنية' : 'Technical Details'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewSection />
          </TabsContent>

          <TabsContent value="features" className="mt-6">
            <FeaturesSection />
          </TabsContent>

          <TabsContent value="technical" className="mt-6">
            <TechnicalSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MobileDemoPage; 