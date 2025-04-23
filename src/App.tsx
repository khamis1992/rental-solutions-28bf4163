
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './components/theme-provider';
import { SiteHeader } from './components/layout/SiteHeader';
import { SiteFooter } from './components/layout/SiteFooter';
import PageContainer from './components/layout/PageContainer';
import Dashboard from './pages/Dashboard';
import VehiclesPage from './pages/VehiclesPage';
import VehicleDetails from './pages/VehicleDetails';
import AddVehicle from './pages/AddVehicle';
import EditVehicle from './pages/EditVehicle';
import VehicleStatusUpdate from './pages/VehicleStatusUpdate';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Temporary mock session - we'll implement real auth later
  const session = true; // This simulates a logged-in user

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
                  <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="p-8 border rounded-lg shadow-md w-full max-w-md">
                      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
                      <p className="text-center mb-4 text-muted-foreground">
                        Supabase authentication is not yet configured.
                      </p>
                      <button 
                        className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
                        onClick={() => navigate('/vehicles')}
                      >
                        Continue as Guest
                      </button>
                    </div>
                  </div>
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
