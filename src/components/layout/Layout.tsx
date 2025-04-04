
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useTranslation } from '@/contexts/TranslationContext';

const Layout: React.FC = () => {
  const { direction } = useTranslation();
  
  return (
    <div className="flex min-h-screen bg-background" dir={direction}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
