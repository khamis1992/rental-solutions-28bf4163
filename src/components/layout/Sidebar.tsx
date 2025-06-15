import React, { useState, useEffect } from "react";
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  FileText,
  Wrench,
  LogOut,
  BarChart2,
  AlertTriangle,
  DollarSign,
  Scale,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Car
} from "lucide-react";
import { useProfile } from "@/contexts/ProfileContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";

type NavLinkProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  badgeCount?: number;
  onClick?: () => void;
};

const NavLink: React.FC<NavLinkProps> = ({ to, icon, label, isActive, badgeCount, onClick }) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center justify-end gap-3 rounded-md px-3 py-3 text-sm transition-all text-right w-full",
        isActive ? "bg-blue-600 text-white" : "text-gray-200 hover:bg-gray-800"
      )}
      onClick={onClick}
      dir="rtl"
    >
      <div className="flex items-center gap-2 flex-row-reverse w-full justify-end">
        {icon}
        <span className="text-right flex-1">
          {label}
        </span>
        {badgeCount !== undefined && badgeCount > 0 && (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
            {badgeCount}
          </div>
        )}
      </div>
    </Link>
  );
};

type NavGroupProps = {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onSelect?: () => void;
};

const NavGroup: React.FC<NavGroupProps> = ({ label, icon, children, defaultOpen = false, onSelect }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild onClick={onSelect}>
        <div 
          className="flex items-center justify-end gap-3 rounded-md px-3 py-3 text-sm font-medium cursor-pointer text-gray-200 hover:bg-gray-800 text-right w-full"
          dir="rtl"
        >
          <div className="flex items-center gap-2 flex-row-reverse w-full justify-end">
            {icon}
            <span className="text-right flex-1">
              {label}
            </span>
            <div className="flex items-center justify-center">
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </div>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 mt-1 pr-6">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const [expanded, setExpanded] = useState(true);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const isMobile = useIsMobile();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  // Arabic navigation labels
  const getNavLabel = (key: string) => {
    const arabicLabels: Record<string, string> = {
      'navigation.dashboard': 'لوحة التحكم',
      'navigation.customers': 'العملاء',
      'navigation.agreements': 'العقود',
      'navigation.vehicles': 'المركبات',
      'navigation.maintenance': 'الصيانة',
      'navigation.financials': 'الماليات',
      'navigation.reports': 'التقارير',
      'navigation.legal': 'القانونية',
      'navigation.settings': 'الإعدادات'
    };
    
    return arabicLabels[key] || key;
  };

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile && onClose) {
      const handleRouteChange = () => {
        onClose();
      };

      window.addEventListener('routechange', handleRouteChange);
      
      return () => {
        window.removeEventListener('routechange', handleRouteChange);
      };
    }
  }, [isMobile, onClose]);

  // Handle click for mobile navigation
  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 z-40 flex flex-col bg-[#111827] border-gray-800 transition-all duration-300 ease-in-out",
        "right-0 border-l", // Always positioned on the right
        expanded ? "w-64" : "w-0 md:w-20",
        expanded ? "" : "md:px-2 md:py-4"
      )}
      dir="rtl"
    >
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:flex absolute top-4 rounded-full bg-[#1e293b] hover:bg-[#1e293b]/90 text-white -left-12"
        onClick={toggleSidebar}
      >
        {expanded ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      <div className={cn(
        "flex h-16 items-center border-b border-gray-800 px-4",
        expanded ? "" : "md:justify-center"
      )}>
        {expanded ? (
          <div 
            className="flex items-center gap-3 w-full justify-start"
            dir="ltr"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg text-white font-bold text-sm">
              RS
            </div>
            <h2 className="text-lg font-semibold text-white text-left">
              Rental Solutions
            </h2>
          </div>
        ) : (
          <div className="hidden md:block">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg text-white font-bold text-sm">
              RS
            </div>
          </div>
        )}
      </div>

      <div className={cn(
        "flex-1 overflow-auto py-4 px-4",
        expanded ? "" : "md:px-2"
      )}>
        <nav className="flex flex-col gap-1" dir="rtl">
          {(expanded || !expanded && window.innerWidth >= 768) && (
            <>
              <NavLink
                to="/dashboard"
                icon={<LayoutDashboard className="h-5 w-5 flex-shrink-0" />}
                label={getNavLabel('navigation.dashboard')}
                isActive={isActive('/dashboard')}
                onClick={handleNavClick}
              />

              <NavLink
                to="/customers"
                icon={<Users className="h-5 w-5 flex-shrink-0" />}
                label={getNavLabel('navigation.customers')}
                isActive={isActive('/customers')}
                onClick={handleNavClick}
              />

              <NavLink
                to="/agreements"
                icon={<FileText className="h-5 w-5 flex-shrink-0" />}
                label={getNavLabel('navigation.agreements')}
                isActive={isActive('/agreements')}
                onClick={handleNavClick}
              />

              <NavLink
                to="/vehicles"
                icon={<Car className="h-5 w-5 flex-shrink-0" />}
                label={getNavLabel('navigation.vehicles')}
                isActive={isActive('/vehicles')}
                onClick={handleNavClick}
              />

              <NavGroup
                label={getNavLabel('navigation.maintenance')}
                icon={<Wrench className="h-5 w-5 flex-shrink-0" />}
                onSelect={handleNavClick}
              >
                <NavLink
                  to="/maintenance/schedule"
                  icon={<AlertTriangle className="h-4 w-4 flex-shrink-0" />}
                  label="جدولة الصيانة"
                  isActive={isActive('/maintenance/schedule')}
                  onClick={handleNavClick}
                />
                <NavLink
                  to="/maintenance/history"
                  icon={<BarChart2 className="h-4 w-4 flex-shrink-0" />}
                  label="تاريخ الصيانة"
                  isActive={isActive('/maintenance/history')}
                  onClick={handleNavClick}
                />
              </NavGroup>

              <NavGroup
                label={getNavLabel('navigation.financials')}
                icon={<DollarSign className="h-5 w-5 flex-shrink-0" />}
                onSelect={handleNavClick}
              >
                <NavLink
                  to="/financials/overview"
                  icon={<BarChart2 className="h-4 w-4 flex-shrink-0" />}
                  label="النظرة العامة"
                  isActive={isActive('/financials/overview')}
                  onClick={handleNavClick}
                />
                <NavLink
                  to="/financials/transactions"
                  icon={<DollarSign className="h-4 w-4 flex-shrink-0" />}
                  label="المعاملات"
                  isActive={isActive('/financials/transactions')}
                  onClick={handleNavClick}
                />
              </NavGroup>

              <NavGroup
                label={getNavLabel('navigation.reports')}
                icon={<BarChart2 className="h-5 w-5 flex-shrink-0" />}
                onSelect={handleNavClick}
              >
                <NavLink
                  to="/reports/financial"
                  icon={<DollarSign className="h-4 w-4 flex-shrink-0" />}
                  label="التقارير المالية"
                  isActive={isActive('/reports/financial')}
                  onClick={handleNavClick}
                />
                <NavLink
                  to="/reports/operational"
                  icon={<BarChart2 className="h-4 w-4 flex-shrink-0" />}
                  label="التقارير التشغيلية"
                  isActive={isActive('/reports/operational')}
                  onClick={handleNavClick}
                />
              </NavGroup>

              <NavLink
                to="/legal"
                icon={<Scale className="h-5 w-5 flex-shrink-0" />}
                label={getNavLabel('navigation.legal')}
                isActive={isActive('/legal')}
                onClick={handleNavClick}
              />
            </>
          )}
        </nav>
      </div>

      {expanded && (
        <div className="border-t border-gray-800 p-4" dir="rtl">
          <div className="flex items-center gap-3 mb-3 flex-row-reverse justify-end">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {profile?.full_name?.split(' ').map(n => n[0]).join('') || user?.email?.[0].toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-sm font-medium text-white truncate text-right">
                {profile?.full_name || user?.email || 'مستخدم'}
              </p>
              <p className="text-xs text-gray-400 truncate text-right">
                مدير النظام
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full text-gray-200 hover:bg-gray-800 hover:text-white flex items-center justify-end gap-2"
            dir="rtl"
          >
            <div className="flex items-center gap-2 flex-row-reverse">
              <LogOut className="h-4 w-4" />
              <span className="text-right">
                تسجيل الخروج
              </span>
            </div>
          </Button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
