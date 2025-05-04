
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { ProfileProvider } from "@/contexts/ProfileContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

const RootLayout: React.FC = () => {
  return (
    <ProfileProvider>
      <SettingsProvider>
        <NotificationProvider>
          <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header />
              <main className="flex-1 overflow-auto">
                <Outlet />
              </main>
            </div>
          </div>
        </NotificationProvider>
      </SettingsProvider>
    </ProfileProvider>
  );
};

export default RootLayout;
