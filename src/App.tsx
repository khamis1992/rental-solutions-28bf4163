
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { Toaster } from '@/components/ui/sonner';

const App = () => {
  return (
    <div className="min-h-screen">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-8">
          <Outlet />
        </div>
      </div>
      <Toaster />
    </div>
  );
};

export default App;
