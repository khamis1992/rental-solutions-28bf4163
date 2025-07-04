import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Smartphone, 
  Download, 
  Bell, 
  Wifi, 
  WifiOff, 
  Battery, 
  RefreshCw,
  Settings,
  Monitor,
  Zap
} from "lucide-react";

interface PWACapabilities {
  standalone: boolean;
  orientation: string;
  connection: string;
  battery: boolean;
  vibration: boolean;
  geolocation: boolean;
  camera: boolean;
  notifications: boolean;
  backgroundSync: boolean;
  installPrompt: boolean;
}

export const PWASettings: React.FC = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [capabilities, setCapabilities] = useState<PWACapabilities | null>(null);
  const [settings, setSettings] = useState({
    notifications: true,
    backgroundSync: true,
    offlineMode: true,
    autoUpdate: true,
    vibration: true,
    geolocation: true
  });
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Load capabilities from localStorage
    const storedCapabilities = localStorage.getItem('pwa-capabilities');
    if (storedCapabilities) {
      setCapabilities(JSON.parse(storedCapabilities));
    }

    // Check if app is installed
    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);

    // Load settings from localStorage
    const storedSettings = localStorage.getItem('pwa-settings');
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
  }, []);

  const handleSettingChange = (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('pwa-settings', JSON.stringify(newSettings));

    // Handle specific settings
    switch (key) {
      case 'notifications':
        if (value && 'Notification' in window) {
          Notification.requestPermission();
        }
        break;
      case 'vibration':
        if (value && 'vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
        break;
    }

    toast({
      title: language === 'ar' ? 'تم حفظ الإعدادات' : 'Settings Saved',
      description: language === 'ar' ? 'تم تحديث إعدادات التطبيق' : 'App settings updated',
      duration: 3000,
    });
  };

  const handleInstallApp = async () => {
    const installPrompt = (window as any).deferredPrompt;
    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === 'accepted') {
        toast({
          title: language === 'ar' ? 'تم تثبيت التطبيق' : 'App Installed',
          description: language === 'ar' ? 'يمكنك الآن الوصول للتطبيق من الشاشة الرئيسية' : 'You can now access the app from your home screen',
          duration: 5000,
        });
      }
    }
  };

  const handleUpdateApp = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.update();
      toast({
        title: language === 'ar' ? 'جاري البحث عن التحديثات' : 'Checking for Updates',
        description: language === 'ar' ? 'سيتم إعلامك عند توفر تحديثات جديدة' : 'You will be notified when updates are available',
        duration: 3000,
      });
    }
  };

  const clearAppData = () => {
    localStorage.clear();
    sessionStorage.clear();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    toast({
      title: language === 'ar' ? 'تم مسح البيانات' : 'Data Cleared',
      description: language === 'ar' ? 'تم مسح جميع البيانات المحفوظة' : 'All cached data has been cleared',
      duration: 3000,
    });
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* App Status */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Smartphone className={`h-5 w-5 text-blue-500 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {language === 'ar' ? 'حالة التطبيق' : 'App Status'}
          </CardTitle>
          <CardDescription className={language === 'ar' ? 'text-right' : 'text-left'}>
            {language === 'ar' ? 'معلومات حول تثبيت التطبيق وقدراته' : 'Information about app installation and capabilities'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <Monitor className={`h-4 w-4 text-gray-500 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              <span>{language === 'ar' ? 'مثبت كتطبيق' : 'Installed as App'}</span>
            </div>
            <span className={`px-2 py-1 rounded text-sm ${isInstalled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {isInstalled ? (language === 'ar' ? 'نعم' : 'Yes') : (language === 'ar' ? 'لا' : 'No')}
            </span>
          </div>

          {!isInstalled && (
            <Button 
              onClick={handleInstallApp}
              className={`w-full ${language === 'ar' ? 'flex-row-reverse' : ''}`}
              variant="outline"
            >
              <Download className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
            </Button>
          )}

          <div className="flex space-x-2">
            <Button 
              onClick={handleUpdateApp}
              variant="outline"
              className={`flex-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
            >
              <RefreshCw className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'تحديث التطبيق' : 'Update App'}
            </Button>
            <Button 
              onClick={clearAppData}
              variant="outline"
              className={`flex-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
            >
              <Settings className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'مسح البيانات' : 'Clear Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* App Settings */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Settings className={`h-5 w-5 text-blue-500 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {language === 'ar' ? 'إعدادات التطبيق' : 'App Settings'}
          </CardTitle>
          <CardDescription className={language === 'ar' ? 'text-right' : 'text-left'}>
            {language === 'ar' ? 'تخصيص سلوك التطبيق والإشعارات' : 'Customize app behavior and notifications'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <Bell className={`h-4 w-4 text-gray-500 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              <Label htmlFor="notifications" className={language === 'ar' ? 'ml-2' : 'mr-2'}>
                {language === 'ar' ? 'الإشعارات' : 'Notifications'}
              </Label>
            </div>
            <Switch
              id="notifications"
              checked={settings.notifications}
              onCheckedChange={(value) => handleSettingChange('notifications', value)}
            />
          </div>

          <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <Wifi className={`h-4 w-4 text-gray-500 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              <Label htmlFor="backgroundSync" className={language === 'ar' ? 'ml-2' : 'mr-2'}>
                {language === 'ar' ? 'المزامنة في الخلفية' : 'Background Sync'}
              </Label>
            </div>
            <Switch
              id="backgroundSync"
              checked={settings.backgroundSync}
              onCheckedChange={(value) => handleSettingChange('backgroundSync', value)}
            />
          </div>

          <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <WifiOff className={`h-4 w-4 text-gray-500 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              <Label htmlFor="offlineMode" className={language === 'ar' ? 'ml-2' : 'mr-2'}>
                {language === 'ar' ? 'الوضع دون اتصال' : 'Offline Mode'}
              </Label>
            </div>
            <Switch
              id="offlineMode"
              checked={settings.offlineMode}
              onCheckedChange={(value) => handleSettingChange('offlineMode', value)}
            />
          </div>

          <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <RefreshCw className={`h-4 w-4 text-gray-500 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              <Label htmlFor="autoUpdate" className={language === 'ar' ? 'ml-2' : 'mr-2'}>
                {language === 'ar' ? 'التحديث التلقائي' : 'Auto Update'}
              </Label>
            </div>
            <Switch
              id="autoUpdate"
              checked={settings.autoUpdate}
              onCheckedChange={(value) => handleSettingChange('autoUpdate', value)}
            />
          </div>

          <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <Zap className={`h-4 w-4 text-gray-500 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              <Label htmlFor="vibration" className={language === 'ar' ? 'ml-2' : 'mr-2'}>
                {language === 'ar' ? 'الاهتزاز' : 'Vibration'}
              </Label>
            </div>
            <Switch
              id="vibration"
              checked={settings.vibration}
              onCheckedChange={(value) => handleSettingChange('vibration', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Capabilities */}
      {capabilities && (
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <Battery className={`h-5 w-5 text-blue-500 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'قدرات الجهاز' : 'Device Capabilities'}
            </CardTitle>
            <CardDescription className={language === 'ar' ? 'text-right' : 'text-left'}>
              {language === 'ar' ? 'الميزات المتاحة على جهازك' : 'Available features on your device'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${capabilities.notifications ? 'bg-green-500' : 'bg-gray-300'} ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                <span className="text-sm">{language === 'ar' ? 'الإشعارات' : 'Notifications'}</span>
              </div>
              <div className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${capabilities.backgroundSync ? 'bg-green-500' : 'bg-gray-300'} ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                <span className="text-sm">{language === 'ar' ? 'المزامنة' : 'Background Sync'}</span>
              </div>
              <div className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${capabilities.geolocation ? 'bg-green-500' : 'bg-gray-300'} ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                <span className="text-sm">{language === 'ar' ? 'الموقع' : 'Geolocation'}</span>
              </div>
              <div className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${capabilities.camera ? 'bg-green-500' : 'bg-gray-300'} ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                <span className="text-sm">{language === 'ar' ? 'الكاميرا' : 'Camera'}</span>
              </div>
              <div className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${capabilities.vibration ? 'bg-green-500' : 'bg-gray-300'} ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                <span className="text-sm">{language === 'ar' ? 'الاهتزاز' : 'Vibration'}</span>
              </div>
              <div className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${capabilities.battery ? 'bg-green-500' : 'bg-gray-300'} ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                <span className="text-sm">{language === 'ar' ? 'البطارية' : 'Battery'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PWASettings;