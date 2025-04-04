
import React, { useState } from "react";
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  FileText,
  Wrench,
  Settings,
  LogOut,
  BarChart2,
  AlertTriangle,
  DollarSign,
  Scale,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  UserCog,
  Sliders,
  Car
} from "lucide-react";
import { useProfile } from "@/contexts/ProfileContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTranslation } from '@/contexts/TranslationContext';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { getDirectionalClasses } from '@/utils/rtl-utils';

type NavLinkProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  badgeCount?: number;
};

const NavLink: React.FC<NavLinkProps> = ({ to, icon, label, isActive, badgeCount }) => {
  const { isRTL } = useTranslation();
  
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-all",
        isActive ? "bg-blue-600 text-white" : "text-gray-200 hover:bg-gray-800",
        isRTL ? "flex-row-reverse text-right" : ""
      )}
    >
      {icon}
      <span>{label}</span>
      {badgeCount !== undefined && badgeCount > 0 && (
        <div className={`${isRTL ? 'mr-auto' : 'ml-auto'} flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground`}>
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
};

const NavGroup: React.FC<NavGroupProps> = ({ label, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { isRTL } = useTranslation();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <div className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium cursor-pointer text-gray-200 hover:bg-gray-800 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
          {icon}
          <span>{label}</span>
          <div className={`${isRTL ? 'mr-auto' : 'ml-auto'}`}>
            {isOpen ? <ChevronDown className="h-4 w-4" /> : 
              (isRTL ? <ChevronLeft className="h-4 w-4 sidebar-navigation-icon" /> : <ChevronRight className="h-4 w-4" />)}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className={`${isRTL ? 'pr-10' : 'pl-10'} space-y-1 mt-1`}>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

const Sidebar = () => {
  const [expanded, setExpanded] = useState(true);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { isRTL, direction } = useTranslation();
  const { t } = useI18nTranslation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const hasActiveChild = (paths: string[]) => {
    return paths.some(path => isActive(path));
  };

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  // Choose appropriate chevron icon based on direction and expanded state
  const SidebarChevron = !expanded ? 
    (isRTL ? <ChevronLeft className="h-4 w-4 sidebar-navigation-icon" /> : <ChevronRight className="h-4 w-4" />) : 
    (isRTL ? <ChevronRight className="h-4 w-4 sidebar-navigation-icon" /> : <ChevronLeft className="h-4 w-4" />);

  // Adjust sidebar position based on RTL setting
  const sidebarPosition = isRTL ? 'right-0' : 'left-0';
  const sidebarButtonPosition = isRTL ? '-left-12' : '-right-12';

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className={`md:hidden fixed top-4 ${isRTL ? 'right-4' : 'left-4'} z-50`}
        onClick={toggleSidebar}
      >
        {expanded ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      <div
        className={cn(
          `fixed inset-y-0 ${sidebarPosition} z-40 flex flex-col bg-[#111827] border-${isRTL ? 'l' : 'r'} border-gray-800 transition-all duration-300 ease-in-out`,
          expanded ? "w-64" : "w-0 md:w-20",
          expanded ? "" : "md:px-2 md:py-4"
        )}
        dir={direction}
      >
        <Button
          variant="ghost"
          size="icon"
          className={`hidden md:flex absolute ${sidebarButtonPosition} top-4 rounded-full bg-[#1e293b] hover:bg-[#1e293b]/90 text-white`}
          onClick={toggleSidebar}
        >
          {SidebarChevron}
        </Button>

        <div className={cn(
          "flex h-16 items-center border-b border-gray-800 px-4",
          expanded ? "" : "md:justify-center"
        )}>
          {expanded ? (
            <h2 className="text-lg font-semibold text-white">{t('common.rentalSolutions')}</h2>
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
                  icon={<LayoutDashboard className="h-5 w-5 sidebar-nav-icon" />}
                  label={t('common.dashboard')}
                  isActive={isActive('/dashboard')}
                />

                <NavLink
                  to="/customers"
                  icon={<Users className="h-5 w-5 sidebar-nav-icon" />}
                  label={t('common.customers')}
                  isActive={isActive('/customers')}
                />

                <NavLink
                  to="/agreements"
                  icon={<FileText className="h-5 w-5 sidebar-nav-icon" />}
                  label={t('common.agreements')}
                  isActive={isActive('/agreements')}
                />

                <NavLink
                  to="/vehicles"
                  icon={<Car className="h-5 w-5 sidebar-nav-icon" />}
                  label={t('common.vehicles')}
                  isActive={isActive('/vehicles')}
                />

                <NavLink
                  to="/maintenance"
                  icon={<Wrench className="h-5 w-5 sidebar-nav-icon" />}
                  label={t('common.maintenance')}
                  isActive={isActive('/maintenance')}
                />

                <NavLink
                  to="/fines"
                  icon={<AlertTriangle className="h-5 w-5 sidebar-nav-icon" />}
                  label={t('common.trafficFines')}
                  isActive={isActive('/fines')}
                />

                <NavLink
                  to="/financials"
                  icon={<DollarSign className="h-5 w-5 sidebar-nav-icon" />}
                  label={t('common.financials')}
                  isActive={isActive('/financials')}
                />

                <NavLink
                  to="/legal"
                  icon={<Scale className="h-5 w-5 sidebar-nav-icon" />}
                  label={t('common.legal')}
                  isActive={isActive('/legal')}
                />

                <NavLink
                  to="/reports"
                  icon={<BarChart2 className="h-5 w-5 sidebar-nav-icon" />}
                  label={t('common.reports')}
                  isActive={isActive('/reports')}
                />

                <NavLink
                  to="/user-management"
                  icon={<Users className="h-5 w-5 sidebar-nav-icon" />}
                  label={t('common.userManagement')}
                  isActive={isActive('/user-management')}
                />

                {!expanded && (
                  <>
                    <NavLink
                      to="/settings"
                      icon={<UserCog className="h-5 w-5 sidebar-nav-icon" />}
                      label={t('settings.title')}
                      isActive={isActive('/settings') && !isActive('/settings/system')}
                    />
                    
                    <NavLink
                      to="/settings/system"
                      icon={<Sliders className="h-5 w-5 sidebar-nav-icon" />}
                      label={t('settings.systemSettings')}
                      isActive={isActive('/settings/system')}
                    />
                  </>
                )}
                
                {expanded && (
                  <NavGroup 
                    label={t('common.settings')}
                    icon={<Settings className="h-5 w-5 sidebar-nav-icon" />}
                    defaultOpen={hasActiveChild(['/settings', '/settings/system'])}
                  >
                    <Link
                      to="/settings"
                      className={cn(
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${isRTL ? 'flex-row-reverse text-right' : ''}`,
                        isActive('/settings') && !isActive('/settings/system') ? "bg-blue-600 text-white" : "text-gray-200 hover:bg-gray-800"
                      )}
                    >
                      <UserCog className="h-4 w-4 sidebar-nav-icon" />
                      <span>{t('settings.title')}</span>
                    </Link>
                    
                    <Link
                      to="/settings/system"
                      className={cn(
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${isRTL ? 'flex-row-reverse text-right' : ''}`,
                        isActive('/settings/system') ? "bg-blue-600 text-white" : "text-gray-200 hover:bg-gray-800"
                      )}
                    >
                      <Sliders className="h-4 w-4 sidebar-nav-icon" />
                      <span>{t('settings.systemSettings')}</span>
                    </Link>
                  </NavGroup>
                )}
              </>
            )}
          </nav>
        </div>

        <div className={cn(
          "mt-auto border-t border-gray-800 py-4 px-4",
          expanded ? "" : "md:px-2 md:flex md:justify-center"
        )}>
          {expanded ? (
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Avatar className="h-9 w-9 border border-gray-700">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gray-700 text-white">{profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className={`flex flex-col ${isRTL ? 'items-end' : ''}`}>
                <span className="text-sm font-medium text-white">{profile?.full_name || "User"}</span>
                <span className="text-xs text-gray-400 truncate max-w-[120px]">
                  Admin
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={signOut} className={`${isRTL ? 'mr-auto' : 'ml-auto'} text-gray-400 hover:text-white hover:bg-gray-800`}>
                <LogOut className="h-4 w-4 sidebar-nav-icon" />
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex justify-center">
              <Avatar className="h-9 w-9 border border-gray-700">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gray-700 text-white">{profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
