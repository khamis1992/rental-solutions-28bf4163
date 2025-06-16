
import React from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useLanguage } from '@/contexts/LanguageContext';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const Header = ({ onToggleSidebar, isSidebarOpen = true }: HeaderProps) => {
  const isMobile = useIsMobile();
  const { language } = useLanguage();

  return (
    <header className="w-full h-16 px-4 md:px-6 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-border/40 sticky top-0 z-50">
      <div className="flex items-center gap-2" dir="ltr">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xl">
            RS
          </div>
          <div className="ml-2 font-medium text-lg">Rental Solutions</div>
        </div>
      </div>
      
      {/* Mobile menu button positioned on the right */}
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
    </header>
  );
};

export default Header;
