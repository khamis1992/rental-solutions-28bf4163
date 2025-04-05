
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import { useState, useEffect, lazy, Suspense } from "react";
import { lazyLoad, lazyLoadWithIntersection, DefaultLoadingComponent } from "@/utils/lazy-loading";
import performanceMonitor from "@/utils/performance-monitor";

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

// Customer pages - lazy loaded in background
const Customers = lazyLoad(() => import("./pages/Customers"));
const AddCustomer = lazyLoad(() => import("./pages/AddCustomer"));
const CustomerDetailPage = lazyLoad(() => import("./pages/CustomerDetailPage"));
const EditCustomer = lazyLoad(() => import("./pages/EditCustomer"));

// Agreement pages - lazy loaded when visible
const Agreements = lazyLoadWithIntersection(() => import("./pages/Agreements"));
const AgreementDetailPage = lazyLoadWithIntersection(() => import("./pages/AgreementDetailPage"));
const AddAgreement = lazyLoadWithIntersection(() => import("./pages/AddAgreement"));
const EditAgreement = lazyLoadWithIntersection(() => import("./pages/EditAgreement"));

// Maintenance pages - lazy loaded when visible
const Maintenance = lazyLoadWithIntersection(() => import("./pages/Maintenance"));
const AddMaintenance = lazyLoadWithIntersection(() => import("./pages/AddMaintenance"));
const EditMaintenance = lazyLoadWithIntersection(() => import("./pages/EditMaintenance"));
const MaintenanceDetailPage = lazyLoadWithIntersection(() => import("./pages/MaintenanceDetailPage"));

// Legal pages - lazy loaded when visible
const Legal = lazyLoadWithIntersection(() => import("./pages/Legal"));

// Traffic Fines pages - lazy loaded when visible
const TrafficFines = lazyLoadWithIntersection(() => import("./pages/TrafficFines"));

// Financials pages - lazy loaded when visible
const Financials = lazyLoadWithIntersection(() => import("./pages/Financials"));

// Reports pages - lazy loaded when visible
const Reports = lazyLoadWithIntersection(() => import("./pages/Reports"));
const ScheduledReports = lazyLoadWithIntersection(() => import("./pages/ScheduledReports"));

// System Settings pages - lazy loaded when visible
const SystemSettings = lazyLoadWithIntersection(() => import("./pages/SystemSettings"));

// Loading indicator for route transitions with progress indicator
const RouteLoadingIndicator = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-lg font-medium">Loading...</p>
    </div>
  </div>
);

// Enhanced App initialization with performance tracking
function App() {
  // Create a stable QueryClient instance with optimized settings
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 60000,
        retry: 1,
        // Deduplication to prevent multiple requests for the same data
        networkMode: 'offlineFirst',
      }
    }
  }));
  
  // App initialization state
  const [initStage, setInitStage] = useState<'pre-init' | 'initializing' | 'complete'>('pre-init');
  const [initError, setInitError] = useState<Error | null>(null);

  // Handle app initialization
  useEffect(() => {
    if (initStage !== 'pre-init') return;
    
    setInitStage('initializing');
    
    // Initialize app with essential features enabled
    initializeApp({
      skipFeatures: false, 
      skipPrefetching: false,
      onStageComplete: (stage) => {
        // Could update loading progress based on stage
        if (stage === 'complete') {
          setInitStage('complete');
        }
      }
    })
    .catch(error => {
      console.error("Failed to initialize app:", error);
      setInitError(error);
      setInitStage('complete'); // Continue anyway to allow app to function
    });
    
    // Monitor performance for route changes
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      performanceMonitor.startMeasure('route_change');
      const result = originalPushState.apply(this, args);
      setTimeout(() => {
        performanceMonitor.endMeasure('route_change', true);
      }, 100);
      return result;
    };
    
    return () => {
      // Restore original function
      window.history.pushState = originalPushState;
    };
  }, [initStage]);

  if (initStage !== 'complete') {
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
                {initError && (
                  <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-red-500 text-white">
                    Error initializing app: {initError.message}
                  </div>
                )}
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
