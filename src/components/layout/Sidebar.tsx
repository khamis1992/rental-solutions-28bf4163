import React, { useState, useEffect } from "react";
import { Link, useLocation } from 'react-router-dom';
import { useSafeAuth } from '@/contexts/AuthContext';
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
  ChevronLeft,
  Car,
  FileSpreadsheet,
  TrendingUp,
  Receipt,
  Activity,
  MessageCircle,
  Brain,
  Settings,
  Scan
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
      onClick={onClick}
      className={cn(
        "flex items-center justify-end gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors text-right",
        isActive 
          ? "bg-gray-800 text-white" 
          : "text-gray-200 hover:bg-gray-800 hover:text-white"
      )}
      dir="rtl"
    >
      <div className="flex items-center gap-2 flex-row-reverse">
        {icon}
        <span>{label}</span>
        {badgeCount && badgeCount > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {badgeCount}
          </span>
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
  const location = useLocation();
  const { user, signOut } = useSafeAuth();
  const { profile } = useProfile();
  const isMobile = useIsMobile();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
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
      className="fixed inset-y-0 z-40 flex flex-col bg-[#111827] border-gray-800 transition-all duration-300 ease-in-out w-64 right-0 border-l"
      dir="rtl"
    >
      <div className="flex h-16 items-center border-b border-gray-800 px-4">
        <div 
          className="flex items-center gap-3 w-full justify-start"
          dir="ltr"
        >
          <h2 className="text-lg font-semibold text-white text-left">
            Rental Solutions
          </h2>
          <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg text-white font-bold text-sm">
            RS
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto py-4 px-4">
        <nav className="flex flex-col gap-1" dir="rtl">
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

          <NavLink
            to="/maintenance"
            icon={<Wrench className="h-5 w-5 flex-shrink-0" />}
            label="إدارة الصيانة"
            isActive={isActive('/maintenance')}
            onClick={handleNavClick}
          />

          <NavGroup
            label={getNavLabel('navigation.financials')}
            icon={<DollarSign className="h-5 w-5 flex-shrink-0" />}
            onSelect={handleNavClick}
          >
            <NavLink
              to="/financials"
              icon={<DollarSign className="h-4 w-4 flex-shrink-0" />}
              label="الماليات"
              isActive={isActive('/financials')}
              onClick={handleNavClick}
            />
            <NavLink
              to="/invoice-management"
              icon={<Scan className="h-4 w-4 flex-shrink-0" />}
              label="مسح الفواتير"
              isActive={isActive('/invoice-management')}
              onClick={handleNavClick}
            />
            <NavLink
              to="/whatsapp-notifications"
              icon={<MessageCircle className="h-4 w-4 flex-shrink-0" />}
              label="تذكيرات الواتساب"
              isActive={isActive('/whatsapp-notifications')}
              onClick={handleNavClick}
            />
          </NavGroup>

          <NavGroup
            label={getNavLabel('navigation.reports')}
            icon={<BarChart2 className="h-5 w-5 flex-shrink-0" />}
            onSelect={handleNavClick}
          >
            <NavLink
              to="/reports"
              icon={<BarChart2 className="h-4 w-4 flex-shrink-0" />}
              label="التقارير"
              isActive={isActive('/reports')}
              onClick={handleNavClick}
            />
          </NavGroup>

          <NavGroup
            label={getNavLabel('navigation.legal')}
            icon={<Scale className="h-5 w-5 flex-shrink-0" />}
            onSelect={handleNavClick}
          >
            <NavLink
              to="/legal"
              icon={<Scale className="h-4 w-4 flex-shrink-0" />}
              label="إدارة القضايا"
              isActive={isActive('/legal')}
              onClick={handleNavClick}
            />
            <NavLink
              to="/activity"
              icon={<Activity className="h-4 w-4 flex-shrink-0" />}
              label="سجل النشاط"
              isActive={isActive('/activity')}
              onClick={handleNavClick}
            />
          </NavGroup>

          <NavGroup
            label="إدارة النظام"
            icon={<Settings className="h-5 w-5 flex-shrink-0" />}
            onSelect={handleNavClick}
          >
            <NavLink
              to="/admin/smart-updater"
              icon={<Brain className="h-4 w-4 flex-shrink-0" />}
              label="النظام الذكي الشامل"
              isActive={isActive('/admin/smart-updater')}
              onClick={handleNavClick}
            />
          </NavGroup>
        </nav>
      </div>

      {/* User Profile Section */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3 mb-4 flex-row-reverse" dir="rtl">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-blue-600 text-white">
              {profile?.full_name?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-right">
            <p className="text-sm font-medium text-white">
              {profile?.full_name || user?.email || 'مستخدم'}
            </p>
            <p className="text-xs text-gray-400">
              {profile?.role || 'مدير'}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full text-gray-200 hover:text-white hover:bg-gray-800 flex items-center justify-end gap-2 flex-row-reverse"
          dir="rtl"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
