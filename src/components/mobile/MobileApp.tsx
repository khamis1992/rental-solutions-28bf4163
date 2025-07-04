import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Camera, 
  MapPin, 
  Bell, 
  Fingerprint,
  Download,
  Upload,
  RotateCcw,
  Battery,
  Signal,
  Globe,
  Settings,
  User,
  Car,
  CreditCard,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  Pause,
  Home,
  Search,
  Menu,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Star,
  Heart,
  Share,
  Bookmark,
  Filter,
  Grid,
  List,
  Maximize,
  Minimize,
  Trash2
} from 'lucide-react';
import { 
  mobileAppService, 
  SyncStatus, 
  DeviceInfo, 
  PushNotification,
  LocationData,
  CameraCapture,
  trackScreenView,
  trackUserAction,
  storeOfflineData,
  triggerSync,
  sendPushNotification,
  getCurrentLocation,
  capturePhoto,
  authenticateWithBiometrics
} from '@/services/mobile-app-service';

interface MobileAppProps {
  className?: string;
}

const MobileApp: React.FC<MobileAppProps> = ({ className }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<CameraCapture[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    initializeMobileApp();
    setupEventListeners();
    
    // Track initial screen view
    trackScreenView('mobile_app_home');
    
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    // Update sync status periodically
    const interval = setInterval(() => {
      updateSyncStatus();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const initializeMobileApp = async () => {
    try {
      setIsLoading(true);
      
      // Get device info
      const device = mobileAppService.getDeviceInfo();
      setDeviceInfo(device);
      
      // Get sync status
      updateSyncStatus();
      
      // Get notifications
      const notifs = mobileAppService.getNotifications();
      setNotifications(notifs);
      
      // Check biometric support
      const biometrics = device?.capabilities.biometrics || [];
      setBiometricSupported(biometrics.length > 0);
      
      // Check notification permission
      if ('Notification' in window) {
        setPushPermission(Notification.permission);
      }
      
      trackUserAction('app_initialized', 'mobile_app_home');
      
    } catch (error) {
      import('@/lib/errors/error-logger').then(({ errorLogger }) => {
        errorLogger.logError(error as Error, {
          context: 'MobileApp.initializeMobileApp',
          action: 'app_initialization'
        });
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setupEventListeners = () => {
    // Network status
    const handleOnline = () => {
      setIsOnline(true);
      trackUserAction('network_online', activeTab);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      trackUserAction('network_offline', activeTab);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  };

  const cleanup = () => {
    // Cleanup any resources
  };

  const updateSyncStatus = () => {
    const status = mobileAppService.getSyncStatus();
    setSyncStatus(status);
  };

  const handleSync = async () => {
    try {
      trackUserAction('manual_sync_triggered', activeTab);
      await triggerSync();
      updateSyncStatus();
    } catch (error) {
      import('@/lib/errors/error-logger').then(({ errorLogger }) => {
        errorLogger.logError(error as Error, {
          context: 'MobileApp.handleSync',
          action: 'manual_sync'
        });
      });
    }
  };

  const handleStoreOfflineData = async () => {
    try {
      const sampleData = {
        id: Date.now(),
        name: 'Sample Customer',
        email: 'customer@example.com',
        phone: '+974 1234 5678',
        timestamp: Date.now()
      };
      
      await storeOfflineData('customer', sampleData, 'create');
      updateSyncStatus();
      trackUserAction('offline_data_stored', activeTab);
      
    } catch (error) {
      import('@/lib/errors/error-logger').then(({ errorLogger }) => {
        errorLogger.logError(error as Error, {
          context: 'MobileApp.handleStoreOfflineData',
          action: 'offline_data_storage'
        });
      });
    }
  };

  const handleSendNotification = async () => {
    try {
      await sendPushNotification({
        title: isArabic ? 'إشعار تجريبي' : 'Demo Notification',
        body: isArabic ? 
          'هذا إشعار تجريبي من تطبيق الحلول الإيجارية' :
          'This is a demo notification from Rental Solutions app',
        type: 'info',
        priority: 'normal',
        category: 'demo'
      });
      
      const notifs = mobileAppService.getNotifications();
      setNotifications(notifs);
      trackUserAction('notification_sent', activeTab);
      
    } catch (error) {
      import('@/lib/errors/error-logger').then(({ errorLogger }) => {
        errorLogger.logError(error as Error, {
          context: 'MobileApp.handleSendNotification',
          action: 'push_notification'
        });
      });
    }
  };

  const handleGetLocation = async () => {
    try {
      trackUserAction('location_requested', activeTab);
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      trackUserAction('location_obtained', activeTab, { 
        accuracy: location.accuracy 
      });
      
    } catch (error) {
      import('@/lib/errors/error-logger').then(({ errorLogger }) => {
        errorLogger.logError(error as Error, {
          context: 'MobileApp.handleGetLocation',
          action: 'location_request'
        });
      });
      trackUserAction('location_error', activeTab, { 
        error: (error as Error).message 
      });
    }
  };

  const handleCapturePhoto = async () => {
    try {
      trackUserAction('photo_capture_requested', activeTab);
      const photo = await capturePhoto();
      setCapturedPhotos(prev => [...prev, photo]);
      trackUserAction('photo_captured', activeTab, {
        width: photo.metadata.width,
        height: photo.metadata.height
      });
      
    } catch (error) {
      import('@/lib/errors/error-logger').then(({ errorLogger }) => {
        errorLogger.logError(error as Error, {
          context: 'MobileApp.handleCapturePhoto',
          action: 'photo_capture'
        });
      });
      trackUserAction('photo_capture_error', activeTab, { 
        error: (error as Error).message 
      });
    }
  };

  const handleBiometricAuth = async () => {
    try {
      trackUserAction('biometric_auth_requested', activeTab);
      const success = await authenticateWithBiometrics();
      
      if (success) {
        trackUserAction('biometric_auth_success', activeTab);
        alert(isArabic ? 'تم التحقق بنجاح!' : 'Authentication successful!');
      } else {
        trackUserAction('biometric_auth_failed', activeTab);
        alert(isArabic ? 'فشل التحقق' : 'Authentication failed');
      }
      
    } catch (error) {
      import('@/lib/errors/error-logger').then(({ errorLogger }) => {
        errorLogger.logError(error as Error, {
          context: 'MobileApp.handleBiometricAuth',
          action: 'biometric_authentication'
        });
      });
      trackUserAction('biometric_auth_error', activeTab, { 
        error: (error as Error).message 
      });
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    trackScreenView(`mobile_app_${tab}`);
  };

  const getConnectionIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4 text-red-500" />;
    
    // @ts-ignore - Connection API is experimental
    const connection = navigator.connection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      if (effectiveType === '4g') return <Signal className="w-4 h-4 text-green-500" />;
      if (effectiveType === '3g') return <Signal className="w-4 h-4 text-yellow-500" />;
      if (effectiveType === '2g') return <Signal className="w-4 h-4 text-orange-500" />;
    }
    
    return <Wifi className="w-4 h-4 text-green-500" />;
  };

  const getBatteryLevel = () => {
    // @ts-ignore - Battery API is experimental
    if ('getBattery' in navigator) {
      // Would return actual battery level in real implementation
      return 85;
    }
    return null;
  };

  const MobileHeader = () => (
    <div className={`flex items-center justify-between p-4 bg-blue-600 text-white ${isArabic ? 'flex-row-reverse' : ''}`}>
      <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
        <Smartphone className="w-6 h-6" />
        <h1 className="text-lg font-semibold">
          {isArabic ? 'الحلول الإيجارية' : 'Rental Solutions'}
        </h1>
      </div>
      
      <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
        {getConnectionIcon()}
        
        {getBatteryLevel() && (
          <div className={`flex items-center gap-1 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Battery className="w-4 h-4" />
            <span className="text-xs">{getBatteryLevel()}%</span>
          </div>
        )}
        
        <Badge variant="secondary" className="text-xs">
          {deviceInfo?.platform || 'web'}
        </Badge>
      </div>
    </div>
  );

  const SyncStatusCard = () => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className={`flex items-center justify-between mb-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <RotateCcw className={`w-5 h-5 ${syncStatus?.syncInProgress ? 'animate-spin' : ''}`} />
            <span className="font-medium">
              {isArabic ? 'حالة المزامنة' : 'Sync Status'}
            </span>
          </div>
          
          <Badge variant={isOnline ? 'default' : 'destructive'}>
            {isOnline ? (isArabic ? 'متصل' : 'Online') : (isArabic ? 'غير متصل' : 'Offline')}
          </Badge>
        </div>
        
        {syncStatus && (
          <div className="space-y-2">
            <div className={`flex justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span>{isArabic ? 'العناصر المعلقة:' : 'Pending items:'}</span>
              <span className="font-medium">{syncStatus.pendingItems}</span>
            </div>
            
            <div className={`flex justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span>{isArabic ? 'آخر مزامنة:' : 'Last sync:'}</span>
              <span className="font-medium">
                {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleTimeString() : 'Never'}
              </span>
            </div>
            
            {syncStatus.syncInProgress && (
              <div>
                <div className={`flex justify-between text-sm mb-1 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <span>{isArabic ? 'التقدم:' : 'Progress:'}</span>
                  <span>{syncStatus.syncProgress.toFixed(0)}%</span>
                </div>
                <Progress value={syncStatus.syncProgress} className="h-2" />
              </div>
            )}
            
            {syncStatus.errors.length > 0 && (
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  {syncStatus.errors.length} {isArabic ? 'أخطاء في المزامنة' : 'sync errors'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        
        <div className={`flex gap-2 mt-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <Button 
            size="sm" 
            onClick={handleSync}
            disabled={syncStatus?.syncInProgress || !isOnline}
            className="touch-friendly"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {isArabic ? 'مزامنة' : 'Sync'}
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleStoreOfflineData}
            className="touch-friendly"
          >
            <Download className="w-4 h-4 mr-2" />
            {isArabic ? 'حفظ محلي' : 'Store Offline'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const DeviceInfoCard = () => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <Smartphone className="w-5 h-5" />
          {isArabic ? 'معلومات الجهاز' : 'Device Information'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {deviceInfo ? (
          <div className="space-y-2">
            <div className={`flex justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span>{isArabic ? 'المنصة:' : 'Platform:'}</span>
              <span className="font-medium capitalize">{deviceInfo.platform}</span>
            </div>
            
            <div className={`flex justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span>{isArabic ? 'الطراز:' : 'Model:'}</span>
              <span className="font-medium">{deviceInfo.model}</span>
            </div>
            
            <div className={`flex justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span>{isArabic ? 'الإصدار:' : 'Version:'}</span>
              <span className="font-medium">{deviceInfo.version}</span>
            </div>
            
            <div className={`flex justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span>{isArabic ? 'الشاشة:' : 'Screen:'}</span>
              <span className="font-medium">
                {deviceInfo.screenDimensions.width}x{deviceInfo.screenDimensions.height}
              </span>
            </div>
            
            <div className={`flex justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span>{isArabic ? 'لوحي:' : 'Tablet:'}</span>
              <span className="font-medium">
                {deviceInfo.isTablet ? (isArabic ? 'نعم' : 'Yes') : (isArabic ? 'لا' : 'No')}
              </span>
            </div>
            
            <div className="mt-3">
              <p className="text-sm font-medium mb-2">
                {isArabic ? 'الإمكانيات:' : 'Capabilities:'}
              </p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(deviceInfo.capabilities).map(([key, value]) => (
                  <Badge 
                    key={key} 
                    variant={value ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {key}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">
            {isArabic ? 'جاري تحميل معلومات الجهاز...' : 'Loading device information...'}
          </p>
        )}
      </CardContent>
    </Card>
  );

  const NotificationsCard = () => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <Bell className="w-5 h-5" />
          {isArabic ? 'الإشعارات' : 'Notifications'}
          {notifications.filter(n => !n.read).length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {notifications.filter(n => !n.read).length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`flex gap-2 mb-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <Button 
            size="sm"
            onClick={handleSendNotification}
            disabled={pushPermission !== 'granted'}
            className="touch-friendly"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isArabic ? 'إرسال إشعار' : 'Send Notification'}
          </Button>
          
          {pushPermission !== 'granted' && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => Notification.requestPermission().then(setPushPermission)}
              className="touch-friendly"
            >
              <Bell className="w-4 h-4 mr-2" />
              {isArabic ? 'تفعيل الإشعارات' : 'Enable Notifications'}
            </Button>
          )}
        </div>
        
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-sm">
            {isArabic ? 'لا توجد إشعارات' : 'No notifications'}
          </p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {notifications.slice(0, 5).map(notification => (
              <div 
                key={notification.id}
                className={`p-2 border rounded text-sm ${notification.read ? 'bg-gray-50' : 'bg-blue-50'}`}
              >
                <div className={`flex justify-between items-start ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <div className={isArabic ? 'text-right' : 'text-left'}>
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-gray-600">{notification.body}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {notification.type}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const LocationCard = () => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <MapPin className="w-5 h-5" />
          {isArabic ? 'الموقع' : 'Location'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleGetLocation}
          className="w-full touch-friendly mb-3"
        >
          <MapPin className="w-4 h-4 mr-2" />
          {isArabic ? 'الحصول على الموقع' : 'Get Current Location'}
        </Button>
        
        {currentLocation && (
          <div className="space-y-2">
            <div className={`flex justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span>{isArabic ? 'خط العرض:' : 'Latitude:'}</span>
              <span className="font-medium">{currentLocation.latitude.toFixed(6)}</span>
            </div>
            
            <div className={`flex justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span>{isArabic ? 'خط الطول:' : 'Longitude:'}</span>
              <span className="font-medium">{currentLocation.longitude.toFixed(6)}</span>
            </div>
            
            <div className={`flex justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span>{isArabic ? 'الدقة:' : 'Accuracy:'}</span>
              <span className="font-medium">{currentLocation.accuracy.toFixed(0)}m</span>
            </div>
            
            {currentLocation.address && (
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <p className="text-sm font-medium">
                  {isArabic ? 'العنوان:' : 'Address:'}
                </p>
                <p className="text-sm text-gray-600">
                  {isArabic && currentLocation.address.arabicAddress ? 
                    currentLocation.address.arabicAddress :
                    `${currentLocation.address.street}, ${currentLocation.address.city}, ${currentLocation.address.country}`
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const CameraCard = () => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <Camera className="w-5 h-5" />
          {isArabic ? 'الكاميرا' : 'Camera'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleCapturePhoto}
          className="w-full touch-friendly mb-3"
          disabled={!deviceInfo?.capabilities.camera}
        >
          <Camera className="w-4 h-4 mr-2" />
          {isArabic ? 'التقاط صورة' : 'Capture Photo'}
        </Button>
        
        {capturedPhotos.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">
              {isArabic ? 'الصور المحفوظة:' : 'Captured Photos:'}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {capturedPhotos.slice(-6).map(photo => (
                <div key={photo.id} className="aspect-square bg-gray-100 rounded overflow-hidden">
                  <img 
                    src={photo.uri} 
                    alt="Captured" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const BiometricCard = () => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <Fingerprint className="w-5 h-5" />
          {isArabic ? 'المصادقة البيومترية' : 'Biometric Authentication'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleBiometricAuth}
          className="w-full touch-friendly"
          disabled={!biometricSupported}
        >
          <Fingerprint className="w-4 h-4 mr-2" />
          {isArabic ? 'التحقق بالبصمة' : 'Authenticate with Biometrics'}
        </Button>
        
        {!biometricSupported && (
          <p className="text-sm text-gray-500 mt-2">
            {isArabic ? 
              'المصادقة البيومترية غير مدعومة على هذا الجهاز' :
              'Biometric authentication not supported on this device'
            }
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 animate-pulse" />
          <span>{isArabic ? 'جاري تحميل التطبيق المحمول...' : 'Loading mobile app...'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden ${className}`}>
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 text-xs">
            <TabsTrigger value="dashboard">
              {isArabic ? 'الرئيسية' : 'Dashboard'}
            </TabsTrigger>
            <TabsTrigger value="features">
              {isArabic ? 'الميزات' : 'Features'}
            </TabsTrigger>
            <TabsTrigger value="sync">
              {isArabic ? 'المزامنة' : 'Sync'}
            </TabsTrigger>
            <TabsTrigger value="settings">
              {isArabic ? 'الإعدادات' : 'Settings'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 mt-4">
            <SyncStatusCard />
            <NotificationsCard />
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <Home className="w-5 h-5" />
                  {isArabic ? 'إجراءات سريعة' : 'Quick Actions'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="touch-friendly">
                    <Car className="w-4 h-4 mr-2" />
                    {isArabic ? 'المركبات' : 'Vehicles'}
                  </Button>
                  <Button variant="outline" size="sm" className="touch-friendly">
                    <User className="w-4 h-4 mr-2" />
                    {isArabic ? 'العملاء' : 'Customers'}
                  </Button>
                  <Button variant="outline" size="sm" className="touch-friendly">
                    <FileText className="w-4 h-4 mr-2" />
                    {isArabic ? 'العقود' : 'Agreements'}
                  </Button>
                  <Button variant="outline" size="sm" className="touch-friendly">
                    <CreditCard className="w-4 h-4 mr-2" />
                    {isArabic ? 'المدفوعات' : 'Payments'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-4 mt-4">
            <LocationCard />
            <CameraCard />
            <BiometricCard />
          </TabsContent>

          <TabsContent value="sync" className="space-y-4 mt-4">
            <SyncStatusCard />
            
            {/* Offline Data Management */}
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <Download className="w-5 h-5" />
                  {isArabic ? 'إدارة البيانات المحلية' : 'Offline Data Management'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className={`flex justify-between items-center ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm">
                      {isArabic ? 'البيانات المحفوظة محلياً' : 'Locally stored data'}
                    </span>
                    <Badge variant="outline">
                      {syncStatus?.pendingItems || 0} {isArabic ? 'عنصر' : 'items'}
                    </Badge>
                  </div>
                  
                  <div className={`flex gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <Button size="sm" variant="outline" className="touch-friendly">
                      <Eye className="w-4 h-4 mr-2" />
                      {isArabic ? 'عرض البيانات' : 'View Data'}
                    </Button>
                    <Button size="sm" variant="outline" className="touch-friendly">
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isArabic ? 'مسح البيانات' : 'Clear Data'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <DeviceInfoCard />
            
            {/* App Settings */}
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <Settings className="w-5 h-5" />
                  {isArabic ? 'إعدادات التطبيق' : 'App Settings'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className={`flex justify-between items-center ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm">
                      {isArabic ? 'الوضع المحلي' : 'Offline Mode'}
                    </span>
                    <Badge variant={isOnline ? 'destructive' : 'default'}>
                      {isOnline ? (isArabic ? 'معطل' : 'Disabled') : (isArabic ? 'مفعل' : 'Enabled')}
                    </Badge>
                  </div>
                  
                  <div className={`flex justify-between items-center ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm">
                      {isArabic ? 'الإشعارات' : 'Notifications'}
                    </span>
                    <Badge variant={pushPermission === 'granted' ? 'default' : 'secondary'}>
                      {pushPermission === 'granted' ? 
                        (isArabic ? 'مفعلة' : 'Enabled') : 
                        (isArabic ? 'معطلة' : 'Disabled')
                      }
                    </Badge>
                  </div>
                  
                  <div className={`flex justify-between items-center ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm">
                      {isArabic ? 'المصادقة البيومترية' : 'Biometric Auth'}
                    </span>
                    <Badge variant={biometricSupported ? 'default' : 'secondary'}>
                      {biometricSupported ? 
                        (isArabic ? 'مدعومة' : 'Supported') : 
                        (isArabic ? 'غير مدعومة' : 'Not Supported')
                      }
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MobileApp;  