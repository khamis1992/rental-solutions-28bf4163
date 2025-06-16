
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
        {/* Mobile menu button on the left */}
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
      </div>

      {/* Rental Solutions branding with RS icon first, then text */}
      <div className="flex items-center gap-2" dir="ltr">
        <div className="h-10 w-10 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xl hidden md:flex">
          RS
        </div>
        <div className="hidden md:block font-medium text-lg">Rental Solutions</div>
      </div>
    </header>
  );
};

export default Header;
