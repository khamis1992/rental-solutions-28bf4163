
import React, { useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export type Notification = {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
};

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
}

const NotificationDropdown = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss
}: NotificationDropdownProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter(notif => !notif.read).length;
  
  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-blue-500';
    }
  };

  const handleMarkAllAsRead = () => {
    onMarkAllAsRead();
    setOpen(false);
    toast({
      title: "All notifications marked as read",
      description: `${unreadCount} notification${unreadCount !== 1 ? 's' : ''} marked as read.`,
    });
  };

  const handleMarkAsRead = (id: string) => {
    onMarkAsRead(id);
    toast({
      title: "Notification marked as read",
      description: "The notification has been marked as read.",
      variant: "default",
    });
  };

  const handleDismiss = (id: string) => {
    onDismiss(id);
    toast({
      title: "Notification dismissed",
      description: "The notification has been removed from your list.",
      variant: "default",
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <div className="relative">
            <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'text-primary' : ''}`} />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] font-bold"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 z-50 bg-background border" 
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/60">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="text-xs h-8"
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        <ScrollArea className="max-h-[60vh]">
          {notifications.length > 0 ? (
            <div className="py-2">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`flex items-start p-4 border-b border-border/30 hover:bg-accent/50 transition-colors ${notification.read ? 'opacity-70' : ''}`}
                >
                  <div className="flex-1 mr-4">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${priorityColor(notification.priority)}`} />
                      <h4 className="text-sm font-medium">{notification.title}</h4>
                    </div>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 cursor-pointer">
                          {notification.description}
                        </p>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80 z-[60] bg-popover">
                        <p className="text-sm">{notification.description}</p>
                      </HoverCardContent>
                    </HoverCard>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                        <span className="sr-only">Mark as read</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDismiss(notification.id)}
                      title="Dismiss"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Dismiss</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <p>No notifications</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDropdown;
