
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Header from './Header';
import Sidebar from './Sidebar';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from '@/hooks/use-mobile';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  backLink?: string;
  actions?: React.ReactNode;
  systemDate?: Date;
}

const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  className,
  title,
  description,
  backLink,
  actions,
  systemDate = new Date()
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Mobile sidebar as Sheet */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-[80vw] max-w-[280px] border-r border-gray-800">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      )}
      
      {/* Desktop sidebar always visible */}
      {!isMobile && <Sidebar />}
      
      <div className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        isMobile ? "w-full" : "md:pl-64"
      )}>
        <Header 
          onToggleSidebar={toggleSidebar} 
          isSidebarOpen={sidebarOpen} 
        />
        
        <main className={cn(
          "p-4 sm:p-6 animate-fade-in",
          className
        )}>
          {backLink && (
            <Link 
              to={backLink} 
              className="inline-flex items-center mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          )}
          
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {title && <h1 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h1>}
              {description && <p className="text-muted-foreground mt-1 text-sm md:text-base">{description}</p>}
              <p className="text-xs text-muted-foreground mt-1">System Date: {formatDate(systemDate)}</p>
            </div>
            {actions && (
              <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                {actions}
              </div>
            )}
          </div>
          
          {children}
        </main>
      </div>
    </div>
  );
};

export default PageContainer;
