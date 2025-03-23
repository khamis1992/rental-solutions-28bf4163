
import React, { useEffect } from 'react';
import { Search, User, Settings, BellRing } from 'lucide-react';
import { Button } from "@/components/ui/button";
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import { useNotifications } from '@/hooks/use-notifications';
import { toast } from 'sonner';

// Define the CSS for bell animation as a string
const bellAnimationStyles = `
  @keyframes bellRing {
    0%, 100% {
      transform: rotate(0);
    }
    10%, 30%, 50%, 70% {
      transform: rotate(10deg);
    }
    20%, 40%, 60% {
      transform: rotate(-10deg);
    }
    80% {
      transform: rotate(5deg);
    }
    90% {
      transform: rotate(-5deg);
    }
  }
  
  .animate-bell {
    animation: bellRing 1s ease-in-out;
  }
`;

const Header = () => {
  const { 
    notifications, 
    loading, 
    hasNewNotification,
    markAsRead, 
    markAllAsRead, 
    dismissNotification,
    addNotification
  } = useNotifications();

  // Demonstrate adding a notification when user clicks on settings
  const handleSettingsClick = () => {
    addNotification({
      title: 'Settings Updated',
      description: 'Your user preferences have been successfully updated.',
      priority: 'low',
    });
  };

  // Notification bell animation effect when there are new notifications
  useEffect(() => {
    if (hasNewNotification) {
      const bell = document.getElementById('notification-bell');
      if (bell) {
        bell.classList.add('animate-bell');
        
        const removeAnimation = () => {
          bell.classList.remove('animate-bell');
        };
        
        bell.addEventListener('animationend', removeAnimation, { once: true });
        
        return () => {
          bell.removeEventListener('animationend', removeAnimation);
        };
      }
    }
  }, [hasNewNotification]);

  return (
    <header className="w-full h-16 px-6 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-border/40 sticky top-0 z-50">
      <div className="flex items-center">
        <div className="hidden md:flex h-10 w-10 rounded-md bg-primary text-primary-foreground items-center justify-center font-semibold text-xl">
          AR
        </div>
        <div className="hidden md:block ml-4 font-medium text-lg">Auto Rent Manager</div>
      </div>
      
      <div className="flex-1 max-w-md mx-4 relative hidden md:block">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 text-sm bg-secondary border-none rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>
      
      <div className="flex items-center space-x-4">
        <div id="notification-bell" className={`${hasNewNotification ? 'animate-bell' : ''}`}>
          <NotificationDropdown 
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onDismiss={dismissNotification}
          />
        </div>
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleSettingsClick}
        >
          <Settings className="h-5 w-5" />
        </Button>
        
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Insert the CSS styles as a regular style element */}
      <style dangerouslySetInnerHTML={{ __html: bellAnimationStyles }} />
    </header>
  );
};

export default Header;
