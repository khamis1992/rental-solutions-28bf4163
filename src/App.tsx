import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeProvider } from './components/theme-provider';
import {
  dark,
  ThemeSupa,
} from '@supabase/auth-ui-shared';
import { SiteHeader } from './components/layout/SiteHeader';
import { SiteFooter } from './components/layout/SiteFooter';
import { PageContainer } from './components/layout/PageContainer';
import Dashboard from './pages/Dashboard';
import VehiclesPage from './pages/VehiclesPage';
import VehicleDetails from './pages/VehicleDetails';
import AddVehicle from './pages/AddVehicle';
import EditVehicle from './pages/EditVehicle';
import VehicleStatusUpdate from './pages/VehicleStatusUpdate';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const session = useSession();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <PageContainer>
        <p>Loading...</p>
      </PageContainer>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Toaster />
      <SiteHeader />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={session ? <Dashboard /> : <Navigate to="/login" />} />
          <Route
            path="/login"
            element={
              !session ? (
                <PageContainer>
                  <Auth
                    supabaseClient={supabase}
                    appearance={{ theme: ThemeSupa, variables: { default: { colors: { brand: '#4ade80', brandAccent: '#52525b' } } } }}
                    theme="dark"
                    providers={['github', 'google']}
                    redirectTo={`${window.location.origin}/vehicles`}
                  />
                </PageContainer>
              ) : (
                <Navigate to="/vehicles" />
              )
            }
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/vehicles/status-update" element={<VehicleStatusUpdate />} />
          <Route path="/vehicles/add" element={<AddVehicle />} />
          <Route path="/vehicles/:id" element={<VehicleDetails />} />
          <Route path="/vehicles/:id/edit" element={<EditVehicle />} />
        </Routes>
      </main>
      <SiteFooter />
    </ThemeProvider>
  );
};

export default App;
