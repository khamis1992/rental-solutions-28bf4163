import React, { ReactNode, useEffect, createContext, useContext } from 'react';
import { 
  useGlobalState, 
  useNotificationState, 
  useCommunication 
} from '@/hooks/use-global-state-management';
import { 
  useEventListener, 
  EVENTS, 
  globalEventBus 
} from '@/utils/component-communication';
import { toast } from '@/components/ui/use-toast';

// ===============================
// Context Types
// ===============================

interface CommunicationContextValue {
  // State management
  globalState: ReturnType<typeof useGlobalState>;
  notifications: ReturnType<typeof useNotificationState>;
  communication: ReturnType<typeof useCommunication>;
  
  // Utility functions
  showToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  broadcastUpdate: (entityType: string, action: string, data: any) => void;
  requestGlobalRefresh: () => void;
  
  // Event bus access
  eventBus: typeof globalEventBus;
}

// ===============================
// Context Creation
// ===============================

const CommunicationContext = createContext<CommunicationContextValue | undefined>(undefined);

// ===============================
// Provider Component
// ===============================

interface CommunicationProviderProps {
  children: ReactNode;
  enableDebugMode?: boolean;
  enableGlobalToasts?: boolean;
}

export const CommunicationProvider: React.FC<CommunicationProviderProps> = ({
  children,
  enableDebugMode = false,
  enableGlobalToasts = true,
}) => {
  const globalState = useGlobalState();
  const notifications = useNotificationState();
  const communication = useCommunication();
  
  // ===============================
  // Global Event Listeners
  // ===============================
  
  // Listen for data updates and show notifications
  useEventListener(
    EVENTS.DATA_CREATED,
    (data: any) => {
      if (enableGlobalToasts && data.showNotification !== false) {
        notifications.addNotification(
          'success',
          'تم الإنشاء بنجاح',
          `تم إنشاء ${getEntityDisplayName(data.entityType)} بنجاح`
        );
      }
      
      if (enableDebugMode) {
        console.log('[CommunicationProvider] Data created:', data);
      }
    },
    [notifications.addNotification, enableGlobalToasts, enableDebugMode]
  );
  
  useEventListener(
    EVENTS.DATA_UPDATED,
    (data: any) => {
      if (enableGlobalToasts && data.showNotification !== false) {
        notifications.addNotification(
          'info',
          'تم التحديث بنجاح',
          `تم تحديث ${getEntityDisplayName(data.entityType)} بنجاح`
        );
      }
      
      if (enableDebugMode) {
        console.log('[CommunicationProvider] Data updated:', data);
      }
    },
    [notifications.addNotification, enableGlobalToasts, enableDebugMode]
  );
  
  useEventListener(
    EVENTS.DATA_DELETED,
    (data: any) => {
      if (enableGlobalToasts && data.showNotification !== false) {
        notifications.addNotification(
          'warning',
          'تم الحذف بنجاح',
          `تم حذف ${getEntityDisplayName(data.entityType)} بنجاح`
        );
      }
      
      if (enableDebugMode) {
        console.log('[CommunicationProvider] Data deleted:', data);
      }
    },
    [notifications.addNotification, enableGlobalToasts, enableDebugMode]
  );
  
  // Listen for errors
  useEventListener(
    EVENTS.ERROR_OCCURRED,
    (error: any) => {
      notifications.addNotification(
        'error',
        'حدث خطأ',
        error.message || 'حدث خطأ غير متوقع'
      );
      
      if (enableDebugMode) {
        console.error('[CommunicationProvider] Error occurred:', error);
      }
    },
    [notifications.addNotification, enableDebugMode]
  );
  
  // Listen for user actions for analytics
  useEventListener(
    EVENTS.USER_ACTION,
    (action: any) => {
      if (enableDebugMode) {
        console.log('[CommunicationProvider] User action:', action);
      }
      
      // Here you can add analytics tracking
      // trackUserAction(action.action, action.data);
    },
    [enableDebugMode]
  );
  
  // Listen for loading events
  useEventListener(
    EVENTS.LOADING_START,
    (data: any) => {
      if (enableDebugMode) {
        console.log('[CommunicationProvider] Loading started:', data.key);
      }
    },
    [enableDebugMode]
  );
  
  useEventListener(
    EVENTS.LOADING_END,
    (data: any) => {
      if (enableDebugMode) {
        console.log('[CommunicationProvider] Loading ended:', data.key);
      }
    },
    [enableDebugMode]
  );
  
  // ===============================
  // Utility Functions
  // ===============================
  
  const showToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string
  ) => {
    // Add to global notifications
    notifications.addNotification(type, title, message);
    
    // Also show as toast
    toast({
      title,
      description: message,
      variant: type === 'error' ? 'destructive' : 'default',
    });
  };
  
  const broadcastUpdate = (entityType: string, action: string, data: any) => {
    const eventName = `${entityType}:${action}` as keyof typeof EVENTS;
    communication.emit(eventName, data);
    
    // Also emit generic data event
    communication.notifyDataChange(action as any, entityType, data);
  };
  
  const requestGlobalRefresh = () => {
    communication.requestRefresh();
  };
  
  // ===============================
  // Helper Functions
  // ===============================
  
  const getEntityDisplayName = (entityType: string): string => {
    const displayNames: Record<string, string> = {
      agreement: 'العقد',
      customer: 'العميل',
      vehicle: 'المركبة',
      payment: 'الدفعة',
      maintenance: 'الصيانة',
      user: 'المستخدم',
      document: 'الوثيقة',
      notification: 'الإشعار',
      report: 'التقرير',
    };
    
    return displayNames[entityType] || entityType;
  };
  
  // ===============================
  // Context Value
  // ===============================
  
  const contextValue: CommunicationContextValue = {
    globalState,
    notifications,
    communication,
    showToast,
    broadcastUpdate,
    requestGlobalRefresh,
    eventBus: globalEventBus,
  };
  
  // ===============================
  // Effects
  // ===============================
  
  useEffect(() => {
    if (enableDebugMode) {
      console.log('[CommunicationProvider] Provider initialized');
      
      // Log all events in debug mode
      const originalEmit = globalEventBus.emit;
      globalEventBus.emit = function(event: string, data?: any) {
        console.log(`[EventBus] ${event}`, data);
        return originalEmit.call(this, event, data);
      };
      
      return () => {
        globalEventBus.emit = originalEmit;
      };
    }
  }, [enableDebugMode]);
  
  return (
    <CommunicationContext.Provider value={contextValue}>
      {children}
    </CommunicationContext.Provider>
  );
};

// ===============================
// Hook to use the context
// ===============================

export const useCommunicationContext = () => {
  const context = useContext(CommunicationContext);
  
  if (context === undefined) {
    throw new Error(
      'useCommunicationContext must be used within a CommunicationProvider'
    );
  }
  
  return context;
};

// ===============================
// Specialized Hooks
// ===============================

/**
 * Hook for simplified component communication
 */
export const useComponentMessaging = () => {
  const { communication, showToast, broadcastUpdate } = useCommunicationContext();
  
  return {
    // Emit events
    emit: communication.emit,
    
    // Data operations
    notifyCreated: (entityType: string, data: any) => 
      broadcastUpdate(entityType, 'created', data),
    notifyUpdated: (entityType: string, data: any) => 
      broadcastUpdate(entityType, 'updated', data),
    notifyDeleted: (entityType: string, data: any) => 
      broadcastUpdate(entityType, 'deleted', data),
    
    // User feedback
    showSuccess: (title: string, message: string) => 
      showToast('success', title, message),
    showError: (title: string, message: string) => 
      showToast('error', title, message),
    showWarning: (title: string, message: string) => 
      showToast('warning', title, message),
    showInfo: (title: string, message: string) => 
      showToast('info', title, message),
    
    // User actions
    trackAction: communication.notifyUserAction,
  };
};

/**
 * Hook for cross-page communication
 */
export const useCrossPageCommunication = () => {
  const { eventBus } = useCommunicationContext();
  
  const sendToPage = (pageName: string, message: any) => {
    eventBus.emit(`page:${pageName}`, message);
  };
  
  const listenToPage = (pageName: string, callback: (message: any) => void) => {
    return eventBus.on(`page:${pageName}`, callback);
  };
  
  const broadcastToAllPages = (message: any) => {
    eventBus.emit('page:broadcast', message);
  };
  
  return {
    sendToPage,
    listenToPage,
    broadcastToAllPages,
  };
};

/**
 * Hook for real-time data synchronization
 */
export const useDataSync = (entityType: string) => {
  const { eventBus } = useCommunicationContext();
  
  const syncData = (data: any) => {
    eventBus.emit(`sync:${entityType}`, data);
  };
  
  const onDataSync = (callback: (data: any) => void) => {
    return eventBus.on(`sync:${entityType}`, callback);
  };
  
  const requestSync = () => {
    eventBus.emit(`sync:request:${entityType}`, { timestamp: Date.now() });
  };
  
  const onSyncRequest = (callback: () => void) => {
    return eventBus.on(`sync:request:${entityType}`, callback);
  };
  
  return {
    syncData,
    onDataSync,
    requestSync,
    onSyncRequest,
  };
};

/**
 * Hook for component lifecycle events
 */
export const useComponentLifecycle = (componentName: string) => {
  const { eventBus } = useCommunicationContext();
  
  useEffect(() => {
    // Notify component mount
    eventBus.emit('component:mount', { name: componentName, timestamp: Date.now() });
    
    return () => {
      // Notify component unmount
      eventBus.emit('component:unmount', { name: componentName, timestamp: Date.now() });
    };
  }, [componentName, eventBus]);
  
  const notifyUpdate = (updateType: string, data?: any) => {
    eventBus.emit('component:update', { 
      name: componentName, 
      updateType, 
      data, 
      timestamp: Date.now() 
    });
  };
  
  const notifyError = (error: Error, context?: any) => {
    eventBus.emit('component:error', { 
      name: componentName, 
      error: error.message, 
      context, 
      timestamp: Date.now() 
    });
  };
  
  return {
    notifyUpdate,
    notifyError,
  };
};

// ===============================
// Export Types
// ===============================

export type { CommunicationContextValue }; 