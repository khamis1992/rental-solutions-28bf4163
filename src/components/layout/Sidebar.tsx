
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Car,
  Users,
  FileText,
  BarChart4,
  Wrench,
  AlertTriangle,
  Gavel,
  UserCog,
  PieChart,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

type NavItem = {
  title: string;
  path: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { title: 'Vehicles', path: '/vehicles', icon: Car },
  { title: 'Customers', path: '/customers', icon: Users },
  { title: 'Agreements', path: '/agreements', icon: FileText },
  { title: 'Financials', path: '/financials', icon: BarChart4 },
  { title: 'Maintenance', path: '/maintenance', icon: Wrench },
  { title: 'Traffic Fines', path: '/fines', icon: AlertTriangle },
  { title: 'Legal', path: '/legal', icon: Gavel },
  { title: 'Chauffeurs', path: '/chauffeurs', icon: UserCog },
  { title: 'Reports', path: '/reports', icon: PieChart },
];

const Sidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div 
      className={cn(
        "h-screen fixed left-0 top-0 z-40 flex flex-col transition-all duration-300 ease-in-out bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-sidebar",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="h-16 flex items-center px-4 justify-between border-b border-sidebar-border/50">
        {!collapsed && (
          <div className="font-bold text-lg">Auto Rent Pro</div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-2 rounded-full bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      
      <nav className="flex-1 py-6 px-3 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center px-3 py-3 rounded-md transition-all duration-200 group",
                    isActive 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                      : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5", collapsed ? "mx-auto" : "mr-3")} />
                  {!collapsed && <span>{item.title}</span>}
                  
                  {collapsed && (
                    <div className="absolute left-20 ml-1 p-2 px-3 rounded-md bg-sidebar-background text-sidebar-foreground shadow-lg text-sm whitespace-nowrap opacity-0 scale-95 translate-x-2 pointer-events-none transition-all group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0">
                      {item.title}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className={cn(
        "p-4 border-t border-sidebar-border/50 text-sidebar-foreground/80",
        collapsed ? "text-center" : ""
      )}>
        {!collapsed ? (
          <div className="text-xs">
            <p>Auto Rent Manager</p>
            <p>v1.0.0</p>
          </div>
        ) : (
          <div className="text-xs">v1.0</div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
