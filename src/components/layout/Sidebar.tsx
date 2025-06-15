import React, { useState, useEffect } from "react";
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { language } = useLanguage();
  
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-all",
        language === 'ar' ? "flex-row text-right" : "flex-row text-left",
        isActive ? "bg-blue-600 text-white" : "text-gray-200 hover:bg-gray-800"
      )}
      onClick={onClick}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}
    >
      {language === 'ar' && icon}
      <span 
        className="truncate"
        style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}
      >
        {label}
      </span>
      {language !== 'ar' && icon}
      {badgeCount !== undefined && badgeCount > 0 && (
        <div className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground",
          language === 'ar' ? "ml-auto" : "mr-auto"
        )}>
          {badgeCount}
        </div>
      )}
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
  const { language } = useLanguage();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild onClick={onSelect}>
        <div 
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium cursor-pointer text-gray-200 hover:bg-gray-800",
            language === 'ar' ? "flex-row text-right" : "flex-row text-left"
          )}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}
        >
          {language === 'ar' && icon}
          <span 
            className="truncate"
            style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}
          >
            {label}
          </span>
          {language !== 'ar' && icon}
          <div className={language === 'ar' ? "ml-auto" : "mr-auto"}>
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              language === 'ar' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className={cn(
        "space-y-1 mt-1",
        language === 'ar' ? "pl-10" : "pr-10"
      )}>
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
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  // Arabic translations for navigation
  const getNavLabel = (key: string) => {
    const arabicLabels = {
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
    
    return language === 'ar' ? arabicLabels[key] || t(key) : t(key);
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
        language === 'ar' ? "left-0 border-r" : "right-0 border-l",
        expanded ? "w-64" : "w-0 md:w-20",
        expanded ? "" : "md:px-2 md:py-4"
      )}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "hidden md:flex absolute top-4 rounded-full bg-[#1e293b] hover:bg-[#1e293b]/90 text-white",
          language === 'ar' ? "-right-12" : "-left-12"
        )}
        onClick={toggleSidebar}
      >
        {expanded ? 
          (language === 'ar' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />) : 
          (language === 'ar' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)
        }
      </Button>

      <div className={cn(
        "flex h-16 items-center border-b border-gray-800 px-4",
        expanded ? "" : "md:justify-center"
      )}>
        {expanded ? (
          <div 
            className={cn(
              "flex items-center gap-2",
              language === 'ar' ? "flex-row" : "flex-row-reverse"
            )}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <Car className="h-6 w-6 text-white" />
            <h2 
              className="text-lg font-semibold text-white"
              style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}
            >
              حلول التأجير
            </h2>
          </div>
        ) : (
          <div className="hidden md:block">
            <Car className="h-6 w-6 text-white" />
          </div>
        )}
      </div>

      <div className={cn(
        "flex-1 overflow-auto py-4 px-4",
        expanded ? "" : "md:px-2"
      )}>
        <nav className="flex flex-col gap-1">
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
                  label={language === 'ar' ? 'جدولة الصيانة' : 'Schedule Maintenance'}
                  isActive={isActive('/maintenance/schedule')}
                  onClick={handleNavClick}
                />
                <NavLink
                  to="/maintenance/history"
                  icon={<BarChart2 className="h-4 w-4 flex-shrink-0" />}
                  label={language === 'ar' ? 'تاريخ الصيانة' : 'Maintenance History'}
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
                  label={language === 'ar' ? 'النظرة العامة' : 'Overview'}
                  isActive={isActive('/financials/overview')}
                  onClick={handleNavClick}
                />
                <NavLink
                  to="/financials/transactions"
                  icon={<DollarSign className="h-4 w-4 flex-shrink-0" />}
                  label={language === 'ar' ? 'المعاملات' : 'Transactions'}
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
                  label={language === 'ar' ? 'التقارير المالية' : 'Financial Reports'}
                  isActive={isActive('/reports/financial')}
                  onClick={handleNavClick}
                />
                <NavLink
                  to="/reports/operational"
                  icon={<BarChart2 className="h-4 w-4 flex-shrink-0" />}
                  label={language === 'ar' ? 'التقارير التشغيلية' : 'Operational Reports'}
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

              <NavLink
                to="/settings"
                icon={<Wrench className="h-5 w-5 flex-shrink-0" />}
                label={getNavLabel('navigation.settings')}
                isActive={isActive('/settings')}
                onClick={handleNavClick}
              />
            </>
          )}
        </nav>
      </div>

      {expanded && (
        <div className="border-t border-gray-800 p-4">
          <div 
            className={cn(
              "flex items-center gap-3 mb-3",
              language === 'ar' ? "flex-row" : "flex-row"
            )}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {profile?.full_name?.split(' ').map(n => n[0]).join('') || user?.email?.[0].toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p 
                className="text-sm font-medium text-white truncate"
                style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}
              >
                {profile?.full_name || user?.email || 'مستخدم'}
              </p>
              <p 
                className="text-xs text-gray-400 truncate"
                style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}
              >
                {language === 'ar' ? 'مدير النظام' : 'System Admin'}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            onClick={signOut}
            className={cn(
              "w-full justify-start text-gray-200 hover:bg-gray-800 hover:text-white",
              language === 'ar' ? "flex-row" : "flex-row"
            )}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}
          >
            {language === 'ar' && <LogOut className="h-4 w-4 ml-2" />}
            <span style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}>
              {language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
            </span>
            {language !== 'ar' && <LogOut className="h-4 w-4 mr-2" />}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
