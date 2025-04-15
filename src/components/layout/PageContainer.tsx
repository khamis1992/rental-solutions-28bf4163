import React, { useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useIsMobile } from "@/hooks/use-mobile";

// Update the interface to include headerProps
interface PageContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  headerProps?: {
    onSearch?: (query: string) => void;
    searchQuery?: string;
    searchPlaceholder?: string;
  };
}

const PageContainer: React.FC<PageContainerProps> = ({ 
  title, 
  description, 
  children, 
  actions,
  headerProps 
}) => {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Toggle sidebar function
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} />
      
      <div className="flex flex-col w-full">
        <Header 
          onToggleSidebar={toggleSidebar} 
          isSidebarOpen={isSidebarOpen}
          onSearch={headerProps?.onSearch}
          searchQuery={headerProps?.searchQuery}
          searchPlaceholder={headerProps?.searchPlaceholder}
        />
        
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
              {description && (
                <p className="text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            {actions && (
              <div className="mt-2 sm:mt-0">
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
