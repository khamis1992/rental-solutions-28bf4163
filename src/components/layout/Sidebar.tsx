import React from "react";
import {
  Home,
  LayoutDashboard,
  Settings,
  Users,
  Car,
  ClipboardCheck,
} from "lucide-react";
import { NavList } from "@/components/ui/nav-list";

interface Item {
  title: string;
  href: string;
  icon: any;
  submenu?: { title: string; href: string }[];
}

const items: Item[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
    submenu: [
      {
        title: "All Customers",
        href: "/customers",
      },
      {
        title: "Add Customer",
        href: "/customers/add",
      },
    ],
  },
  {
    title: "Vehicles",
    href: "/vehicles",
    icon: Car,
    submenu: [
      {
        title: "All Vehicles",
        href: "/vehicles",
      },
      {
        title: "Add Vehicle",
        href: "/vehicles/add",
      },
    ],
  },
  {
    title: "Agreements",
    href: "/agreements",
    icon: ClipboardCheck,
    submenu: [
      {
        title: "All Agreements",
        href: "/agreements",
      },
      {
        title: "Add Agreement",
        href: "/agreements/add",
      },
    ],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

const Sidebar = () => {
  return (
    <div className="flex flex-col h-full bg-gray-100 border-r py-4">
      <div className="px-4">
        <a href="/" className="flex items-center text-lg font-semibold">
          <Home className="mr-2 h-5 w-5" />
          <span>Fleet Management</span>
        </a>
      </div>
      <NavList items={items} />
    </div>
  );
};

export default Sidebar;
