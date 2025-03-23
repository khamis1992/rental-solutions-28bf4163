
import React from 'react';
import { Search, User, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import { useNotifications } from '@/hooks/use-notifications';

const Header = () => {
  const { 
    notifications, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    dismissNotification 
  } = useNotifications();

  return <header className="w-full h-16 px-6 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-border/40 sticky top-0 z-50">
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
        <NotificationDropdown 
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDismiss={dismissNotification}
        />
        
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
        
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>;
};

export default Header;
