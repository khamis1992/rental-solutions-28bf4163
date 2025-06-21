
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { PWAStatus } from '@/components/pwa/PWAStatus';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { UpdatePrompt } from '@/components/pwa/UpdatePrompt';
import { initializePDFSystem } from '@/utils/pdf-generator';

import Dashboard from '@/pages/Dashboard';
import Vehicles from '@/pages/Vehicles';
import VehicleDetailPage from '@/pages/VehicleDetailPage';
import AddVehicle from '@/pages/AddVehicle';
import Customers from '@/pages/Customers';
import CustomerDetailPage from '@/pages/CustomerDetailPage';
import AddCustomer from '@/pages/AddCustomer';
import Agreements from '@/pages/Agreements';
import AgreementDetailPage from '@/pages/AgreementDetailPage';
import AddAgreement from '@/pages/AddAgreement';
import Maintenance from '@/pages/Maintenance';
import AddMaintenance from '@/pages/AddMaintenance';
import MaintenanceDetailPage from '@/pages/MaintenanceDetailPage';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import UserSettings from '@/pages/UserSettings';
import NotFound from '@/pages/NotFound';
import DocumentsPage from '@/pages/DocumentsPage';
import AnalyticsPage from '@/pages/AnalyticsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  // Initialize PDF system early
  useEffect(() => {
    const initPDF = async () => {
      try {
        console.log('Initializing PDF system in App...');
        await initializePDFSystem();
        console.log('PDF system initialized in App');
      } catch (error) {
        console.warn('PDF system initialization warning in App:', error);
      }
    };
    
    initPDF();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <NotificationProvider>
            <ProfileProvider>
              <SettingsProvider>
                <Router>
                  <div className="min-h-screen bg-background">
                    <PWAStatus />
                    <OfflineIndicator />
                    <UpdatePrompt />
                    
                    <Routes>
                      <Route path="/auth/login" element={<Login />} />
                      <Route path="/auth/register" element={<Register />} />
                      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                      <Route path="/auth/reset-password" element={<ResetPassword />} />
                      
                      <Route path="/*" element={
                        <ProtectedRoute>
                          <div className="flex h-screen overflow-hidden">
                            <Sidebar />
                            <div className="flex-1 flex flex-col overflow-hidden">
                              <Header />
                              <main className="flex-1 overflow-auto">
                                <Routes>
                                  <Route path="/" element={<Dashboard />} />
                                  <Route path="/dashboard" element={<Dashboard />} />

                                  <Route path="/vehicles" element={<Vehicles />} />
                                  <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
                                  <Route path="/vehicles/new" element={<AddVehicle />} />

                                  <Route path="/customers" element={<Customers />} />
                                  <Route path="/customers/:id" element={<CustomerDetailPage />} />
                                  <Route path="/customers/new" element={<AddCustomer />} />

                                  <Route path="/agreements" element={<Agreements />} />
                                  <Route path="/agreements/:id" element={<AgreementDetailPage />} />
                                  <Route path="/agreements/new" element={<AddAgreement />} />

                                  <Route path="/maintenance" element={<Maintenance />} />
                                  <Route path="/maintenance/:id" element={<MaintenanceDetailPage />} />
                                  <Route path="/maintenance/new" element={<AddMaintenance />} />

                                  <Route path="/reports" element={<Reports />} />
                                  <Route path="/analytics" element={<AnalyticsPage />} />
                                  <Route path="/settings" element={<Settings />} />
                                  <Route path="/profile" element={<UserSettings />} />
                                  <Route path="/documents" element={<DocumentsPage />} />

                                  <Route path="*" element={<NotFound />} />
                                </Routes>
                              </main>
                            </div>
                          </div>
                        </ProtectedRoute>
                      } />
                    </Routes>
                    
                    <Toaster 
                      position="top-right"
                      expand={true}
                      richColors
                      closeButton
                    />
                  </div>
                </Router>
              </SettingsProvider>
            </ProfileProvider>
          </NotificationProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
