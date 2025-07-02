
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner'; // Assuming you're using sonner for toast

// Define a notification context with proper types
interface NotificationContextType {
  showNotification: (message: string, type?: string, duration?: number) => void;
  hideNotification: () => void;
  notification: {
    visible: boolean;
    message: string;
    type: string;
  };
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState({
    visible: false,
    message: '',
    type: 'info'
  });

  // Clear notification after a delay
  useEffect(() => {
    if (notification.visible) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.visible]);

  const showNotification = (message: string, type = 'info', duration = 3000) => {
    setNotification({
      visible: true,
      message,
      type
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, visible: false }));
  };

  // Updated toast calls to include all required arguments
  const showToast = {
    success: (message: string) => {
      toast.success(message, { duration: 3000 });
    },
    error: (message: string) => {
      toast.error(message, { duration: 5000 });
    },
    info: (message: string) => {
      toast.info(message, { duration: 3000 });
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification, notification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
