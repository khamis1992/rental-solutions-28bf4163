
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  submenu?: { title: string; href: string }[];
}

interface NavListProps {
  items: NavItem[];
}

export const NavList = ({ items }: NavListProps) => {
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title);
  };

  return (
    <nav className="space-y-1 px-2 py-4">
      {items.map((item) => (
        <div key={item.title} className="mb-1">
          {item.submenu ? (
            <div>
              <button
                onClick={() => toggleSubmenu(item.title)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-200 hover:text-gray-900",
                  openSubmenu === item.title
                    ? "bg-gray-200 text-gray-900"
                    : "text-gray-700"
                )}
              >
                <div className="flex items-center">
                  {item.icon && (
                    <item.icon className="mr-2 h-5 w-5 text-gray-500" />
                  )}
                  {item.title}
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    openSubmenu === item.title ? "rotate-180" : ""
                  )}
                />
              </button>
              {openSubmenu === item.title && (
                <div className="mt-1 pl-6 space-y-1">
                  {item.submenu.map((subItem) => (
                    <Link
                      key={subItem.title}
                      to={subItem.href}
                      className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                    >
                      {subItem.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link
              to={item.href}
              className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 hover:text-gray-900"
            >
              {item.icon && (
                <item.icon className="mr-2 h-5 w-5 text-gray-500" />
              )}
              {item.title}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};
