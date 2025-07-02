import { performanceAnalytics } from './performance-analytics';
import { securityService } from './security-service';

export interface MobileAppConfig {
  platform: 'ios' | 'android' | 'web';
  version: string;
  buildNumber: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    offlineMode: boolean;
    pushNotifications: boolean;
    biometrics: boolean;
    camera: boolean;
    gps: boolean;
    nfc: boolean;
    bluetooth: boolean;
  };
  sync: {
    interval: number; // in milliseconds
    batchSize: number;
    retryAttempts: number;
    conflictResolution: 'client' | 'server' | 'manual';
  };
  storage: {
    maxSize: number; // in MB
    encryptionEnabled: boolean;
    compressionEnabled: boolean;
  };
}

export interface OfflineData {
  id: string;
  type: 'customer' | 'agreement' | 'vehicle' | 'payment' | 'document';
  data: any;
  timestamp: number;
  action: 'create' | 'update' | 'delete';
  synced: boolean;
  syncAttempts: number;
  lastSyncAttempt?: number;
  conflicts?: DataConflict[];
}

export interface DataConflict {
  id: string;
  field: string;
  localValue: any;
  serverValue: any;
  timestamp: number;
  resolved: boolean;
  resolution?: 'local' | 'server' | 'merge';
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  type: 'info' | 'warning' | 'error' | 'success' | 'reminder' | 'alert';
  priority: 'low' | 'normal' | 'high' | 'critical';
  category: string;
  actions?: NotificationAction[];
  scheduled?: number;
  delivered: boolean;
  read: boolean;
  timestamp: number;
}

export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
  type: 'button' | 'input';
  destructive?: boolean;
}

export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  version: string;
  model: string;
  manufacturer: string;
  deviceId: string;
  appVersion: string;
  buildNumber: string;
  isTablet: boolean;
  hasNotch: boolean;
  screenDimensions: {
    width: number;
    height: number;
    scale: number;
  };
  capabilities: {
    biometrics: BiometricType[];
    camera: boolean;
    gps: boolean;
    nfc: boolean;
    bluetooth: boolean;
    cellular: boolean;
    wifi: boolean;
  };
}

export interface BiometricType {
  type: 'fingerprint' | 'face' | 'iris' | 'voice';
  available: boolean;
  enrolled: boolean;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    arabicAddress?: string;
  };
}

export interface CameraCapture {
  id: string;
  type: 'photo' | 'video' | 'document';
  uri: string;
  base64?: string;
  metadata: {
    width: number;
    height: number;
    fileSize: number;
    mimeType: string;
    timestamp: number;
    location?: LocationData;
  };
  processed: boolean;
  uploaded: boolean;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: number;
  pendingItems: number;
  syncInProgress: boolean;
  syncProgress: number; // 0-100
  errors: SyncError[];
  nextSync: number;
}

export interface SyncError {
  id: string;
  type: string;
  message: string;
  timestamp: number;
  retryCount: number;
  resolved: boolean;
}

export interface MobileAnalytics {
  sessionId: string;
  sessionStart: number;
  sessionDuration: number;
  screenViews: ScreenView[];
  userActions: UserAction[];
  performance: PerformanceMetric[];
  crashes: CrashReport[];
  networkUsage: NetworkMetric[];
}

export interface ScreenView {
  screen: string;
  timestamp: number;
  duration: number;
  parameters?: any;
}

export interface UserAction {
  action: string;
  screen: string;
  timestamp: number;
  parameters?: any;
  duration?: number;
}

export interface PerformanceMetric {
  metric: string;
  value: number;
  timestamp: number;
  screen?: string;
}

export interface CrashReport {
  id: string;
  timestamp: number;
  error: string;
  stackTrace: string;
  deviceInfo: DeviceInfo;
  appState: any;
  userActions: UserAction[];
}

export interface NetworkMetric {
  timestamp: number;
  type: 'wifi' | 'cellular' | 'none';
  strength: number; // 0-100
  bytesReceived: number;
  bytesSent: number;
  requestCount: number;
  errorCount: number;
}

class MobileAppService {
  private config: MobileAppConfig;
  private offlineData: Map<string, OfflineData> = new Map();
  private notifications: PushNotification[] = [];
  private deviceInfo: DeviceInfo | null = null;
  private syncStatus: SyncStatus;
  private analytics: MobileAnalytics;
  private isInitialized = false;

  constructor(config?: Partial<MobileAppConfig>) {
    this.config = {
      platform: 'web', // Will be detected at runtime
      version: '1.0.0',
      buildNumber: '1',
      environment: 'development',
      features: {
        offlineMode: true,
        pushNotifications: true,
        biometrics: true,
        camera: true,
        gps: true,
        nfc: false,
        bluetooth: false
      },
      sync: {
        interval: 30000, // 30 seconds
        batchSize: 50,
        retryAttempts: 3,
        conflictResolution: 'manual'
      },
      storage: {
        maxSize: 100, // 100MB
        encryptionEnabled: true,
        compressionEnabled: true
      },
      ...config
    };

    this.syncStatus = {
      isOnline: navigator.onLine,
      lastSync: 0,
      pendingItems: 0,
      syncInProgress: false,
      syncProgress: 0,
      errors: [],
      nextSync: Date.now() + this.config.sync.interval
    };

    this.analytics = {
      sessionId: this.generateId(),
      sessionStart: Date.now(),
      sessionDuration: 0,
      screenViews: [],
      userActions: [],
      performance: [],
      crashes: [],
      networkUsage: []
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Detect device information
      await this.detectDeviceInfo();
      
      // Initialize offline storage
      await this.initializeOfflineStorage();
      
      // Setup network monitoring
      this.setupNetworkMonitoring();
      
      // Initialize push notifications
      if (this.config.features.pushNotifications) {
        await this.initializePushNotifications();
      }
      
      // Start sync service
      this.startSyncService();
      
      // Initialize analytics
      this.initializeAnalytics();
      
      this.isInitialized = true;
      
      this.logEvent('app_initialized', {
        platform: this.config.platform,
        version: this.config.version,
        features: this.config.features
      });
      
    } catch (error) {
      console.error('Failed to initialize mobile app service:', error);
      this.reportCrash(error as Error);
    }
  }

  private async detectDeviceInfo(): Promise<void> {
    // In a real React Native app, this would use react-native-device-info
    this.deviceInfo = {
      platform: this.detectPlatform(),
      version: this.detectOSVersion(),
      model: this.detectDeviceModel(),
      manufacturer: this.detectManufacturer(),
      deviceId: this.generateDeviceId(),
      appVersion: this.config.version,
      buildNumber: this.config.buildNumber,
      isTablet: this.detectTablet(),
      hasNotch: this.detectNotch(),
      screenDimensions: {
        width: window.screen.width,
        height: window.screen.height,
        scale: window.devicePixelRatio || 1
      },
      capabilities: {
        biometrics: await this.detectBiometrics(),
        camera: await this.detectCamera(),
        gps: await this.detectGPS(),
        nfc: await this.detectNFC(),
        bluetooth: await this.detectBluetooth(),
        cellular: await this.detectCellular(),
        wifi: await this.detectWiFi()
      }
    };
  }

  private detectPlatform(): 'ios' | 'android' | 'web' {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return 'ios';
    } else if (userAgent.includes('android')) {
      return 'android';
    }
    return 'web';
  }

  private detectOSVersion(): string {
    // Simplified version detection
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(?:Android|iPhone OS|CPU OS) ([\d_\.]+)/);
    return match ? match[1].replace(/_/g, '.') : 'unknown';
  }

  private detectDeviceModel(): string {
    // Simplified model detection
    const userAgent = navigator.userAgent;
    if (userAgent.includes('iPhone')) {
      return 'iPhone';
    } else if (userAgent.includes('iPad')) {
      return 'iPad';
    } else if (userAgent.includes('Android')) {
      return 'Android Device';
    }
    return 'Unknown Device';
  }

  private detectManufacturer(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('apple')) return 'Apple';
    if (userAgent.includes('samsung')) return 'Samsung';
    if (userAgent.includes('huawei')) return 'Huawei';
    if (userAgent.includes('xiaomi')) return 'Xiaomi';
    return 'Unknown';
  }

  private generateDeviceId(): string {
    // In production, use a proper device ID
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private detectTablet(): boolean {
    return window.screen.width >= 768;
  }

  private detectNotch(): boolean {
    // Simplified notch detection
    return window.screen.height / window.screen.width > 2;
  }

  private async detectBiometrics(): Promise<BiometricType[]> {
    const biometrics: BiometricType[] = [];
    
    // Check for Web Authentication API (WebAuthn)
    if (window.PublicKeyCredential) {
      biometrics.push({
        type: 'fingerprint',
        available: true,
        enrolled: false // Would need to check actual enrollment
      });
    }
    
    return biometrics;
  }

  private async detectCamera(): Promise<boolean> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput');
    } catch {
      return false;
    }
  }

  private async detectGPS(): Promise<boolean> {
    return 'geolocation' in navigator;
  }

  private async detectNFC(): Promise<boolean> {
    return 'NDEFReader' in window;
  }

  private async detectBluetooth(): Promise<boolean> {
    return 'bluetooth' in navigator;
  }

  private async detectCellular(): Promise<boolean> {
    // @ts-ignore - Connection API is experimental
    return 'connection' in navigator && navigator.connection?.type === 'cellular';
  }

  private async detectWiFi(): Promise<boolean> {
    // @ts-ignore - Connection API is experimental
    return 'connection' in navigator && navigator.connection?.type === 'wifi';
  }

  private async initializeOfflineStorage(): Promise<void> {
    try {
      // Initialize IndexedDB for offline storage
      if ('indexedDB' in window) {
        // In a real implementation, use a library like Dexie.js
        console.log('IndexedDB available for offline storage');
      }
      
      // Load existing offline data
      await this.loadOfflineData();
      
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
    }
  }

  private async loadOfflineData(): Promise<void> {
    try {
      // In a real implementation, load from IndexedDB
      const storedData = localStorage.getItem('offline_data');
      if (storedData) {
        const data = JSON.parse(storedData);
        data.forEach((item: OfflineData) => {
          this.offlineData.set(item.id, item);
        });
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  }

  private setupNetworkMonitoring(): void {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.syncStatus.isOnline = true;
      this.logEvent('network_online');
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      this.syncStatus.isOnline = false;
      this.logEvent('network_offline');
    });

    // Monitor network quality
    // @ts-ignore - Connection API is experimental
    if ('connection' in navigator) {
      // @ts-ignore
      navigator.connection.addEventListener('change', () => {
        this.recordNetworkMetric();
      });
    }
  }

  private async initializePushNotifications(): Promise<void> {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Push notifications enabled');
          this.logEvent('notifications_enabled');
        }
      }
      
      // In a real React Native app, use @react-native-firebase/messaging
      // or @react-native-async-storage/async-storage
      
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  private startSyncService(): void {
    // Start periodic sync
    setInterval(() => {
      if (this.syncStatus.isOnline && !this.syncStatus.syncInProgress) {
        this.triggerSync();
      }
    }, this.config.sync.interval);
  }

  private initializeAnalytics(): void {
    // Track session duration
    setInterval(() => {
      this.analytics.sessionDuration = Date.now() - this.analytics.sessionStart;
    }, 1000);

    // Track page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.logEvent('app_backgrounded');
      } else {
        this.logEvent('app_foregrounded');
      }
    });
  }

  // Public API methods
  async storeOfflineData(type: string, data: any, action: 'create' | 'update' | 'delete' = 'create'): Promise<string> {
    const id = this.generateId();
    const offlineItem: OfflineData = {
      id,
      type: type as any,
      data,
      timestamp: Date.now(),
      action,
      synced: false,
      syncAttempts: 0
    };

    this.offlineData.set(id, offlineItem);
    this.syncStatus.pendingItems = this.offlineData.size;
    
    // Save to local storage
    await this.saveOfflineData();
    
    this.logEvent('data_stored_offline', { type, action });
    
    return id;
  }

  async getOfflineData(type?: string): Promise<OfflineData[]> {
    const data = Array.from(this.offlineData.values());
    return type ? data.filter(item => item.type === type) : data;
  }

  async triggerSync(): Promise<void> {
    if (this.syncStatus.syncInProgress || !this.syncStatus.isOnline) {
      return;
    }

    this.syncStatus.syncInProgress = true;
    this.syncStatus.syncProgress = 0;
    
    try {
      const pendingItems = Array.from(this.offlineData.values()).filter(item => !item.synced);
      const totalItems = pendingItems.length;
      
      if (totalItems === 0) {
        this.syncStatus.syncInProgress = false;
        return;
      }

      this.logEvent('sync_started', { pendingItems: totalItems });
      
      // Process items in batches
      for (let i = 0; i < pendingItems.length; i += this.config.sync.batchSize) {
        const batch = pendingItems.slice(i, i + this.config.sync.batchSize);
        
        for (const item of batch) {
          try {
            await this.syncItem(item);
            this.syncStatus.syncProgress = ((i + 1) / totalItems) * 100;
          } catch (error) {
            this.handleSyncError(item, error as Error);
          }
        }
      }
      
      this.syncStatus.lastSync = Date.now();
      this.syncStatus.nextSync = Date.now() + this.config.sync.interval;
      this.syncStatus.pendingItems = Array.from(this.offlineData.values()).filter(item => !item.synced).length;
      
      this.logEvent('sync_completed', { 
        syncedItems: totalItems - this.syncStatus.pendingItems,
        errors: this.syncStatus.errors.length 
      });
      
    } catch (error) {
      console.error('Sync failed:', error);
      this.logEvent('sync_failed', { error: (error as Error).message });
    } finally {
      this.syncStatus.syncInProgress = false;
      this.syncStatus.syncProgress = 100;
    }
  }

  private async syncItem(item: OfflineData): Promise<void> {
    try {
      // In a real implementation, sync with the server API
      console.log(`Syncing ${item.type} ${item.action}:`, item.data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Mark as synced
      item.synced = true;
      item.lastSyncAttempt = Date.now();
      
      // Remove from offline storage if successfully synced
      this.offlineData.delete(item.id);
      await this.saveOfflineData();
      
    } catch (error) {
      item.syncAttempts++;
      item.lastSyncAttempt = Date.now();
      throw error;
    }
  }

  private handleSyncError(item: OfflineData, error: Error): void {
    const syncError: SyncError = {
      id: this.generateId(),
      type: item.type,
      message: error.message,
      timestamp: Date.now(),
      retryCount: item.syncAttempts,
      resolved: false
    };
    
    this.syncStatus.errors.push(syncError);
    
    // Remove item if max retry attempts reached
    if (item.syncAttempts >= this.config.sync.retryAttempts) {
      console.error(`Max retry attempts reached for ${item.type}:`, item.id);
      // In production, might want to store in a failed items queue
    }
  }

  private async saveOfflineData(): Promise<void> {
    try {
      const data = Array.from(this.offlineData.values());
      localStorage.setItem('offline_data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }

  async sendPushNotification(notification: Omit<PushNotification, 'id' | 'timestamp' | 'delivered' | 'read'>): Promise<string> {
    const id = this.generateId();
    const pushNotification: PushNotification = {
      id,
      timestamp: Date.now(),
      delivered: false,
      read: false,
      ...notification
    };

    this.notifications.push(pushNotification);
    
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const browserNotification = new Notification(notification.title, {
          body: notification.body,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          data: notification.data,
          tag: notification.category
        });
        
        browserNotification.onclick = () => {
          this.markNotificationAsRead(id);
          // Handle notification click
        };
        
        pushNotification.delivered = true;
      }
      
      this.logEvent('notification_sent', { 
        type: notification.type, 
        category: notification.category 
      });
      
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
    
    return id;
  }

  markNotificationAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.logEvent('notification_read', { notificationId });
    }
  }

  getNotifications(unreadOnly: boolean = false): PushNotification[] {
    return this.notifications.filter(n => !unreadOnly || !n.read);
  }

  async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: position.timestamp
          };

          // Reverse geocoding (in production, use a proper service)
          try {
            location.address = await this.reverseGeocode(location.latitude, location.longitude);
          } catch (error) {
            console.warn('Failed to reverse geocode:', error);
          }

          this.logEvent('location_obtained', { 
            accuracy: location.accuracy,
            hasAddress: !!location.address 
          });
          
          resolve(location);
        },
        (error) => {
          this.logEvent('location_error', { error: error.message });
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  private async reverseGeocode(latitude: number, longitude: number): Promise<any> {
    // In production, use a proper geocoding service
    return {
      street: 'Sample Street',
      city: 'Doha',
      state: 'Doha',
      country: 'Qatar',
      postalCode: '12345',
      arabicAddress: 'عنوان تجريبي، الدوحة، قطر'
    };
  }

  async capturePhoto(): Promise<CameraCapture> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // In a real React Native app, use react-native-image-picker
      // This is a simplified web implementation
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      return new Promise((resolve) => {
        video.addEventListener('loadedmetadata', () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(video, 0, 0);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          stream.getTracks().forEach(track => track.stop());
          
          const capture: CameraCapture = {
            id: this.generateId(),
            type: 'photo',
            uri: dataUrl,
            base64: dataUrl.split(',')[1],
            metadata: {
              width: canvas.width,
              height: canvas.height,
              fileSize: dataUrl.length,
              mimeType: 'image/jpeg',
              timestamp: Date.now()
            },
            processed: false,
            uploaded: false
          };
          
          this.logEvent('photo_captured', { 
            width: capture.metadata.width,
            height: capture.metadata.height,
            fileSize: capture.metadata.fileSize
          });
          
          resolve(capture);
        });
      });
      
    } catch (error) {
      this.logEvent('photo_capture_error', { error: (error as Error).message });
      throw error;
    }
  }

  async authenticateWithBiometrics(): Promise<boolean> {
    try {
      if (!window.PublicKeyCredential) {
        throw new Error('Biometric authentication not supported');
      }

      // In a real React Native app, use react-native-biometrics
      // This is a simplified WebAuthn implementation
      
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: { name: 'Rental Solutions' },
          user: {
            id: new Uint8Array(16),
            name: 'user@example.com',
            displayName: 'User'
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          }
        }
      });

      this.logEvent('biometric_auth_success');
      return !!credential;
      
    } catch (error) {
      this.logEvent('biometric_auth_error', { error: (error as Error).message });
      return false;
    }
  }

  trackScreenView(screen: string, parameters?: any): void {
    const screenView: ScreenView = {
      screen,
      timestamp: Date.now(),
      duration: 0,
      parameters
    };
    
    // End previous screen view
    const lastView = this.analytics.screenViews[this.analytics.screenViews.length - 1];
    if (lastView && lastView.duration === 0) {
      lastView.duration = Date.now() - lastView.timestamp;
    }
    
    this.analytics.screenViews.push(screenView);
    this.logEvent('screen_view', { screen, parameters });
  }

  trackUserAction(action: string, screen: string, parameters?: any): void {
    const userAction: UserAction = {
      action,
      screen,
      timestamp: Date.now(),
      parameters
    };
    
    this.analytics.userActions.push(userAction);
    this.logEvent('user_action', { action, screen, parameters });
  }

  recordPerformanceMetric(metric: string, value: number, screen?: string): void {
    const performanceMetric: PerformanceMetric = {
      metric,
      value,
      timestamp: Date.now(),
      screen
    };
    
    this.analytics.performance.push(performanceMetric);
    
    // Report to performance analytics service
    performanceAnalytics.recordMetric({
      name: `Mobile ${metric}`,
      value,
      unit: 'ms',
      category: 'mobile',
      tags: { screen: screen || 'unknown' }
    });
  }

  private recordNetworkMetric(): void {
    // @ts-ignore - Connection API is experimental
    const connection = navigator.connection;
    if (connection) {
      const metric: NetworkMetric = {
        timestamp: Date.now(),
        type: connection.effectiveType || 'unknown',
        strength: connection.downlink || 0,
        bytesReceived: 0, // Would be tracked in real implementation
        bytesSent: 0,
        requestCount: 0,
        errorCount: 0
      };
      
      this.analytics.networkUsage.push(metric);
    }
  }

  reportCrash(error: Error): void {
    const crashReport: CrashReport = {
      id: this.generateId(),
      timestamp: Date.now(),
      error: error.message,
      stackTrace: error.stack || '',
      deviceInfo: this.deviceInfo!,
      appState: {
        syncStatus: this.syncStatus,
        offlineDataCount: this.offlineData.size,
        notificationCount: this.notifications.length
      },
      userActions: this.analytics.userActions.slice(-10) // Last 10 actions
    };
    
    this.analytics.crashes.push(crashReport);
    
    // In production, send to crash reporting service
    console.error('Crash reported:', crashReport);
    
    this.logEvent('crash_reported', { 
      error: error.message,
      crashId: crashReport.id 
    });
  }

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo;
  }

  getAnalytics(): MobileAnalytics {
    return { ...this.analytics };
  }

  private logEvent(event: string, parameters?: any): void {
    console.log(`Mobile Event: ${event}`, parameters);
    
    // In production, send to analytics service
    performanceAnalytics.recordMetric({
      name: `Mobile Event: ${event}`,
      value: 1,
      unit: 'count',
      category: 'mobile_events',
      tags: parameters
    });
  }

  private generateId(): string {
    return `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  destroy(): void {
    this.offlineData.clear();
    this.notifications = [];
    this.analytics.screenViews = [];
    this.analytics.userActions = [];
    this.analytics.performance = [];
    this.analytics.crashes = [];
    this.analytics.networkUsage = [];
  }
}

// Create singleton instance
export const mobileAppService = new MobileAppService();

// Convenience functions
export const storeOfflineData = (type: string, data: any, action?: 'create' | 'update' | 'delete') =>
  mobileAppService.storeOfflineData(type, data, action);

export const triggerSync = () => mobileAppService.triggerSync();

export const sendPushNotification = (notification: any) =>
  mobileAppService.sendPushNotification(notification);

export const getCurrentLocation = () => mobileAppService.getCurrentLocation();

export const capturePhoto = () => mobileAppService.capturePhoto();

export const authenticateWithBiometrics = () => mobileAppService.authenticateWithBiometrics();

export const trackScreenView = (screen: string, parameters?: any) =>
  mobileAppService.trackScreenView(screen, parameters);

export const trackUserAction = (action: string, screen: string, parameters?: any) =>
  mobileAppService.trackUserAction(action, screen, parameters);
