import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Header } from './Header';
import Sidebar from './Sidebar';
import { WifiOff } from 'lucide-react';
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
  actions?: React.ReactNode;
  systemDate?: Date;
  dir?: 'ltr' | 'rtl';
  forceTitleLeft?: boolean;
}

const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  className,
  title,
  description,
  actions,
  systemDate = new Date(),
  dir = 'ltr',
  forceTitleLeft = false
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { isOnline } = useNetworkStatus();
  const isRTL = dir === 'rtl';
  
  const titleAlignClass = forceTitleLeft ? 'text-left' : (isRTL ? 'text-right' : 'text-left');
  
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
    <div className="min-h-screen flex flex-col bg-background" dir={dir}>
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
        isMobile ? "w-full" : "md:pr-64" // Always right padding for right-positioned sidebar
      )}>
        {/* Only show Header on desktop - hidden on mobile and tablet */}
        {!isMobile && (
        <Header 
            onMenuClick={toggleSidebar} 
            showMenuButton={false} 
        />
        )}
        
        {!isOnline && (
          <Alert variant="warning" className="mx-4 mt-2">
            <WifiOff className="h-4 w-4" />
            <AlertDescription className={cn("flex items-center", isRTL && "text-right")}>
              {isRTL ? "أنت غير متصل بالإنترنت حالياً. قد تكون بعض الميزات غير متاحة." : "You are currently offline. Some features may be unavailable."}
            </AlertDescription>
          </Alert>
        )}
        
        <main 
          key={contentKey}
          className={cn(
            "p-4 md:p-6 animate-fade-in",
            className
          )}
          dir={dir}
        >

          
          <div className={cn(
            "mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0",
            isRTL && !forceTitleLeft && "sm:flex-row-reverse"
          )}>
            <div className={titleAlignClass}>
              {title && <h1 className={cn("text-xl md:text-2xl font-bold tracking-tight", titleAlignClass)}>{title}</h1>}
              {description && <p className={cn("text-muted-foreground mt-1 text-sm md:text-base", titleAlignClass)}>{description}</p>}
              <p className={cn("text-xs text-muted-foreground mt-1", titleAlignClass)}>
                {isRTL ? `تاريخ النظام: ${formatDate(systemDate)}` : `System Date: ${formatDate(systemDate)}`}
              </p>
            </div>
            {actions && (
              <div className={cn(
                "flex flex-wrap gap-2 justify-start sm:justify-end",
                isRTL && "flex-row-reverse sm:justify-start"
              )}>
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
