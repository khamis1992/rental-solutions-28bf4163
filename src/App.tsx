
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import { useState, useEffect, lazy, Suspense } from "react";
import { LoadingFallback } from "./components/ui/loading-fallback";
import { ErrorBoundary } from "./components/ui/error-boundary";
import { defaultRetryConfig } from "./lib/api/retry-utils";

// Context Providers
import { AuthProvider } from "./contexts/AuthContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { NotificationProvider } from "./contexts/NotificationContext";

// Auth components
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AuthLayout from "./pages/auth/AuthLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Pages
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
const Vehicles = lazy(() => import("./pages/Vehicles"));
const AddVehicle = lazy(() => import("./pages/AddVehicle"));
const VehicleDetailPage = lazy(() => import("./pages/VehicleDetailPage"));
const EditVehicle = lazy(() => import("./pages/EditVehicle"));
const UserSettings = lazy(() => import("./pages/UserSettings"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Customer pages - lazy loaded
const Customers = lazy(() => import("./pages/Customers"));
const AddCustomer = lazy(() => import("./pages/AddCustomer"));
const CustomerDetailPage = lazy(() => import("./pages/CustomerDetailPage"));
const EditCustomer = lazy(() => import("./pages/EditCustomer"));

// Agreement pages - lazy loaded
const Agreements = lazy(() => import("./pages/Agreements"));
const AgreementDetailPage = lazy(() => import("./pages/AgreementDetailPage"));
const AddAgreement = lazy(() => import("./pages/AddAgreement"));
const EditAgreement = lazy(() => import("./pages/EditAgreement"));

// Maintenance pages - lazy loaded
const Maintenance = lazy(() => import("./pages/Maintenance"));
const AddMaintenance = lazy(() => import("./pages/AddMaintenance"));
const EditMaintenance = lazy(() => import("./pages/EditMaintenance"));
const MaintenanceDetailPage = lazy(() => import("./pages/MaintenanceDetailPage"));
const MaintenanceJobCard = lazy(() => import("./pages/MaintenanceJobCard"));

// Legal pages - lazy loaded
const Legal = lazy(() => import("./pages/Legal"));
const NewLegalCasePage = lazy(() => import("./pages/NewLegalCasePage"));
const LegalCasesPage = lazy(() => import("./pages/LegalCasesPage"));
const LegalDocumentsPage = lazy(() => import("./pages/LegalDocumentsPage"));
const LegalCalendarPage = lazy(() => import("./pages/LegalCalendarPage"));
const LegalCompliancePage = lazy(() => import("./pages/LegalCompliancePage"));
const LegalActivityPage = lazy(() => import("./pages/LegalActivityPage"));

// Traffic Fines pages - lazy loaded
const TrafficFines = lazy(() => import("./pages/TrafficFines"));

// Financials pages - lazy loaded
const Financials = lazy(() => import("./pages/Financials"));

// Reports pages - lazy loaded
const Reports = lazy(() => import("./pages/Reports"));
const ScheduledReports = lazy(() => import("./pages/ScheduledReports"));
const ReportBuilder = lazy(() => import("./pages/ReportBuilder"));

// Documents page - lazy loaded
const DocumentsPage = lazy(() => import("./pages/DocumentsPage"));

// System Settings pages - lazy loaded
const SystemSettings = lazy(() => import("./pages/SystemSettings"));
const CustomerPortal = lazy(() => import("./pages/CustomerPortal"));

// Mobile Field Operations pages - lazy loaded
const FieldOperations = lazy(() => import("./pages/mobile/FieldOperations"));
const QRScanPage = lazy(() => import("./pages/mobile/QRScanPage"));
const VehicleInspectionPage = lazy(() => import("./pages/mobile/VehicleInspectionPage"));

import initializeApp from "./utils/app-initializer";

function App() {
  // Move the QueryClient initialization inside the component
  // This ensures React hooks are called in the correct context
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: defaultRetryConfig.retries,
        retryDelay: (retryAttempt) => defaultRetryConfig.retryDelay(retryAttempt),
        retryOnMount: true,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000,  // 10 minutes
      },
    },
  }));

  useEffect(() => {
    initializeApp();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ProfileProvider>
            <SettingsProvider>
              <NotificationProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <ErrorBoundary>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      
                      {/* Auth Routes */}
                      <Route path="auth" element={<AuthLayout />}>
                      <Route path="login" element={<Login />} />
                      <Route path="register" element={<Register />} />
                      <Route path="forgot-password" element={<ForgotPassword />} />
                      <Route path="reset-password" element={<ResetPassword />} />
                    </Route>

                    <Route
                      path="/portal"
                      element={
                        <ProtectedRoute>
                          <CustomerPortal />
                        </ProtectedRoute>
                      }
                    />

                    {/* Protected Routes */}
                    <Route
                      path="/*"
                      element={
                        <ProtectedRoute>
                          <>
                            <Routes>
                              <Route path="/field-ops" element={<FieldOperations />} />
                              <Route path="/field-ops/scan" element={<QRScanPage />} />
                              <Route path="/field-ops/inspection/:vehicleId" element={<VehicleInspectionPage />} />
                            </Routes>
                            <Sidebar />
                            <Routes>
                              <Route path="/dashboard" element={<Dashboard />} />
                              
                              {/* Vehicle Management Routes */}
                              <Route path="/vehicles" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <Vehicles />
                                </Suspense>
                              } />
                              <Route path="/vehicles/add" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <AddVehicle />
                                </Suspense>
                              } />
                              <Route path="/vehicles/:id" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <VehicleDetailPage />
                                </Suspense>
                              } />
                              <Route path="/vehicles/edit/:id" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <EditVehicle />
                                </Suspense>
                              } />
                              
                              {/* Customer Management Routes */}
                              <Route path="/customers" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <Customers />
                                </Suspense>
                              } />
                              <Route path="/customers/add" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <AddCustomer />
                                </Suspense>
                              } />
                              <Route path="/customers/:id" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <CustomerDetailPage />
                                </Suspense>
                              } />
                              <Route path="/customers/edit/:id" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <EditCustomer />
                                </Suspense>
                              } />
                              
                              {/* Agreement Management Routes */}
                              <Route path="/agreements" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <Agreements />
                                </Suspense>
                              } />
                              <Route path="/agreements/add" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <AddAgreement />
                                </Suspense>
                              } />
                              <Route path="/agreements/edit/:id" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <EditAgreement />
                                </Suspense>
                              } />
                              <Route path="/agreements/:id" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <AgreementDetailPage />
                                </Suspense>
                              } />
                              
                              {/* Maintenance Management Routes */}
                              <Route path="/maintenance" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <Maintenance />
                                </Suspense>
                              } />
                              <Route path="/maintenance/add" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <AddMaintenance />
                                </Suspense>
                              } />
                              <Route path="/maintenance/job/:vehicleId" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <MaintenanceJobCard />
                                </Suspense>
                              } />
                              <Route path="/maintenance/:id" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <MaintenanceDetailPage />
                                </Suspense>
                              } />
                              <Route path="/maintenance/edit/:id" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <EditMaintenance />
                                </Suspense>
                              } />
                              
                              {/* Legal Management Routes */}
                              <Route path="/legal" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <Legal />
                                </Suspense>
                              } />
                              <Route path="/legal/cases" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <LegalCasesPage />
                                </Suspense>
                              } />
                              <Route path="/legal/documents" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <LegalDocumentsPage />
                                </Suspense>
                              } />
                              <Route path="/legal/cases/new" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <NewLegalCasePage />
                                </Suspense>
                              } />
                              <Route path="/legal/calendar" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <LegalCalendarPage />
                                </Suspense>
                              } />
                              <Route path="/legal/compliance" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <LegalCompliancePage />
                                </Suspense>
                              } />
                              <Route path="/legal/activity" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <LegalActivityPage />
                                </Suspense>
                              } />
                              
                              {/* Traffic Fines Management Route */}
                              <Route path="/fines" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <TrafficFines />
                                </Suspense>
                              } />
                              
                              {/* Financials Management Route */}
                              <Route path="/financials" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <Financials />
                                </Suspense>
                              } />
                              
                              {/* Reports Routes */}
                              <Route path="/reports" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <Reports />
                                </Suspense>
                              } />
                              <Route path="/reports/builder" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <ReportBuilder />
                                </Suspense>
                              } />
                              <Route path="/reports/scheduled" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <ScheduledReports />
                                </Suspense>
                              } />
                              
                              {/* Documents Route */}
                              <Route path="/documents" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <DocumentsPage />
                                </Suspense>
                              } />
                              
                              {/* System Settings Route */}
                              <Route path="/settings/system" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <SystemSettings />
                                </Suspense>
                              } />
                              
                              {/* User Management Routes */}
                              <Route path="/settings" element={
                                <Suspense fallback={<LoadingFallback />}>
                                  <UserSettings />
                                </Suspense>
                              } />
                              <Route 
                                path="/user-management" 
                                element={
                                  <ProtectedRoute roles={["admin"]}>
                                    <Suspense fallback={<LoadingFallback />}>
                                      <UserManagement />
                                    </Suspense>
                                  </ProtectedRoute>
                                } 
                              />
                              
                              {/* Unauthorized Route */}
                              <Route path="/unauthorized" element={<NotFound />} />
                              
                              {/* Catch-all route for 404 */}
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </>
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </ErrorBoundary>
                </TooltipProvider>
              </NotificationProvider>
            </SettingsProvider>
          </ProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
