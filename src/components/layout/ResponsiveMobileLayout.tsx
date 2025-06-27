import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile, useBreakpoint } from '@/hooks/use-mobile';
import { Menu, X, Home, Users, Car, FileText, CreditCard, Scale, AlertTriangle, Settings, BarChart3, Wrench, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

interface ResponsiveMobileLayoutProps {
  children: React.ReactNode;
  className?: string;
  dir?: 'ltr' | 'rtl';
  variant?: 'default' | 'payments' | 'customers' | 'dashboard';
}

const mobileNavItems = [
  { icon: Home, label: 'الرئيسية', path: '/dashboard' },
  { icon: FileText, label: 'العقود', path: '/agreements' },
  { icon: Users, label: 'العملاء', path: '/customers' },
  { icon: Car, label: 'المركبات', path: '/vehicles' },
  { icon: CreditCard, label: 'المدفوعات', path: '/payments' },
];

// Updated to match PC sidebar exactly
const allNavItems = [
  { icon: Home, label: 'لوحة التحكم', path: '/dashboard' },
  { icon: Users, label: 'العملاء', path: '/customers' },
  { icon: FileText, label: 'العقود', path: '/agreements' },
  { icon: Car, label: 'المركبات', path: '/vehicles' },
  { icon: Wrench, label: 'إدارة الصيانة', path: '/maintenance' },
  { icon: DollarSign, label: 'الماليات', path: '/financials' },
  { icon: BarChart3, label: 'التقارير', path: '/reports' },
  { icon: Scale, label: 'القانونية', path: '/legal' },
];

export function ResponsiveMobileLayout({ 
  children, 
  className, 
  dir = 'rtl',
  variant = 'default'
}: ResponsiveMobileLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const breakpoint = useBreakpoint();
  const location = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle safe area for devices with notches
  useEffect(() => {
    const updateSafeArea = () => {
      const safeAreaTop = window.getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)');
      const safeAreaBottom = window.getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)');
      
      document.documentElement.style.setProperty('--safe-area-top', safeAreaTop || '0px');
      document.documentElement.style.setProperty('--safe-area-bottom', safeAreaBottom || '0px');
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);

  const isActiveRoute = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const MobileSidebar = () => (
    <div className="flex flex-col h-full bg-white" dir="rtl">
      <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center justify-between">
          <div className="text-right">
            <h2 className="text-xl font-bold">نظام العراف</h2>
            <p className="text-sm text-blue-100">إدارة شاملة</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {allNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.path);
            
            return (
              <a
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors touch-friendly flex-row-reverse",
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </a>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t bg-gray-50">
        <div className="text-center text-xs text-gray-500">
          الإصدار 2.0 • تطبيق ويب تقدمي
        </div>
      </div>
    </div>
  );

  const BottomNavigation = () => (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden"
      style={{ paddingBottom: 'var(--safe-area-bottom, 0px)' }}
    >
      <div className="flex justify-around items-center py-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.path);
          
          return (
            <a
              key={item.path}
              href={item.path}
              className={cn(
                "flex flex-col items-center py-2 px-3 rounded-lg transition-colors touch-friendly",
                isActive
                  ? "text-blue-600"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );

  const layoutClasses = cn(
    // Base responsive classes
    'w-full min-h-screen',
    'px-2 sm:px-4 md:px-6 lg:px-8',
    'py-2 sm:py-4 md:py-6',
    
    // Variant-specific classes
    {
      // Default layout
      'max-w-7xl mx-auto': variant === 'default',
      
      // Payments-specific layout
      'max-w-full payments-page-container': variant === 'payments',
      
      // Customers-specific layout  
      'max-w-full customer-container': variant === 'customers',
      
      // Dashboard-specific layout
      'max-w-full dashboard-container': variant === 'dashboard',
    },
    
    // RTL/LTR support
    {
      'text-right': dir === 'rtl',
      'text-left': dir === 'ltr',
    },
    
    className
  );

  // Mobile layout - NO HEADER, only content and bottom nav
  if (isMobile || breakpoint === 'tablet') {
    return (
      <div className={layoutClasses} dir={dir}>
        {/* Hidden sidebar that can be opened via floating menu button */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <div className="fixed top-4 right-4 z-50">
            <SheetTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </div>
          <SheetContent side="right" className="w-80 p-0" dir="rtl">
            <MobileSidebar />
          </SheetContent>
        </Sheet>
        
        <main 
          className="px-4 py-4"
          style={{ 
            paddingBottom: 'calc(80px + var(--safe-area-bottom, 0px))',
            paddingTop: 'calc(16px + var(--safe-area-top, 0px))',
            minHeight: '100vh'
          }}
        >
          <div className={cn(
            'space-y-4 sm:space-y-6 md:space-y-8',
            {
              // Payments-specific spacing
              'space-y-3 sm:space-y-4': variant === 'payments',
              
              // Customers-specific spacing
              'space-y-4 sm:space-y-6': variant === 'customers',
            }
          )}>
            {children}
          </div>
        </main>

        {variant === 'payments' && <BottomNavigation />}
      </div>
    );
  }

  // Desktop layout - keep headers
  return (
    <div className={layoutClasses} dir={dir}>
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-200">
          {/* Sidebar content */}
        </aside>
        
        <main className={cn(
          "flex-1 min-h-screen",
          "lg:ml-64"
        )}>
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className={cn(
              'space-y-4 sm:space-y-6 md:space-y-8',
              {
                // Payments-specific spacing
                'space-y-3 sm:space-y-4': variant === 'payments',
                
                // Customers-specific spacing
                'space-y-4 sm:space-y-6': variant === 'customers',
              }
            )}>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Specialized components for different sections

export function PaymentsMobileLayout({ children, className }: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <ResponsiveMobileLayout 
      variant="payments" 
      dir="rtl" 
      className={className}
    >
      {children}
    </ResponsiveMobileLayout>
  );
}

export function CustomersMobileLayout({ children, className }: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <ResponsiveMobileLayout 
      variant="customers" 
      dir="rtl" 
      className={className}
    >
      {children}
    </ResponsiveMobileLayout>
  );
}

export function DashboardMobileLayout({ children, className }: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <ResponsiveMobileLayout 
      variant="dashboard" 
      dir="rtl" 
      className={className}
    >
      {children}
    </ResponsiveMobileLayout>
  );
}

// Mobile-specific helper components

export function MobileStatsGrid({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      'grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4',
      'payments-stats-mobile',
      className
    )}>
      {children}
    </div>
  );
}

export function MobileActionButtons({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      'flex flex-col sm:flex-row gap-2 w-full sm:w-auto',
      'payments-actions-mobile',
      className
    )}>
      {children}
    </div>
  );
}

export function MobileSearchContainer({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      'relative w-full payments-search-mobile',
      className
    )}>
      {children}
    </div>
  );
}

export function MobileTabsContainer({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      'overflow-x-auto payments-tabs-mobile',
      'scrollbar-none -ms-overflow-style-none',
      className
    )}>
      <style jsx>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {children}
    </div>
  );
}

export function MobileCardsList({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      'space-y-3 sm:space-y-4 payments-list-mobile',
      className
    )}>
      {children}
    </div>
  );
}

// Responsive breakpoint utilities
export const useResponsiveBreakpoint = () => {
  const [breakpoint, setBreakpoint] = React.useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
};

export default ResponsiveMobileLayout;
