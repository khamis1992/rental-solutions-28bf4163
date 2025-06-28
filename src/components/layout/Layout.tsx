import React, { useState } from 'react';
import { Header } from './Header';
import Sidebar from './Sidebar';
import PageContainer from './PageContainer';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        {/* Sidebar - Always visible on desktop, toggleable on mobile */}
        <div className={cn(
          "transition-transform duration-300 ease-in-out",
          "lg:translate-x-0", // Always visible on large screens
          sidebarOpen ? "translate-x-0" : "translate-x-full" // Mobile toggle
        )}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 lg:mr-64">
          <PageContainer>
            {children}
          </PageContainer>
        </main>
      </div>
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout; 