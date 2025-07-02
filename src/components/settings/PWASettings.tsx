
import { usePWA } from '@/hooks/use-pwa';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Switch } from '@/components/ui/switch';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Bell, 
  WifiOff, 
  RefreshCw, 
  Trash2, 
  Smartphone,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';

export const PWASettings: React.FC = () => {
  const {
    isInstalled,
    isOffline,
    canInstall,
    notificationPermission,
    hasPendingSync,
    updateAvailable,
    installPWA,
    requestNotificationPermission,
    updatePWA,
    syncOfflineData,
    clearCache,
    backgroundSyncService
  } = usePWA();

  const queueStatus = backgroundSyncService.getQueueStatus();

  return (
    <div className="space-y-6">
      {/* Installation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            App Installation
          </CardTitle>
          <CardDescription>
            Install the app for offline access and better performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isInstalled ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                App is installed and ready to use offline
              </AlertDescription>
            </Alert>
          ) : canInstall ? (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Install the app to your device for the best experience
                </AlertDescription>
              </Alert>
              <Button onClick={installPWA} className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                Install App
              </Button>
            </div>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                App installation is not available in this browser
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Get notified about important updates and reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Notification Status</Label>
              <p className="text-sm text-muted-foreground">
                Current permission: {' '}
                <Badge variant={
                  notificationPermission === 'granted' ? 'default' :
                  notificationPermission === 'denied' ? 'destructive' :
                  'secondary'
                }>
                  {notificationPermission}
                </Badge>
              </p>
            </div>
            {notificationPermission !== 'granted' && (
              <Button 
                onClick={requestNotificationPermission}
                variant="outline"
              >
                Enable Notifications
              </Button>
            )}
          </div>

          {notificationPermission === 'granted' && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch id="payment-notifications" defaultChecked />
                <Label htmlFor="payment-notifications">Payment reminders</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="agreement-notifications" defaultChecked />
                <Label htmlFor="agreement-notifications">Agreement expiration alerts</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="maintenance-notifications" defaultChecked />
                <Label htmlFor="maintenance-notifications">Maintenance schedules</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="fine-notifications" defaultChecked />
                <Label htmlFor="fine-notifications">Traffic fine alerts</Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Offline Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiOff className="w-5 h-5" />
            Offline Data
          </CardTitle>
          <CardDescription>
            Manage data stored for offline access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Connection Status</p>
              <p className="text-sm text-muted-foreground">
                {isOffline ? (
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle className="w-3 h-3" />
                    Offline
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    Online
                  </span>
                )}
              </p>
            </div>
          </div>

          {queueStatus.count > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {queueStatus.count} items waiting to sync
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={syncOfflineData}
              variant="outline"
              disabled={!hasPendingSync || isOffline}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Now
            </Button>
            <Button 
              onClick={() => backgroundSyncService.clearQueue()}
              variant="outline"
              disabled={queueStatus.count === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Queue
            </Button>
          </div>

          <div className="pt-4 border-t">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Cached Data</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Clear cached data to free up storage space. You'll need to be online to access this data again.
                </p>
                <Button 
                  onClick={clearCache}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Cache
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Updates */}
      {updateAvailable && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Update Available
            </CardTitle>
            <CardDescription>
              A new version of the app is ready to install
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={updatePWA} className="w-full sm:w-auto">
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* PWA Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            PWA Features
          </CardTitle>
          <CardDescription>
            Progressive Web App capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Works offline with cached data</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Installable on all devices</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Push notifications for important updates</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Background sync for offline changes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Automatic updates</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Add default export
export default PWASettings;