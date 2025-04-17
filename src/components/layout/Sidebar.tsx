
import React from 'react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  open?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ open = true }) => {
  return (
    <aside className={cn(
      "fixed top-0 left-0 z-40 h-screen w-64 bg-background border-r transition-transform",
      open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>
      {/* Sidebar content goes here */}
      <div className="p-4">
        <h2 className="text-xl font-semibold">Fleet Management</h2>
        
        {/* Navigation links would go here */}
        <nav className="mt-4">
          <ul className="space-y-2">
            <li>
              <a href="/dashboard" className="flex items-center p-2 rounded-lg hover:bg-muted">Dashboard</a>
            </li>
            <li>
              <a href="/vehicles" className="flex items-center p-2 rounded-lg hover:bg-muted">Vehicles</a>
            </li>
            <li>
              <a href="/customers" className="flex items-center p-2 rounded-lg hover:bg-muted">Customers</a>
            </li>
            <li>
              <a href="/agreements" className="flex items-center p-2 rounded-lg hover:bg-muted">Agreements</a>
            </li>
            <li>
              <a href="/financials" className="flex items-center p-2 rounded-lg hover:bg-muted">Financials</a>
            </li>
            <li>
              <a href="/maintenance" className="flex items-center p-2 rounded-lg hover:bg-muted">Maintenance</a>
            </li>
            <li>
              <a href="/legal" className="flex items-center p-2 rounded-lg hover:bg-muted">Legal</a>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
