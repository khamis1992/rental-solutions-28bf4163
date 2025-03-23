
import React from 'react';
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from "@/components/ui/toast-provider";
import Header from '@/components/layout/Header';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function App({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <ProfileProvider>
          <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto py-4">
              {children}
            </main>
          </div>
          <Toaster /> {/* For shadcn/ui toast */}
          <ToastProvider /> {/* For sonner toast */}
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
