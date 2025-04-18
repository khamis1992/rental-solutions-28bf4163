
import React from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const Header = ({ onToggleSidebar, isSidebarOpen = true }: HeaderProps) => {
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
    </header>
  );
};

export default Header;
