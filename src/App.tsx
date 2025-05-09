
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import { useState, useEffect } from "react";

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
import Vehicles from "./pages/Vehicles";
import AddVehicle from "./pages/AddVehicle";
import VehicleDetailPage from "./pages/VehicleDetailPage";
import EditVehicle from "./pages/EditVehicle";
import UserSettings from "./pages/UserSettings";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";

// Customer pages
import Customers from "./pages/Customers";
import AddCustomer from "./pages/AddCustomer";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import EditCustomer from "./pages/EditCustomer";

// Agreement pages
import Agreements from "./pages/Agreements";
import AgreementDetailPage from "./pages/AgreementDetailPage";
import AddAgreement from "./pages/AddAgreement";
import EditAgreement from "./pages/EditAgreement";

// Maintenance pages
import Maintenance from "./pages/Maintenance";
import AddMaintenance from "./pages/AddMaintenance";
import EditMaintenance from "./pages/EditMaintenance";
import MaintenanceDetailPage from "./pages/MaintenanceDetailPage";

// Legal pages
import Legal from "./pages/Legal";
import NewLegalCasePage from "./pages/NewLegalCasePage";

// Traffic Fines pages
import TrafficFines from "./pages/TrafficFines";

// Financials pages
import Financials from "./pages/Financials";

// Reports pages
import Reports from "./pages/Reports";
import ScheduledReports from "./pages/ScheduledReports";

// System Settings pages
import SystemSettings from "./pages/SystemSettings";

import initializeApp from "./utils/app-initializer";

function App() {
  // Move the QueryClient initialization inside the component
  // This ensures React hooks are called in the correct context
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
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
                  <Routes>
                    <Route path="/" element={<Index />} />
                    
                    {/* Auth Routes */}
                    <Route path="auth" element={<AuthLayout />}>
                      <Route path="login" element={<Login />} />
                      <Route path="register" element={<Register />} />
                      <Route path="forgot-password" element={<ForgotPassword />} />
                      <Route path="reset-password" element={<ResetPassword />} />
                    </Route>
                    
                    {/* Protected Routes */}
                    <Route
                      path="/*"
                      element={
                        <ProtectedRoute>
                          <>
                            <Sidebar />
                            <Routes>
                              <Route path="/dashboard" element={<Dashboard />} />
                              
                              {/* Vehicle Management Routes */}
                              <Route path="/vehicles" element={<Vehicles />} />
                              <Route path="/vehicles/add" element={<AddVehicle />} />
                              <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
                              <Route path="/vehicles/edit/:id" element={<EditVehicle />} />
                              
                              {/* Customer Management Routes */}
                              <Route path="/customers" element={<Customers />} />
                              <Route path="/customers/add" element={<AddCustomer />} />
                              <Route path="/customers/:id" element={<CustomerDetailPage />} />
                              <Route path="/customers/edit/:id" element={<EditCustomer />} />
                              
                              {/* Agreement Management Routes */}
                              <Route path="/agreements" element={<Agreements />} />
                              <Route path="/agreements/add" element={<AddAgreement />} />
                              <Route path="/agreements/edit/:id" element={<EditAgreement />} />
                              <Route path="/agreements/:id" element={<AgreementDetailPage />} />
                              
                              {/* Maintenance Management Routes */}
                              <Route path="/maintenance" element={<Maintenance />} />
                              <Route path="/maintenance/add" element={<AddMaintenance />} />
                              <Route path="/maintenance/:id" element={<MaintenanceDetailPage />} />
                              <Route path="/maintenance/edit/:id" element={<EditMaintenance />} />
                              
                              {/* Legal Management Routes */}
                              <Route path="/legal" element={<Legal />} />
                              <Route path="/legal/cases/new" element={<NewLegalCasePage />} />
                              
                              {/* Traffic Fines Management Route */}
                              <Route path="/fines" element={<TrafficFines />} />
                              
                              {/* Financials Management Route */}
                              <Route path="/financials" element={<Financials />} />
                              
                              {/* Reports Routes */}
                              <Route path="/reports" element={<Reports />} />
                              <Route path="/reports/scheduled" element={<ScheduledReports />} />
                              
                              {/* System Settings Route */}
                              <Route path="/settings/system" element={<SystemSettings />} />
                              
                              {/* User Management Routes */}
                              <Route path="/settings" element={<UserSettings />} />
                              <Route 
                                path="/user-management" 
                                element={
                                  <ProtectedRoute roles={["admin"]}>
                                    <UserManagement />
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
