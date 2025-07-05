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
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  showBottomNav?: boolean;
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

export const ResponsiveMobileLayout: React.FC<ResponsiveMobileLayoutProps> = ({
  children,
  sidebar,
  header,
  showBottomNav = true
}) => {
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

  // Mobile layout - NO HEADER, only content and bottom nav
  if (isMobile || breakpoint === 'tablet') {
    return (
      <div className="min-h-screen bg-gray-50">
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
            paddingBottom: showBottomNav ? 'calc(80px + var(--safe-area-bottom, 0px))' : 'var(--safe-area-bottom, 0px)',
            paddingTop: 'calc(16px + var(--safe-area-top, 0px))',
            minHeight: '100vh'
          }}
        >
          <div className="max-w-full mx-auto">
            {children}
          </div>
        </main>

        {showBottomNav && <BottomNavigation />}
      </div>
    );
  }

  // Desktop layout - keep headers
  return (
    <div className="min-h-screen bg-gray-50">
      {header}
      
      <div className="flex">
        {sidebar && (
          <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-200">
            {sidebar}
          </aside>
        )}
        
        <main className={cn(
          "flex-1 min-h-screen",
          sidebar && "lg:ml-64"
        )}>
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Hook for responsive layout management
export const useResponsiveLayout = () => {
  const isMobile = useIsMobile();
  const breakpoint = useBreakpoint();
  
  const [layoutConfig, setLayoutConfig] = useState({
    showSidebar: !isMobile,
    showBottomNav: isMobile,
    columns: isMobile ? 1 : 2,
    cardLayout: isMobile,
    compactMode: isMobile
  });

  useEffect(() => {
    setLayoutConfig({
      showSidebar: !isMobile,
      showBottomNav: isMobile,
      columns: isMobile ? 1 : breakpoint === 'tablet' ? 2 : 3,
      cardLayout: isMobile || breakpoint === 'tablet',
      compactMode: isMobile
    });
  }, [isMobile, breakpoint]);

  return layoutConfig;
};

// Responsive container component
export const ResponsiveContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
}> = ({ children, className, maxWidth = 'full', padding = true }) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  return (
    <div className={cn(
      'w-full mx-auto',
      maxWidthClasses[maxWidth],
      padding && 'px-4 sm:px-6',
      className
    )}>
      {children}
    </div>
  );
};
