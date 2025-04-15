
import React, { ReactNode } from 'react';
import { cn } from "@/lib/utils";
import Sidebar from './Sidebar';
import { useSidebar } from '@/hooks/use-sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Toaster } from 'sonner';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  title,
  description,
  actions
}) => {
  const { isOpen, toggle } = useSidebar();

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Toaster richColors position="top-center" />
      
      {/* Mobile menu toggle */}
      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 left-4 z-50 lg:hidden"
        onClick={toggle}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className={cn(
          "flex-1 p-4 sm:p-6 overflow-auto",
          isOpen ? "lg:ml-64" : "",
          className
        )}>
          {(title || description || actions) && (
            <div className="flex justify-between items-center mb-6">
              <div>
                {title && <h1 className="text-2xl font-bold tracking-tight">{title}</h1>}
                {description && <p className="text-muted-foreground mt-1">{description}</p>}
              </div>
              {actions && <div>{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};

export default PageContainer;
