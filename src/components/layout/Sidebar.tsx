import React from 'react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from 'lucide-react';
import { SidebarProps } from '@/types';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Home,
  LayoutDashboard,
  Settings,
  Users,
  UserPlus,
  Car,
  Caravan,
  Calendar,
  BarChart4,
  Receipt
} from 'lucide-react';

const Sidebar = ({ isMobileMenuOpen, toggleMobileMenu }: SidebarProps) => {
  const location = useLocation();

  const menuItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Bookings",
      url: "/bookings",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Vehicles",
      url: "/vehicles",
      icon: <Caravan className="h-5 w-5" />,
      submenu: [
        {
          title: "Available Cars",
          url: "/vehicles",
        },
        {
          title: "Add New Car",
          url: "/vehicles/new",
        },
      ]
    },
    {
      title: "Fleet",
      url: "/fleet",
      icon: <Car className="h-5 w-5" />,
    },
    {
      title: "Customers",
      url: "/customers",
      icon: <Users className="h-5 w-5" />,
      submenu: [
        {
          title: "Customer List",
          url: "/customers"
        },
        {
          title: "Add New Customer",
          url: "/customers/new"
        }
      ]
    },
    {
      title: "Financials",
      url: "/financials",
      icon: <BarChart4 className="h-5 w-5" />,
      submenu: [
        {
          title: "Overview",
          url: "/financials"
        },
        {
          title: "Expenses",
          url: "/expenses"
        },
      ]
    },
  ];

  return (
    <div className="hidden border-r bg-gray-100/40 dark:bg-secondary md:block">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Admin Dashboard
          </h2>
          <div className="space-y-1">
            {menuItems.map((item, index) => (
              <React.Fragment key={index}>
                <NavLink
                  to={item.url}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center space-x-2 rounded-md px-4 py-2 font-medium hover:bg-gray-100 hover:text-foreground dark:hover:bg-secondary-foreground/80",
                      isActive
                        ? "bg-gray-100 text-foreground dark:bg-secondary-foreground/80"
                        : "text-muted-foreground"
                    )
                  }
                >
                  {item.icon}
                  <span>{item.title}</span>
                </NavLink>
                {item.submenu && (
                  <div className="ml-6 space-y-1">
                    {item.submenu.map((subItem, subIndex) => (
                      <NavLink
                        key={subIndex}
                        to={subItem.url}
                        className={({ isActive }) =>
                          cn(
                            "group flex items-center space-x-2 rounded-md px-4 py-2 font-medium hover:bg-gray-100 hover:text-foreground dark:hover:bg-secondary-foreground/80",
                            isActive
                              ? "bg-gray-100 text-foreground dark:bg-secondary-foreground/80"
                              : "text-muted-foreground"
                          )
                        }
                      >
                        <span>{subItem.title}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
