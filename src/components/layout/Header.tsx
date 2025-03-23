
import React, { useState } from 'react';
import { Bell, Settings, Search, User, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

const Header = () => {
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New maintenance scheduled', read: false, time: '10 minutes ago' },
    { id: 2, title: 'Vehicle rental due for return', read: false, time: '1 hour ago' },
    { id: 3, title: 'Payment received', read: false, time: '3 hours ago' },
  ]);

  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === id 
        ? { ...notification, read: true } 
        : notification
    ));
    toast({
      title: "Notification marked as read",
      duration: 2000,
    });
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
    toast({
      title: "All notifications marked as read",
      duration: 2000,
    });
  };

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
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-secondary border-none rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      
      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] flex items-center justify-center text-white">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs h-auto py-1"
                >
                  Mark all as read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <DropdownMenuItem 
                  key={notification.id} 
                  className={`flex flex-col items-start p-3 ${!notification.read ? 'bg-accent/30' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex justify-between w-full">
                    <span className="font-medium">{notification.title}</span>
                    {!notification.read && (
                      <Button size="icon" variant="ghost" className="h-5 w-5 ml-2 -mr-1">
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">{notification.time}</span>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No notifications
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
          <User className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
};

export default Header;
