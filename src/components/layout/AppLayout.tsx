import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { usePrefetchRouteData } from '@/hooks/use-route-prefetch';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  // Setup route prefetching
  usePrefetchRouteData();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;