import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Wifi, 
  WifiOff,
  Users,
  Database,
  MessageCircle,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Settings
} from 'lucide-react';
import { 
  useCommunicationContext,
  useComponentMessaging,
  useCrossPageCommunication,
  useDataSync
} from '@/components/providers/CommunicationProvider';
import { useGlobalState } from '@/hooks/use-global-state-management';
import { formatArabicDate } from '@/utils/arabic-rtl-utils';

// ===============================
// Types & Interfaces
// ===============================

interface ComponentStatus {
  id: string;
  name: string;
  isConnected: boolean;
  lastActivity: Date;
  messageCount: number;
  dataUpdates: number;
  errors: number;
  status: 'active' | 'idle' | 'error' | 'disconnected';
}

interface SyncChannelInfo {
  name: string;
  subscribers: number;
  messagesPerSecond: number;
  lastMessage: Date;
  isActive: boolean;
  errorRate: number;
}

interface SystemMetrics {
  totalComponents: number;
  activeComponents: number;
  totalMessages: number;
  messagesPerSecond: number;
  errorRate: number;
  syncChannels: number;
  activeSyncChannels: number;
  systemLoad: number;
}

// ===============================
// Main Component
// ===============================

export const RealTimeStateSyncPanel: React.FC = () => {
  const { eventBus, globalState } = useCommunicationContext();
  const messaging = useComponentMessaging();
  const crossPage = useCrossPageCommunication();
  const dataSync = useDataSync('panel');
  
  // ===============================
  // State Management
  // ===============================
  
  const [components, setComponents] = useState<ComponentStatus[]>([]);
  const [syncChannels, setSyncChannels] = useState<SyncChannelInfo[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalComponents: 0,
    activeComponents: 0,
    totalMessages: 0,
    messagesPerSecond: 0,
    errorRate: 0,
    syncChannels: 0,
    activeSyncChannels: 0,
    systemLoad: 0,
  });
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  
  // ===============================
  // Monitoring Logic
  // ===============================
  
  const updateComponentStatus = useCallback((componentId: string, updates: Partial<ComponentStatus>) => {
    setComponents(prev => {
      const existing = prev.find(c => c.id === componentId);
      if (existing) {
        return prev.map(c => c.id === componentId ? { ...c, ...updates } : c);
      } else {
        return [...prev, {
          id: componentId,
          name: updates.name || componentId,
          isConnected: true,
          lastActivity: new Date(),
          messageCount: 0,
          dataUpdates: 0,
          errors: 0,
          status: 'active',
          ...updates,
        } as ComponentStatus];
      }
    });
  }, []);
  
  const trackMessage = useCallback((event: string, data: any) => {
    const message = {
      id: Date.now().toString(),
      event,
      data,
      timestamp: new Date(),
      componentId: data?.componentId || 'unknown',
    };
    
    setRecentMessages(prev => [message, ...prev.slice(0, 99)]); // Keep last 100 messages
    
    // Update component message count
    if (data?.componentId) {
      updateComponentStatus(data.componentId, {
        messageCount: (components.find(c => c.id === data.componentId)?.messageCount || 0) + 1,
        lastActivity: new Date(),
        status: 'active',
      });
    }
  }, [components, updateComponentStatus]);
  
  const calculateMetrics = useCallback(() => {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    const recentMessages = recentMessages.filter(m => m.timestamp.getTime() > oneSecondAgo);
    const messagesPerSecond = recentMessages.length;
    
    const activeComponents = components.filter(c => 
      c.isConnected && now - c.lastActivity.getTime() < 30000 // Active in last 30 seconds
    ).length;
    
    const totalErrors = components.reduce((sum, c) => sum + c.errors, 0);
    const totalMessages = components.reduce((sum, c) => sum + c.messageCount, 0);
    const errorRate = totalMessages > 0 ? (totalErrors / totalMessages) * 100 : 0;

    const activeSyncChannels = syncChannels.filter(sc => sc.isActive).length;

    setSystemMetrics({
      totalComponents: components.length,
      activeComponents,
      totalMessages,
      messagesPerSecond,
      errorRate,
      syncChannels: syncChannels.length,
      activeSyncChannels,
      systemLoad: Math.min((messagesPerSecond / 10) * 100, 100), // Simple load calculation
    });
  }, [components, syncChannels, recentMessages]);

  // ===============================
  // Event Listeners
  // ===============================

  useEffect(() => {
    if (!isMonitoring) return;

    const unsubscribers = [
      // Component lifecycle events
      eventBus.on('component:register', (data: any) => {
        updateComponentStatus(data.componentId, {
          name: data.componentName,
          isConnected: true,
          status: 'active',
        });
        trackMessage('component:register', data);
      }),

      eventBus.on('component:unregister', (data: any) => {
        updateComponentStatus(data.componentId, {
          isConnected: false,
          status: 'disconnected',
        });
        trackMessage('component:unregister', data);
      }),

      // Data events
      eventBus.on('data:updated', (data: any) => {
        if (data.componentId) {
          updateComponentStatus(data.componentId, {
            dataUpdates: (components.find(c => c.id === data.componentId)?.dataUpdates || 0) + 1,
          });
        }
        trackMessage('data:updated', data);
      }),

      // Error events
      eventBus.on('component:error', (data: any) => {
        if (data.componentId) {
          updateComponentStatus(data.componentId, {
            errors: (components.find(c => c.id === data.componentId)?.errors || 0) + 1,
            status: 'error',
          });
        }
        trackMessage('component:error', data);
      }),

      // General message tracking
      ...(['component:mount', 'component:unmount', 'component:update', 
          'user:action', 'data:created', 'data:deleted'].map(event => 
        eventBus.on(event, (data: any) => trackMessage(event, data))
      )),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [isMonitoring, eventBus, updateComponentStatus, trackMessage, components]);

  // Calculate metrics every second
  useEffect(() => {
    const interval = setInterval(calculateMetrics, 1000);
    return () => clearInterval(interval);
  }, [calculateMetrics]);

  // ===============================
  // Control Functions
  // ===============================

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  const clearData = () => {
    setComponents([]);
    setRecentMessages([]);
    setPerformanceData([]);
  };

  const broadcastTestMessage = () => {
    messaging.emit('test:broadcast', {
      message: 'Test message from RealTimeStateSyncPanel',
      timestamp: new Date(),
      componentId: 'sync-panel',
    });
  };

  const forceRefreshAll = () => {
    crossPage.broadcastToAllPages({
      action: 'force_refresh',
      timestamp: new Date(),
    });
  };

  // ===============================
  // Status Helpers
  // ===============================

  const getStatusColor = (status: ComponentStatus['status']) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'idle': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      case 'disconnected': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: ComponentStatus['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'idle': return <Clock className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      case 'disconnected': return <WifiOff className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  // ===============================
  // Render Components
  // ===============================

  const renderSystemOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="flex items-center p-4">
          <Users className="w-8 h-8 text-blue-500 ml-3" />
          <div>
            <p className="text-sm text-gray-600">المكونات النشطة</p>
            <p className="text-2xl font-bold">
              {systemMetrics.activeComponents} / {systemMetrics.totalComponents}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-4">
          <MessageCircle className="w-8 h-8 text-green-500 ml-3" />
          <div>
            <p className="text-sm text-gray-600">الرسائل/الثانية</p>
            <p className="text-2xl font-bold">{systemMetrics.messagesPerSecond}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-4">
          <Database className="w-8 h-8 text-purple-500 ml-3" />
          <div>
            <p className="text-sm text-gray-600">قنوات المزامنة</p>
            <p className="text-2xl font-bold">
              {systemMetrics.activeSyncChannels} / {systemMetrics.syncChannels}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-4">
          <BarChart3 className={`w-8 h-8 ml-3 ${
            systemMetrics.errorRate > 5 ? 'text-red-500' : 
            systemMetrics.errorRate > 1 ? 'text-yellow-500' : 'text-green-500'
          }`} />
          <div>
            <p className="text-sm text-gray-600">معدل الأخطاء</p>
            <p className="text-2xl font-bold">{systemMetrics.errorRate.toFixed(1)}%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderComponentsList = () => (
    <div className="space-y-2">
      {components.map(component => (
        <Card 
          key={component.id} 
          className={`cursor-pointer transition-colors ${
            selectedComponent === component.id ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setSelectedComponent(
            selectedComponent === component.id ? null : component.id
          )}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className={getStatusColor(component.status)}>
                {getStatusIcon(component.status)}
              </div>
              <div>
                <p className="font-medium">{component.name}</p>
                <p className="text-sm text-gray-500">
                  آخر نشاط: {formatArabicDate(component.lastActivity)}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Badge variant="outline">
                {component.messageCount} رسالة
              </Badge>
              <Badge variant="outline">
                {component.dataUpdates} تحديث
              </Badge>
              {component.errors > 0 && (
                <Badge variant="destructive">
                  {component.errors} خطأ
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      
      {components.length === 0 && (
        <Card>
          <CardContent className="text-center p-8">
            <WifiOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد مكونات متصلة</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderMessageLog = () => (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {recentMessages.map(message => (
        <Card key={message.id} className="text-sm">
          <CardContent className="p-3">
            <div className="flex justify-between items-start mb-2">
              <Badge variant="outline">{message.event}</Badge>
              <span className="text-xs text-gray-500">
                {formatArabicDate(message.timestamp)}
              </span>
            </div>
            <div className="text-gray-600">
              <p>المكون: {message.componentId}</p>
              {message.data && (
                <pre className="text-xs mt-1 bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(message.data, null, 2)}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      
      {recentMessages.length === 0 && (
        <Card>
          <CardContent className="text-center p-8">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد رسائل حديثة</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderControls = () => (
    <div className="flex gap-2 mb-4">
      <Button 
        onClick={toggleMonitoring}
        variant={isMonitoring ? "default" : "outline"}
        size="sm"
      >
        {isMonitoring ? <Wifi className="w-4 h-4 ml-2" /> : <WifiOff className="w-4 h-4 ml-2" />}
        {isMonitoring ? 'إيقاف المراقبة' : 'تشغيل المراقبة'}
      </Button>
      
      <Button onClick={clearData} variant="outline" size="sm">
        <RefreshCw className="w-4 h-4 ml-2" />
        مسح البيانات
      </Button>
      
      <Button onClick={broadcastTestMessage} variant="outline" size="sm">
        <MessageCircle className="w-4 h-4 ml-2" />
        رسالة تجريبية
      </Button>
      
      <Button onClick={forceRefreshAll} variant="outline" size="sm">
        <RefreshCw className="w-4 h-4 ml-2" />
        تحديث شامل
      </Button>
    </div>
  );

  // ===============================
  // Main Render
  // ===============================

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-6 h-6" />
            لوحة مراقبة التواصل بين المكونات
            {isMonitoring && (
              <Badge variant="outline" className="mr-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-1" />
                مُفعّل
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {renderControls()}
          {renderSystemOverview()}
          
          <Tabs defaultValue="components" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="components">المكونات</TabsTrigger>
              <TabsTrigger value="messages">سجل الرسائل</TabsTrigger>
              <TabsTrigger value="sync">قنوات المزامنة</TabsTrigger>
            </TabsList>
            
            <TabsContent value="components" className="mt-4">
              {renderComponentsList()}
            </TabsContent>
            
            <TabsContent value="messages" className="mt-4">
              {renderMessageLog()}
            </TabsContent>
            
            <TabsContent value="sync" className="mt-4">
              <Card>
                <CardContent className="text-center p-8">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">قنوات المزامنة قيد التطوير</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeStateSyncPanel; 