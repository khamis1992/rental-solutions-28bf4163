import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Header from './Header';
import Sidebar from './Sidebar';
import { Link } from 'react-router-dom';
import { ArrowLeft, WifiOff } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from '@/hooks/use-mobile';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const { isOnline } = useNetworkStatus();
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
  // Force new component mount when key properties change
  const [contentKey, setContentKey] = useState(
    `${title || ''}-${description || ''}-${Date.now()}`
  );
  
  // Update the content key when critical props change
  useEffect(() => {
    setContentKey(`${title || ''}-${description || ''}-${Date.now()}`);
  }, [title, description]);
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {isMobile ? (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="right" className="p-0 w-[80vw] max-w-[280px]">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      ) : (
        <Sidebar />
      )}
      
      <div className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        isMobile ? "w-full" : "md:pr-64"
      )}>
        <Header 
          onToggleSidebar={toggleSidebar} 
          isSidebarOpen={sidebarOpen} 
        />
        
        {!isOnline && (
          <Alert variant="warning" className="mx-4 mt-2">
            <WifiOff className="h-4 w-4" />
            <AlertDescription className="flex items-center">
              أنت غير متصل حالياً. قد تكون بعض الميزات غير متاحة.
            </AlertDescription>
          </Alert>
        )}
        
        <main 
          key={contentKey}
          className={cn(
            "p-4 md:p-6 animate-fade-in",
            className
          )}
          dir="rtl"
        >
          {backLink && (
            <Link 
              to={backLink} 
              className="inline-flex items-center mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors flex-row-reverse"
            >
              <ArrowLeft className="ml-1 h-4 w-4" />
              رجوع
            </Link>
          )}
          
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:flex-row-reverse">
            <div className="text-right">
              {title && <h1 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h1>}
              {description && <p className="text-muted-foreground mt-1 text-sm md:text-base">{description}</p>}
              <p className="text-xs text-muted-foreground mt-1">تاريخ النظام: {formatDate(systemDate)}</p>
            </div>
            {actions && (
              <div className="flex flex-wrap gap-2 justify-end sm:justify-start">
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
