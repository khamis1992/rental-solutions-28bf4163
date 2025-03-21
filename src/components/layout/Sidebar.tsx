
import { Link, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  Car, 
  Settings, 
  Users, 
  FileText, 
  CreditCard, 
  AlertTriangle, 
  UserCog,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProfile } from "@/contexts/ProfileContext";
import { useMobileDrawer } from "@/hooks/use-mobile";

const Sidebar = () => {
  const { profile } = useProfile();
  const location = useLocation();
  const { isOpen, setIsOpen } = useMobileDrawer();

  const closeMobileMenu = () => {
    if (setIsOpen) {
      setIsOpen(false);
    }
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const SidebarLink = ({ to, icon: Icon, children }: { to: string; icon: any; children: React.ReactNode }) => {
    const active = isActive(to);
    
    return (
      <Link to={to} onClick={closeMobileMenu}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2 mb-1",
            active && "bg-muted font-medium"
          )}
        >
          <Icon className={cn("h-4 w-4", active && "text-primary")} />
          {children}
        </Button>
      </Link>
    );
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform duration-300 md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="p-6 border-b">
        <Link to="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
          <Car className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Fleet Manager</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          <SidebarLink to="/dashboard" icon={Home}>
            Dashboard
          </SidebarLink>
          
          <div className="mt-6 mb-2 px-4">
            <h3 className="text-xs font-medium text-muted-foreground">MANAGEMENT</h3>
          </div>
          
          <SidebarLink to="/vehicles" icon={Car}>
            Vehicles
          </SidebarLink>
          
          <SidebarLink to="/customers" icon={Users}>
            Customers
          </SidebarLink>
          
          <SidebarLink to="/agreements" icon={FileText}>
            Agreements
          </SidebarLink>
          
          <div className="mt-6 mb-2 px-4">
            <h3 className="text-xs font-medium text-muted-foreground">FINANCE</h3>
          </div>
          
          <SidebarLink to="/payments" icon={CreditCard}>
            Payments
          </SidebarLink>
          
          <SidebarLink to="/reports" icon={BarChart3}>
            Reports
          </SidebarLink>
          
          <SidebarLink to="/fines" icon={AlertTriangle}>
            Traffic Fines
          </SidebarLink>
          
          <div className="mt-6 mb-2 px-4">
            <h3 className="text-xs font-medium text-muted-foreground">SETTINGS</h3>
          </div>
          
          <SidebarLink to="/settings" icon={Settings}>
            My Settings
          </SidebarLink>
          
          {profile?.role === "admin" && (
            <SidebarLink to="/users" icon={UserCog}>
              User Management
            </SidebarLink>
          )}
        </nav>
      </ScrollArea>
      
      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {profile?.full_name?.charAt(0) || "U"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{profile?.full_name || "User"}</span>
            <span className="text-xs text-muted-foreground capitalize">{profile?.role || "user"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
