
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/use-auth';

const App = () => {
  const { user } = useAuth();

  return (
    <ThemeProvider>
      <div className="min-h-screen">
        <Navbar user={user} />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 p-8">
            <Outlet />
          </div>
        </div>
      </div>
      <Toaster />
    </ThemeProvider>
  );
};

export default App;
