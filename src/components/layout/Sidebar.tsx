
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

type NavLinkProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  badgeCount?: number;
};

const NavLink: React.FC<NavLinkProps> = ({ to, icon, label, isActive, badgeCount }) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-all",
        isActive ? "bg-blue-600 text-white" : "text-gray-200 hover:bg-gray-800"
      )}
    >
      {icon}
      <span>{label}</span>
      {badgeCount !== undefined && badgeCount > 0 && (
        <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
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

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium cursor-pointer text-gray-200 hover:bg-gray-800">
          {icon}
          <span>{label}</span>
          <div className="ml-auto">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-10 space-y-1 mt-1">
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

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const hasActiveChild = (paths: string[]) => {
    return paths.some(path => isActive(path));
  };

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={toggleSidebar}
      >
        {expanded ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-[#111827] border-r border-gray-800 transition-all duration-300 ease-in-out",
          expanded ? "w-64" : "w-0 md:w-20",
          expanded ? "" : "md:px-2 md:py-4"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex absolute -right-12 top-4 rounded-full bg-[#1e293b] hover:bg-[#1e293b]/90 text-white"
          onClick={toggleSidebar}
        >
          {expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>

        <div className={cn(
          "flex h-16 items-center border-b border-gray-800 px-4",
          expanded ? "" : "md:justify-center"
        )}>
          {expanded ? (
            <h2 className="text-lg font-semibold text-white">Rental Solutions</h2>
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
                  icon={<LayoutDashboard className="h-5 w-5" />}
                  label="Dashboard"
                  isActive={isActive('/dashboard')}
                />

                <NavLink
                  to="/customers"
                  icon={<Users className="h-5 w-5" />}
                  label="Customers"
                  isActive={isActive('/customers')}
                />

                <NavLink
                  to="/agreements"
                  icon={<FileText className="h-5 w-5" />}
                  label="Agreements"
                  isActive={isActive('/agreements')}
                />

                <NavLink
                  to="/vehicles"
                  icon={<Car className="h-5 w-5" />}
                  label="Vehicles"
                  isActive={isActive('/vehicles')}
                />

                <NavLink
                  to="/maintenance"
                  icon={<Wrench className="h-5 w-5" />}
                  label="Maintenance"
                  isActive={isActive('/maintenance')}
                />

                <NavLink
                  to="/fines"
                  icon={<AlertTriangle className="h-5 w-5" />}
                  label="Traffic Fines"
                  isActive={isActive('/fines')}
                />

                <NavLink
                  to="/financials"
                  icon={<DollarSign className="h-5 w-5" />}
                  label="Financials"
                  isActive={isActive('/financials')}
                />

                <NavLink
                  to="/legal"
                  icon={<Scale className="h-5 w-5" />}
                  label="Legal"
                  isActive={isActive('/legal')}
                />

                <NavLink
                  to="/reports"
                  icon={<BarChart2 className="h-5 w-5" />}
                  label="Reports"
                  isActive={isActive('/reports')}
                />

                <NavLink
                  to="/user-management"
                  icon={<Users className="h-5 w-5" />}
                  label="User Management"
                  isActive={isActive('/user-management')}
                />

                {!expanded && (
                  <>
                    <NavLink
                      to="/settings"
                      icon={<UserCog className="h-5 w-5" />}
                      label="User Settings"
                      isActive={isActive('/settings') && !isActive('/settings/system')}
                    />
                    
                    <NavLink
                      to="/settings/system"
                      icon={<Sliders className="h-5 w-5" />}
                      label="System Settings"
                      isActive={isActive('/settings/system')}
                    />
                  </>
                )}
                
                {expanded && (
                  <NavGroup 
                    label="Settings" 
                    icon={<Settings className="h-5 w-5" />}
                    defaultOpen={hasActiveChild(['/settings', '/settings/system'])}
                  >
                    <Link
                      to="/settings"
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
                        isActive('/settings') && !isActive('/settings/system') ? "bg-blue-600 text-white" : "text-gray-200 hover:bg-gray-800"
                      )}
                    >
                      <UserCog className="h-4 w-4" />
                      <span>User Settings</span>
                    </Link>
                    
                    <Link
                      to="/settings/system"
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
                        isActive('/settings/system') ? "bg-blue-600 text-white" : "text-gray-200 hover:bg-gray-800"
                      )}
                    >
                      <Sliders className="h-4 w-4" />
                      <span>System Settings</span>
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
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-gray-700">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gray-700 text-white">{profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">{profile?.full_name || "User"}</span>
                <span className="text-xs text-gray-400 truncate max-w-[120px]">
                  Admin
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={signOut} className="ml-auto text-gray-400 hover:text-white hover:bg-gray-800">
                <LogOut className="h-4 w-4" />
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
