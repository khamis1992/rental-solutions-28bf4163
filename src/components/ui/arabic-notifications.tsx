

import { Card, CardContent } from '@/components/ui/card';

import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Info, 
  X, 
  Bell,
  Clock,
  User,
  Calendar
} from 'lucide-react';
import { createArabicNotificationLayout, formatArabicDate, formatArabicTime } from '@/utils/arabic-rtl-utils';

export type ArabicNotificationType = 'success' | 'error' | 'warning' | 'info';
export type ArabicNotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

interface ArabicNotificationProps {
  id?: string;
  type: ArabicNotificationType;
  title: string;
  message: string;
  priority?: ArabicNotificationPriority;
  timestamp?: Date;
  read?: boolean;
  dismissible?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  }>;
  onDismiss?: () => void;
  onMarkAsRead?: () => void;
  className?: string;
}

export const ArabicNotification: React.FC<ArabicNotificationProps> = ({
  id,
  type,
  title,
  message,
  priority = 'medium',
  timestamp,
  read = false,
  dismissible = true,
  actions = [],
  onDismiss,
  onMarkAsRead,
  className,
}) => {
  const getTypeIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getTypeColors = () => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getPriorityBadge = () => {
    const priorityLabels = {
      low: 'منخفضة',
      medium: 'متوسطة',
      high: 'عالية',
      urgent: 'عاجلة',
    };

    const priorityColors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={cn('text-xs', priorityColors[priority])}>
        {priorityLabels[priority]}
      </Badge>
    );
  };

  return (
    <Card 
      className={cn(
        'border transition-all duration-200',
        getTypeColors(),
        !read && 'shadow-md',
        read && 'opacity-75',
        className
      )}
      dir="rtl"
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getTypeIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-right text-sm">{title}</h4>
                <p className="text-sm text-muted-foreground text-right mt-1">
                  {message}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {getPriorityBadge()}
                {dismissible && onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={onDismiss}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || 'outline'}
                    size="sm"
                    onClick={action.onClick}
                    className="h-7 text-xs"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {timestamp && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatArabicTime(timestamp)}
                  </span>
                )}
                
                {!read && onMarkAsRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMarkAsRead}
                    className="h-6 text-xs"
                  >
                    تم القراءة
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ArabicNotificationListProps {
  notifications: Array<ArabicNotificationProps & { id: string }>;
  title?: string;
  emptyMessage?: string;
  onDismissAll?: () => void;
  onMarkAllAsRead?: () => void;
  maxHeight?: string;
  className?: string;
}

export const ArabicNotificationList: React.FC<ArabicNotificationListProps> = ({
  notifications,
  title = 'الإشعارات',
  emptyMessage = 'لا توجد إشعارات',
  onDismissAll,
  onMarkAllAsRead,
  maxHeight = 'max-h-96',
  className,
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Card className={cn('w-full', className)} dir="rtl">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h3 className="font-semibold">{title}</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            {unreadCount > 0 && onMarkAllAsRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
                className="text-xs"
              >
                تم قراءة الكل
              </Button>
            )}
            
            {notifications.length > 0 && onDismissAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismissAll}
                className="text-xs"
              >
                مسح الكل
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className={cn('overflow-y-auto', maxHeight)}>
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div key={notification.id} className="p-4">
                <ArabicNotification {...notification} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

interface ArabicToastProps {
  type: ArabicNotificationType;
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

export const ArabicToast: React.FC<ArabicToastProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  actions = [],
}) => {
  React.useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getTypeIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getTypeColors = () => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <Card 
      className={cn(
        'border shadow-lg animate-in slide-in-from-top-2',
        getTypeColors()
      )}
      dir="rtl"
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {getTypeIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-right text-sm mb-1">{title}</h4>
            {message && (
              <p className="text-sm text-muted-foreground text-right mb-2">
                {message}
              </p>
            )}
            
            {actions.length > 0 && (
              <div className="flex gap-2 justify-start">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={action.onClick}
                    className="h-7 text-xs"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onClose}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Hook for managing Arabic notifications
export const useArabicNotifications = () => {
  const [notifications, setNotifications] = React.useState<Array<ArabicNotificationProps & { id: string }>>([]);

  const addNotification = (notification: Omit<ArabicNotificationProps, 'id'>) => {
    const id = Date.now().toString();
    setNotifications(prev => [
      { ...notification, id, timestamp: new Date() },
      ...prev
    ]);
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    unreadCount: getUnreadCount(),
  };
}; 