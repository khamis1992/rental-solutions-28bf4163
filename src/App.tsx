import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { SettingsProvider } from '@/contexts/SettingsContext';

// Layout imports
// import Layout from '@/components/layout/Layout';
// import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Page imports
import Dashboard from '@/pages/Dashboard';
import Agreements from '@/pages/Agreements';
import AddAgreement from '@/pages/AddAgreement';
import EditAgreement from '@/pages/EditAgreement';
import Customers from '@/pages/Customers';
import AddCustomer from '@/pages/AddCustomer';
import EditCustomer from '@/pages/EditCustomer';
import CustomerDetailPage from '@/pages/CustomerDetailPage';
import Vehicles from '@/pages/Vehicles';
import AddVehicle from '@/pages/AddVehicle';
import EditVehicle from '@/pages/EditVehicle';
import VehicleDetailPage from '@/pages/VehicleDetailPage';
import Payments from '@/pages/Payments';
import Maintenance from '@/pages/Maintenance';
import AddMaintenance from '@/pages/AddMaintenance';
import EditMaintenance from '@/pages/EditMaintenance';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import TrafficFines from '@/pages/TrafficFines';
import Legal from '@/pages/Legal';
import LegalCaseDetail from '@/pages/LegalCaseDetail';
import LegalDocuments from '@/pages/LegalDocuments';
import CarInstallments from '@/pages/CarInstallments';
import LegalReports from '@/pages/LegalReports';
import DocumentsPage from '@/pages/DocumentsPage';
import InvoiceTemplates from '@/pages/InvoiceTemplates';
import WhatsAppNotifications from '@/pages/WhatsAppNotifications';
import ActivityPage from '@/pages/ActivityPage';
import CollectionReports from '@/pages/CollectionReports';
import PWAController from '@/components/pwa/PWAController';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ProfileProvider } from '@/contexts/ProfileContext';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="ui-theme">
        <AuthProvider>
          <ProfileProvider>
            <NotificationProvider>
              <SettingsProvider>
                <Router>
                  <div className="min-h-screen bg-background text-foreground">
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/" element={
                        <ProtectedRoute>
                          <Layout>
                            <Navigate to="/dashboard" replace />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      
                      {/* Dashboard */}
                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <Layout>
                            <Dashboard />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      {/* Agreements */}
                      <Route path="/agreements" element={
                        <ProtectedRoute>
                          <Layout>
                            <Agreements />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/agreements/add" element={
                        <ProtectedRoute>
                          <Layout>
                            <AddAgreement />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/agreements/edit/:id" element={
                        <ProtectedRoute>
                          <Layout>
                            <EditAgreement />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      {/* Customers */}
                      <Route path="/customers" element={
                        <ProtectedRoute>
                          <Layout>
                            <Customers />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/customers/add" element={
                        <ProtectedRoute>
                          <Layout>
                            <AddCustomer />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/customers/edit/:id" element={
                        <ProtectedRoute>
                          <Layout>
                            <EditCustomer />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/customers/:id" element={
                        <ProtectedRoute>
                          <Layout>
                            <CustomerDetailPage />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      {/* Vehicles */}
                      <Route path="/vehicles" element={
                        <ProtectedRoute>
                          <Layout>
                            <Vehicles />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/vehicles/add" element={
                        <ProtectedRoute>
                          <Layout>
                            <AddVehicle />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/vehicles/edit/:id" element={
                        <ProtectedRoute>
                          <Layout>
                            <EditVehicle />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/vehicles/:id" element={
                        <ProtectedRoute>
                          <Layout>
                            <VehicleDetailPage />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      {/* Payments */}
                      <Route path="/payments" element={
                        <ProtectedRoute>
                          <Layout>
                            <Payments />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      {/* Maintenance */}
                      <Route path="/maintenance" element={
                        <ProtectedRoute>
                          <Layout>
                            <Maintenance />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/maintenance/add" element={
                        <ProtectedRoute>
                          <Layout>
                            <AddMaintenance />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/maintenance/edit/:id" element={
                        <ProtectedRoute>
                          <Layout>
                            <EditMaintenance />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      {/* Reports */}
                      <Route path="/reports" element={
                        <ProtectedRoute>
                          <Layout>
                            <Reports />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      {/* Traffic Fines */}
                      <Route path="/traffic-fines" element={
                        <ProtectedRoute>
                          <Layout>
                            <TrafficFines />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      {/* Legal */}
                      <Route path="/legal" element={
                        <ProtectedRoute>
                          <Layout>
                            <Legal />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/legal/cases/:id" element={
                        <ProtectedRoute>
                          <Layout>
                            <LegalCaseDetail />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/legal/documents" element={
                        <ProtectedRoute>
                          <Layout>
                            <LegalDocuments />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/legal/reports" element={
                        <ProtectedRoute>
                          <Layout>
                            <LegalReports />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      {/* Car Installments */}
                      <Route path="/car-installments" element={
                        <ProtectedRoute>
                          <Layout>
                            <CarInstallments />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      {/* Documents */}
                      <Route path="/documents" element={
                        <ProtectedRoute>
                          <Layout>
                            <DocumentsPage />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      {/* Invoice Templates */}
                      <Route path="/invoice-templates" element={
                        <ProtectedRoute>
                          <Layout>
                            <InvoiceTemplates />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      {/* WhatsApp Notifications */}
                      <Route path="/whatsapp-notifications" element={
                        <ProtectedRoute>
                          <Layout>
                            <WhatsAppNotifications />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      {/* Activity */}
                      <Route path="/activity" element={
                        <ProtectedRoute>
                          <Layout>
                            <ActivityPage />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      {/* Collection Reports */}
                      <Route path="/collection-reports" element={
                        <ProtectedRoute>
                          <Layout>
                            <CollectionReports />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      {/* Settings */}
                      <Route path="/settings" element={
                        <ProtectedRoute>
                          <Layout>
                            <Settings />
                          </Layout>
                        </ProtectedRoute>
                      } />
                    </Routes>
                    
                    <Toaster 
                      position="top-right" 
                      richColors 
                      expand={true}
                      closeButton
                    />
                    <PWAController />
                  </div>
                </Router>
              </SettingsProvider>
            </NotificationProvider>
          </ProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
