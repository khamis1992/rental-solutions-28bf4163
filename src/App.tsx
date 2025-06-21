import React, { useEffect } from 'react';
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
import PWAStatus from '@/components/pwa/PWAStatus';
import OfflineIndicator from '@/components/pwa/OfflineIndicator';
import UpdatePrompt from '@/components/pwa/UpdatePrompt';
import { initializePDFSystem } from '@/utils/pdf-generator';

import DashboardPage from '@/pages/DashboardPage';
import VehiclesPage from '@/pages/VehiclesPage';
import VehicleDetailPage from '@/pages/VehicleDetailPage';
import NewVehiclePage from '@/pages/NewVehiclePage';
import CustomersPage from '@/pages/CustomersPage';
import CustomerDetailPage from '@/pages/CustomerDetailPage';
import NewCustomerPage from '@/pages/NewCustomerPage';
import AgreementsPage from '@/pages/AgreementsPage';
import AgreementDetailPage from '@/pages/AgreementDetailPage';
import NewAgreementPage from '@/pages/NewAgreementPage';
import MaintenancePage from '@/pages/MaintenancePage';
import NewMaintenanceRecordPage from '@/pages/NewMaintenanceRecordPage';
import MaintenanceDetailPage from '@/pages/MaintenanceDetailPage';
import ReportsPage from '@/pages/ReportsPage';
import SettingsPage from '@/pages/SettingsPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import ProfilePage from '@/pages/ProfilePage';
import NotificationsPage from '@/pages/NotificationsPage';
import DocumentsPage from '@/pages/DocumentsPage';
import NewDocumentPage from '@/pages/NewDocumentPage';
import DocumentDetailPage from '@/pages/DocumentDetailPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AccessDeniedPage from './pages/AccessDeniedPage';
import NotFoundPage from './pages/NotFoundPage';

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
                    
                    <ProtectedRoute>
                      <div className="flex h-screen overflow-hidden">
                        <Sidebar />
                        <div className="flex-1 flex flex-col overflow-hidden">
                          <Header />
                          <main className="flex-1 overflow-auto">
                            <Routes>
                              <Route path="/" element={<DashboardPage />} />
                              <Route path="/dashboard" element={<DashboardPage />} />

                              <Route path="/vehicles" element={<VehiclesPage />} />
                              <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
                              <Route path="/vehicles/new" element={<NewVehiclePage />} />

                              <Route path="/customers" element={<CustomersPage />} />
                              <Route path="/customers/:id" element={<CustomerDetailPage />} />
                              <Route path="/customers/new" element={<NewCustomerPage />} />

                              <Route path="/agreements" element={<AgreementsPage />} />
                              <Route path="/agreements/:id" element={<AgreementDetailPage />} />
                              <Route path="/agreements/new" element={<NewAgreementPage />} />

                              <Route path="/maintenance" element={<MaintenancePage />} />
                              <Route path="/maintenance/:id" element={<MaintenanceDetailPage />} />
                              <Route path="/maintenance/new" element={<NewMaintenanceRecordPage />} />

                              <Route path="/reports" element={<ReportsPage />} />
                              <Route path="/analytics" element={<AnalyticsPage />} />
                              <Route path="/settings" element={<SettingsPage />} />
                              <Route path="/profile" element={<ProfilePage />} />
                              <Route path="/notifications" element={<NotificationsPage />} />

                              <Route path="/documents" element={<DocumentsPage />} />
                              <Route path="/documents/new" element={<NewDocumentPage />} />
                              <Route path="/documents/:id" element={<DocumentDetailPage />} />

                              <Route path="/access-denied" element={<AccessDeniedPage />} />
                              <Route path="*" element={<NotFoundPage />} />
                            </Routes>
                          </main>
                        </div>
                      </div>
                    </ProtectedRoute>
                    
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
