import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Smartphone, 
  Play, 
  Pause, 
  RotateCcw,
  Wifi,
  WifiOff,
  Camera,
  MapPin,
  Bell,
  Fingerprint,
  Sync,
  Database,
  Activity,
  TrendingUp,
  Users,
  Car,
  CreditCard,
  FileText,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Shield,
  Globe,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Star,
  Heart,
  Share,
  Bookmark
} from 'lucide-react';
import MobileApp from './MobileApp';
import { 
  mobileAppService,
  storeOfflineData,
  sendPushNotification,
  getCurrentLocation,
  capturePhoto,
  trackScreenView,
  trackUserAction
} from '@/services/mobile-app-service';
import { 
  offlineSyncService,
  addToSyncQueue,
  triggerSync,
  getSyncStatus
} from '@/services/offline-sync-service';

interface MobileDemoProps {
  className?: string;
}

interface SimulationState {
  isRunning: boolean;
  networkStatus: 'online' | 'offline' | 'slow';
  batteryLevel: number;
  dataUsage: number;
  activeUsers: number;
  syncProgress: number;
  notifications: number;
  photos: number;
  locations: number;
}

interface DemoMetrics {
  totalActions: number;
  syncOperations: number;
  offlineOperations: number;
  networkRequests: number;
  cacheHits: number;
  errorRate: number;
  averageResponseTime: number;
  dataTransferred: number;
}

const MobileDemo: React.FC<MobileDemoProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [simulationState, setSimulationState] = useState<SimulationState>({
    isRunning: false,
    networkStatus: 'online',
    batteryLevel: 85,
    dataUsage: 45,
    activeUsers: 12,
    syncProgress: 0,
    notifications: 0,
    photos: 0,
    locations: 0
  });
  
  const [demoMetrics, setDemoMetrics] = useState<DemoMetrics>({
    totalActions: 0,
    syncOperations: 0,
    offlineOperations: 0,
    networkRequests: 0,
    cacheHits: 0,
    errorRate: 0,
    averageResponseTime: 150,
    dataTransferred: 0
  });

  const [realtimeData, setRealtimeData] = useState({
    syncStatus: getSyncStatus(),
    deviceInfo: mobileAppService.getDeviceInfo(),
    analytics: mobileAppService.getAnalytics()
  });

  const simulationInterval = useRef<NodeJS.Timeout>();
  const metricsInterval = useRef<NodeJS.Timeout>();
  const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar';

  useEffect(() => {
    // Track demo initialization
    trackScreenView('mobile_demo');
    
    // Start real-time data updates
    const dataInterval = setInterval(updateRealtimeData, 2000);
    
    return () => {
      clearInterval(dataInterval);
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
      }
      if (metricsInterval.current) {
        clearInterval(metricsInterval.current);
      }
    };
  }, []);

  const updateRealtimeData = () => {
    setRealtimeData({
      syncStatus: getSyncStatus(),
      deviceInfo: mobileAppService.getDeviceInfo(),
      analytics: mobileAppService.getAnalytics()
    });
  };

  const startSimulation = () => {
    setSimulationState(prev => ({ ...prev, isRunning: true }));
    trackUserAction('simulation_started', 'mobile_demo');
    
    // Start simulation intervals
    simulationInterval.current = setInterval(runSimulationStep, 1000);
    metricsInterval.current = setInterval(updateMetrics, 500);
  };

  const stopSimulation = () => {
    setSimulationState(prev => ({ ...prev, isRunning: false }));
    trackUserAction('simulation_stopped', 'mobile_demo');
    
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
    }
    if (metricsInterval.current) {
      clearInterval(metricsInterval.current);
    }
  };

  const resetSimulation = () => {
    stopSimulation();
    setSimulationState({
      isRunning: false,
      networkStatus: 'online',
      batteryLevel: 85,
      dataUsage: 45,
      activeUsers: 12,
      syncProgress: 0,
      notifications: 0,
      photos: 0,
      locations: 0
    });
    
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
    
    trackUserAction('simulation_reset', 'mobile_demo');
  };

  const runSimulationStep = () => {
    setSimulationState(prev => {
      const newState = { ...prev };
      
      // Simulate network changes
      if (Math.random() < 0.05) { // 5% chance
        const statuses: ('online' | 'offline' | 'slow')[] = ['online', 'offline', 'slow'];
        newState.networkStatus = statuses[Math.floor(Math.random() * statuses.length)];
      }
      
      // Simulate battery drain
      if (Math.random() < 0.1) { // 10% chance
        newState.batteryLevel = Math.max(0, newState.batteryLevel - Math.random() * 2);
      }
      
      // Simulate data usage
      newState.dataUsage += Math.random() * 0.5;
      
      // Simulate user activity
      newState.activeUsers = Math.max(1, newState.activeUsers + (Math.random() - 0.5) * 2);
      
      // Simulate sync progress
      if (newState.networkStatus === 'online') {
        newState.syncProgress = Math.min(100, newState.syncProgress + Math.random() * 10);
      }
      
      return newState;
    });
  };

  const updateMetrics = () => {
    setDemoMetrics(prev => ({
      ...prev,
      totalActions: prev.totalActions + Math.floor(Math.random() * 3),
      syncOperations: prev.syncOperations + (Math.random() < 0.3 ? 1 : 0),
      offlineOperations: prev.offlineOperations + (simulationState.networkStatus === 'offline' ? Math.floor(Math.random() * 2) : 0),
      networkRequests: prev.networkRequests + (simulationState.networkStatus === 'online' ? Math.floor(Math.random() * 5) : 0),
      cacheHits: prev.cacheHits + Math.floor(Math.random() * 8),
      errorRate: Math.max(0, Math.min(10, prev.errorRate + (Math.random() - 0.5) * 0.5)),
      averageResponseTime: Math.max(50, Math.min(500, prev.averageResponseTime + (Math.random() - 0.5) * 20)),
      dataTransferred: prev.dataTransferred + Math.random() * 1024
    }));
  };

  const simulateOfflineAction = async () => {
    const actions = [
      { type: 'customer', operation: 'create', data: { name: 'Ahmed Al-Rashid', phone: '+974 1234 5678' } },
      { type: 'vehicle', operation: 'update', data: { id: 'V001', status: 'maintenance' } },
      { type: 'payment', operation: 'create', data: { amount: 1500, currency: 'QAR' } },
      { type: 'agreement', operation: 'update', data: { id: 'A001', status: 'active' } }
    ];
    
    const action = actions[Math.floor(Math.random() * actions.length)];
    await addToSyncQueue(action.type, action.operation as any, action.data, 'normal');
    
    setSimulationState(prev => ({ ...prev, notifications: prev.notifications + 1 }));
    trackUserAction('offline_action_simulated', 'mobile_demo', action);
  };

  const simulateNotification = async () => {
    const notifications = [
      { title: 'Payment Received', body: 'QAR 1,500 payment received from Ahmed Al-Rashid' },
      { title: 'Vehicle Returned', body: 'Toyota Camry (ABC-123) has been returned' },
      { title: 'Maintenance Due', body: 'Honda Accord (XYZ-789) requires maintenance' },
      { title: 'Agreement Expiring', body: 'Agreement #A001 expires in 3 days' }
    ];
    
    const notification = notifications[Math.floor(Math.random() * notifications.length)];
    await sendPushNotification({
      ...notification,
      type: 'info',
      priority: 'normal',
      category: 'demo'
    });
    
    setSimulationState(prev => ({ ...prev, notifications: prev.notifications + 1 }));
    trackUserAction('notification_simulated', 'mobile_demo', notification);
  };

  const simulatePhotoCapture = async () => {
    try {
      // Simulate photo capture without actually accessing camera
      setSimulationState(prev => ({ ...prev, photos: prev.photos + 1 }));
      trackUserAction('photo_capture_simulated', 'mobile_demo');
    } catch (error) {
    }
  };

  const simulateLocationUpdate = async () => {
    try {
      // Simulate location update
      setSimulationState(prev => ({ ...prev, locations: prev.locations + 1 }));
      trackUserAction('location_update_simulated', 'mobile_demo');
    } catch (error) {
    }
  };

  const getNetworkIcon = () => {
    switch (simulationState.networkStatus) {
      case 'online': return <Wifi className="w-4 h-4 text-green-500" />;
      case 'offline': return <WifiOff className="w-4 h-4 text-red-500" />;
      case 'slow': return <Wifi className="w-4 h-4 text-yellow-500" />;
      default: return <Wifi className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      case 'slow': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const OverviewTab = () => (
    <div className="space-y-4">
      {/* Simulation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Activity className="w-5 h-5" />
            {isArabic ? 'تحكم المحاكاة' : 'Simulation Controls'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex gap-2 mb-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Button 
              onClick={simulationState.isRunning ? stopSimulation : startSimulation}
              className="touch-friendly"
            >
              {simulationState.isRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  {isArabic ? 'إيقاف' : 'Stop'}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  {isArabic ? 'تشغيل' : 'Start'}
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={resetSimulation}
              className="touch-friendly"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {isArabic ? 'إعادة تعيين' : 'Reset'}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              {getNetworkIcon()}
              <span className={`text-sm font-medium ${getStatusColor(simulationState.networkStatus)}`}>
                {simulationState.networkStatus === 'online' ? (isArabic ? 'متصل' : 'Online') :
                 simulationState.networkStatus === 'offline' ? (isArabic ? 'غير متصل' : 'Offline') :
                 (isArabic ? 'بطيء' : 'Slow')}
              </span>
            </div>
            
            <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Activity className="w-4 h-4" />
              <span className="text-sm">
                {simulationState.activeUsers} {isArabic ? 'مستخدم نشط' : 'active users'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <TrendingUp className="w-5 h-5" />
            {isArabic ? 'المقاييس الفورية' : 'Real-time Metrics'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className={`flex justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm">{isArabic ? 'البطارية:' : 'Battery:'}</span>
                <span className="text-sm font-medium">{simulationState.batteryLevel.toFixed(0)}%</span>
              </div>
              <Progress value={simulationState.batteryLevel} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className={`flex justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm">{isArabic ? 'استخدام البيانات:' : 'Data Usage:'}</span>
                <span className="text-sm font-medium">{simulationState.dataUsage.toFixed(1)} MB</span>
              </div>
              <Progress value={Math.min(100, simulationState.dataUsage)} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className={`flex justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm">{isArabic ? 'تقدم المزامنة:' : 'Sync Progress:'}</span>
                <span className="text-sm font-medium">{simulationState.syncProgress.toFixed(0)}%</span>
              </div>
              <Progress value={simulationState.syncProgress} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className={`flex justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm">{isArabic ? 'معدل الخطأ:' : 'Error Rate:'}</span>
                <span className="text-sm font-medium">{demoMetrics.errorRate.toFixed(1)}%</span>
              </div>
              <Progress value={demoMetrics.errorRate * 10} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Counters */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Database className="w-5 h-5" />
            {isArabic ? 'عدادات النشاط' : 'Activity Counters'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Bell className="w-4 h-4 text-blue-500" />
              <span className="text-sm">
                {simulationState.notifications} {isArabic ? 'إشعار' : 'notifications'}
              </span>
            </div>
            
            <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Camera className="w-4 h-4 text-green-500" />
              <span className="text-sm">
                {simulationState.photos} {isArabic ? 'صورة' : 'photos'}
              </span>
            </div>
            
            <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="text-sm">
                {simulationState.locations} {isArabic ? 'موقع' : 'locations'}
              </span>
            </div>
            
            <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Sync className="w-4 h-4 text-purple-500" />
              <span className="text-sm">
                {demoMetrics.syncOperations} {isArabic ? 'مزامنة' : 'syncs'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const FeaturesTab = () => (
    <div className="space-y-4">
      {/* Feature Simulation Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Zap className="w-5 h-5" />
            {isArabic ? 'محاكاة الميزات' : 'Feature Simulation'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={simulateOfflineAction}
              className="touch-friendly"
            >
              <Database className="w-4 h-4 mr-2" />
              {isArabic ? 'إجراء محلي' : 'Offline Action'}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={simulateNotification}
              className="touch-friendly"
            >
              <Bell className="w-4 h-4 mr-2" />
              {isArabic ? 'إشعار' : 'Notification'}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={simulatePhotoCapture}
              className="touch-friendly"
            >
              <Camera className="w-4 h-4 mr-2" />
              {isArabic ? 'التقاط صورة' : 'Photo Capture'}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={simulateLocationUpdate}
              className="touch-friendly"
            >
              <MapPin className="w-4 h-4 mr-2" />
              {isArabic ? 'تحديث الموقع' : 'Location Update'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Activity className="w-5 h-5" />
            {isArabic ? 'مقاييس الأداء' : 'Performance Metrics'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className={`flex justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span>{isArabic ? 'إجمالي الإجراءات:' : 'Total Actions:'}</span>
              <span className="font-medium">{demoMetrics.totalActions}</span>
            </div>
            
            <div className={`flex justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span>{isArabic ? 'طلبات الشبكة:' : 'Network Requests:'}</span>
              <span className="font-medium">{demoMetrics.networkRequests}</span>
            </div>
            
            <div className={`flex justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span>{isArabic ? 'إصابات التخزين المؤقت:' : 'Cache Hits:'}</span>
              <span className="font-medium">{demoMetrics.cacheHits}</span>
            </div>
            
            <div className={`flex justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span>{isArabic ? 'متوسط وقت الاستجابة:' : 'Avg Response Time:'}</span>
              <span className="font-medium">{demoMetrics.averageResponseTime.toFixed(0)}ms</span>
            </div>
            
            <div className={`flex justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span>{isArabic ? 'البيانات المنقولة:' : 'Data Transferred:'}</span>
              <span className="font-medium">{(demoMetrics.dataTransferred / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Sync className="w-5 h-5" />
            {isArabic ? 'حالة المزامنة' : 'Sync Status'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className={`flex justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span>{isArabic ? 'العناصر المعلقة:' : 'Pending Items:'}</span>
              <span className="font-medium">{realtimeData.syncStatus.queueSize}</span>
            </div>
            
            <div className={`flex justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span>{isArabic ? 'معدل النجاح:' : 'Success Rate:'}</span>
              <span className="font-medium">{realtimeData.syncStatus.metrics.successRate.toFixed(1)}%</span>
            </div>
            
            <div className={`flex justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span>{isArabic ? 'كفاءة الشبكة:' : 'Network Efficiency:'}</span>
              <span className="font-medium">{realtimeData.syncStatus.metrics.networkEfficiency.toFixed(0)}%</span>
            </div>
            
            <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Badge variant={realtimeData.syncStatus.isOnline ? 'default' : 'destructive'}>
                {realtimeData.syncStatus.isOnline ? 
                  (isArabic ? 'متصل' : 'Online') : 
                  (isArabic ? 'غير متصل' : 'Offline')
                }
              </Badge>
              
              {realtimeData.syncStatus.isSyncing && (
                <Badge variant="secondary">
                  {isArabic ? 'جاري المزامنة' : 'Syncing'}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const AppTab = () => (
    <div className="space-y-4">
      <Alert>
        <Smartphone className="w-4 h-4" />
        <AlertDescription>
          {isArabic ? 
            'هذا عرض توضيحي للتطبيق المحمول مع جميع الميزات المتقدمة' :
            'This is a live demo of the mobile application with all advanced features'
          }
        </AlertDescription>
      </Alert>
      
      <MobileApp />
    </div>
  );

  return (
    <div className={`max-w-6xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className={`flex items-center justify-between mb-6 ${isArabic ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <Smartphone className="w-8 h-8 text-blue-600" />
          <div className={isArabic ? 'text-right' : 'text-left'}>
            <h1 className="text-2xl font-bold">
              {isArabic ? 'عرض توضيحي للتطبيق المحمول' : 'Mobile Application Demo'}
            </h1>
            <p className="text-gray-600">
              {isArabic ? 
                'تطبيق محمول شامل مع إمكانيات العمل دون اتصال والمزامنة الذكية' :
                'Comprehensive mobile app with offline capabilities and intelligent sync'
              }
            </p>
          </div>
        </div>
        
        <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <Badge variant={simulationState.isRunning ? 'default' : 'secondary'}>
            {simulationState.isRunning ? 
              (isArabic ? 'قيد التشغيل' : 'Running') : 
              (isArabic ? 'متوقف' : 'Stopped')
            }
          </Badge>
          
          {getNetworkIcon()}
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
          <TabsTrigger value="app">
            {isArabic ? 'التطبيق' : 'Live App'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          <FeaturesTab />
        </TabsContent>

        <TabsContent value="app" className="mt-6">
          <AppTab />
        </TabsContent>
      </Tabs>

      {/* Footer Stats */}
      <div className="mt-8 grid grid-cols-4 gap-4">
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
    </div>
  );
};

export default MobileDemo;  