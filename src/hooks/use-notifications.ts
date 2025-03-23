
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
      
      toast.info('New notification received', {
        description: newNotification.title,
      });
    }, 10000); // 10 seconds after loading the page
    
    return () => clearTimeout(timer);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.filter(notification => notification.id !== id)
    );
  };

  return {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  };
};
