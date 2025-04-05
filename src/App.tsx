
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import { useState, useEffect, lazy, Suspense } from "react";
import { lazyLoad, DefaultLoadingComponent } from "@/utils/lazy-loading";

// Styles
import "./styles/rtl.css";

// Context Providers
import { AuthProvider } from "./contexts/AuthContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import { TranslationProvider } from "./contexts/TranslationContext";

// i18n configuration
import './i18n';

// Auth components - used immediately, no need for lazy loading
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AuthLayout from "./pages/auth/AuthLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import NotFound from "./pages/NotFound";

// App Initialization
import initializeApp from "./utils/app-initializer";

// Lazy loaded pages - only load when needed
const Index = lazyLoad(() => import("./pages/Index"));
const Dashboard = lazyLoad(() => import("./pages/Dashboard"));
const Vehicles = lazyLoad(() => import("./pages/Vehicles"));
const AddVehicle = lazyLoad(() => import("./pages/AddVehicle"));
const VehicleDetailPage = lazyLoad(() => import("./pages/VehicleDetailPage"));
const EditVehicle = lazyLoad(() => import("./pages/EditVehicle"));
const UserSettings = lazyLoad(() => import("./pages/UserSettings"));
const UserManagement = lazyLoad(() => import("./pages/UserManagement"));

// Customer pages
const Customers = lazyLoad(() => import("./pages/Customers"));
const AddCustomer = lazyLoad(() => import("./pages/AddCustomer"));
const CustomerDetailPage = lazyLoad(() => import("./pages/CustomerDetailPage"));
const EditCustomer = lazyLoad(() => import("./pages/EditCustomer"));

// Agreement pages
const Agreements = lazyLoad(() => import("./pages/Agreements"));
const AgreementDetailPage = lazyLoad(() => import("./pages/AgreementDetailPage"));
const AddAgreement = lazyLoad(() => import("./pages/AddAgreement"));
const EditAgreement = lazyLoad(() => import("./pages/EditAgreement"));

// Maintenance pages
const Maintenance = lazyLoad(() => import("./pages/Maintenance"));
const AddMaintenance = lazyLoad(() => import("./pages/AddMaintenance"));
const EditMaintenance = lazyLoad(() => import("./pages/EditMaintenance"));
const MaintenanceDetailPage = lazyLoad(() => import("./pages/MaintenanceDetailPage"));

// Legal pages
const Legal = lazyLoad(() => import("./pages/Legal"));

// Traffic Fines pages
const TrafficFines = lazyLoad(() => import("./pages/TrafficFines"));

// Financials pages
const Financials = lazyLoad(() => import("./pages/Financials"));

// Reports pages
const Reports = lazyLoad(() => import("./pages/Reports"));
const ScheduledReports = lazyLoad(() => import("./pages/ScheduledReports"));

// System Settings pages
const SystemSettings = lazyLoad(() => import("./pages/SystemSettings"));

// Loading indicator for route transitions
const RouteLoadingIndicator = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-lg font-medium">Loading...</p>
    </div>
  </div>
);

function App() {
  // Move the QueryClient initialization inside the component
  // This ensures React hooks are called in the correct context
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 60000,
        retry: 1
      }
    }
  }));
  
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize only essential app components for fast initial load
    initializeApp()
      .then(() => {
        setIsInitialized(true);
      })
      .catch(error => {
        console.error("Failed to initialize app:", error);
        setIsInitialized(true); // Continue anyway to allow app to function
      });
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xl font-medium">Starting application...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProfileProvider>
            <TranslationProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="/" element={
                    <Suspense fallback={<RouteLoadingIndicator />}>
                      <Index />
                    </Suspense>
                  } />
                  
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
                          <Suspense fallback={<RouteLoadingIndicator />}>
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
                              
                              {/* Legal Management Route */}
                              <Route path="/legal" element={<Legal />} />
                              
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
                              
                              {/* Default dashboard redirect */}
                              <Route index element={<Navigate to="/dashboard" replace />} />
                              
                              {/* Catch-all route for 404 */}
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </Suspense>
                        </>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </TooltipProvider>
            </TranslationProvider>
          </ProfileProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
