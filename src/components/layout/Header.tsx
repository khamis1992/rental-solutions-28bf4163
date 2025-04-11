
import React from 'react';
import { Bell, Settings, Search, User, Menu, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen?: boolean;
}

const Header = ({ onToggleSidebar, isSidebarOpen = false }: HeaderProps) => {
  const isMobile = useIsMobile();

  return (
    <header className="w-full h-16 px-4 md:px-6 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-border/40 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        {/* Mobile menu button */}
        {isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle Menu</span>
          </Button>
        )}
        
        <div className={cn(
          "flex items-center",
          isMobile ? "ml-0" : "ml-4"
        )}>
          <div className="h-10 w-10 rounded-md bg-primary text-primary-foreground items-center justify-center font-semibold text-xl hidden md:flex">
            RS
          </div>
          <div className="hidden md:block ml-4 font-medium text-lg">Rental Solutions</div>
        </div>
      </div>
      
      <div className="flex-1 max-w-md mx-4 relative hidden md:block">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <Input 
          type="text" 
          placeholder="Search..." 
          className="w-full pl-10 pr-4 py-2 text-sm bg-secondary border-none rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" 
        />
      </div>
      
      <div className="flex items-center gap-2">
        {/* Mobile search trigger */}
        {isMobile && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="w-full p-0">
              <div className="relative p-4">
                <Input 
                  type="text" 
                  placeholder="Search..." 
                  className="w-full pl-10 pr-4 py-2 text-sm" 
                  autoFocus
                />
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
        
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          <span className="sr-only">Notifications</span>
        </Button>
        
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
        
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <User className="h-4 w-4" />
          <span className="sr-only">User</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;
