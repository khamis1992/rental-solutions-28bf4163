
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Notification } from '@/components/notifications/NotificationDropdown';

// Sample demo notifications - in a real app these would come from an API
const demoNotifications: Notification[] = [
  {
    id: '1',
    title: 'Vehicle Maintenance Due',
    description: 'Vehicle BMW X5 (ABC-123) is due for maintenance in 3 days. Schedule service soon to avoid downtime.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    read: false,
    priority: 'medium',
  },
  {
    id: '2',
    title: 'Payment Received',
    description: 'Payment of $1,250 received from John Doe for rental agreement #5643.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false, 
    priority: 'low',
  },
  {
    id: '3',
    title: 'Vehicle Overdue',
    description: 'Mercedes C-Class (XYZ-789) is 2 days overdue for return. Customer: Sarah Johnson.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: false,
    priority: 'high',
  },
  {
    id: '4',
    title: 'New Reservation',
    description: 'New reservation placed for Toyota Camry from May 15-20 by David Wilson.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    read: true,
    priority: 'low',
  },
  {
    id: '5',
    title: 'Traffic Fine Received',
    description: 'Traffic fine of $175 received for vehicle Ford Explorer (DEF-456) on Main Street.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
    read: true,
    priority: 'medium',
  }
];

// In a real application, this would be connected to your backend
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  useEffect(() => {
    // Simulate API call to fetch notifications
    const fetchNotifications = () => {
      setLoading(true);
      // Simulate network delay
      setTimeout(() => {
        setNotifications(demoNotifications);
        setLoading(false);
      }, 800);
    };

    fetchNotifications();
    
    // Simulate periodic notifications checking (every 30 seconds)
    const checkInterval = setInterval(() => {
      const hasUnread = notifications.some(notif => !notif.read);
      if (hasUnread) {
        setHasNewNotification(true);
      }
    }, 30000);
    
    // Add a simulated new notification after a few seconds for demo purposes
    const timer = setTimeout(() => {
      const newNotification: Notification = {
        id: `new-${Date.now()}`,
        title: 'System Alert',
        description: 'System maintenance scheduled for tonight at 2 AM. Some services may be temporarily unavailable.',
        timestamp: new Date(),
        read: false,
        priority: 'high',
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      setHasNewNotification(true);
      
      toast.info('New notification received', {
        description: newNotification.title,
        action: {
          label: 'View',
          onClick: () => {
            setHasNewNotification(false);
            // In a real app, this would open the notifications panel
          }
        }
      });
    }, 10000); // 10 seconds after loading the page
    
    // Simulate additional new notification every 60 seconds for demonstration
    const notificationTimer = setInterval(() => {
      const randomPriorities = ['low', 'medium', 'high'];
      const randomPriority = randomPriorities[Math.floor(Math.random() * randomPriorities.length)] as 'low' | 'medium' | 'high';
      
      const randomNotifications = [
        {
          title: 'New Vehicle Added',
          description: 'A new Honda Accord has been added to your fleet. Vehicle ID: HON-2023.',
          priority: 'low'
        },
        {
          title: 'Maintenance Alert',
          description: 'Ford F-150 (FRD-789) is due for oil change in 2 days.',
          priority: 'medium'
        },
        {
          title: 'Rental Return Overdue',
          description: 'Toyota Camry (TOY-456) is 1 day overdue from customer Alex Johnson.',
          priority: 'high'
        },
        {
          title: 'Payment Successful',
          description: 'Payment of $980 received for rental #7845 from customer Michael Brown.',
          priority: 'low'
        }
      ];
      
      const randomIndex = Math.floor(Math.random() * randomNotifications.length);
      const newRandomNotification: Notification = {
        id: `new-${Date.now()}`,
        title: randomNotifications[randomIndex].title,
        description: randomNotifications[randomIndex].description,
        timestamp: new Date(),
        read: false,
        priority: randomPriority,
      };
      
      setNotifications(prev => [newRandomNotification, ...prev]);
      setHasNewNotification(true);
      
      toast.info('New notification received', {
        description: newRandomNotification.title,
      });
    }, 60000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(notificationTimer);
      clearInterval(checkInterval);
    };
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    
    // Check if all notifications are now read
    setTimeout(() => {
      const allRead = notifications.every(notification => notification.read || notification.id === id);
      if (allRead) {
        setHasNewNotification(false);
      }
    }, 100);
  };

  const markAllAsRead = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
    setHasNewNotification(false);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.filter(notification => notification.id !== id)
    );
    
    // Check if all remaining notifications are read
    setTimeout(() => {
      const hasUnread = notifications.some(notification => !notification.read && notification.id !== id);
      if (!hasUnread) {
        setHasNewNotification(false);
      }
    }, 100);
  };

  // Add notification programmatically (useful for other components to add notifications)
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `manual-${Date.now()}`,
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setHasNewNotification(true);
    
    toast.info('New notification', {
      description: newNotification.title,
    });
    
    return newNotification.id;
  };

  return {
    notifications,
    loading,
    hasNewNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    addNotification,
  };
};
