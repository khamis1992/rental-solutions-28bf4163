
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  PieChart,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  UserPlus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

type NavItem = {
  title: string;
  path: string;
  icon: React.ElementType;
  roles?: string[];
};

const navItems: NavItem[] = [
  { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { title: 'Customers', path: '/customers', icon: Users, roles: ['admin', 'manager'] },
  { title: 'Agreements', path: '/agreements', icon: FileText },
  { title: 'Vehicles', path: '/vehicles', icon: Car },
  { title: 'Maintenance', path: '/maintenance', icon: Wrench },
  { title: 'Traffic Fines', path: '/fines', icon: AlertTriangle },
  { title: 'Financials', path: '/financials', icon: BarChart4, roles: ['admin', 'manager'] },
  { title: 'Legal', path: '/legal', icon: Gavel, roles: ['admin', 'manager'] },
  { title: 'Reports', path: '/reports', icon: PieChart, roles: ['admin', 'manager'] },
  { title: 'User Management', path: '/users', icon: UserPlus, roles: ['admin'] },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  const userRole = profile?.role || 'user';
  
  const filteredNavItems = navItems.filter(item => 
    !item.roles || item.roles.includes(userRole)
  );

  const getUserInitials = () => {
    if (!profile?.full_name) return 'U';
    return profile.full_name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
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
          {filteredNavItems.map((item) => {
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
        "p-4 border-t border-sidebar-border/50",
        collapsed ? "text-center" : ""
      )}>
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 h-auto flex items-center space-x-2 hover:bg-transparent">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-xs">
                    <span className="font-medium">{profile?.full_name || 'User'}</span>
                    <span className="text-muted-foreground capitalize">{profile?.role || 'User'}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
