import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ErrorBoundary from "@/components/ui/error-boundary";
import LoadingScreen from "@/components/ui/loading-screen";
import { createQueryClient } from "@/lib/query-client";
import AppLayout from "@/components/layout/AppLayout";
import { PrefetchManager, usePrefetchManager } from "@/utils/prefetch-manager";
import { useRouteLoader } from "@/utils/route-loader";

// Initialize managers
const queryClient = createQueryClient();
const prefetchManager = PrefetchManager.getInstance();

// Lazy load components with absolute paths
const AuthRoutes = lazy(() => import("@/routes/AuthRoutes").then(module => ({ default: module.default })));
const DashboardRoutes = lazy(() => import("@/routes/DashboardRoutes").then(module => ({ default: module.default })));
const VehicleRoutes = lazy(() => import("@/routes/VehicleRoutes").then(module => ({ default: module.default })));
const CustomerRoutes = lazy(() => import("@/routes/CustomerRoutes").then(module => ({ default: module.default })));
const AgreementRoutes = lazy(() => import("@/routes/AgreementRoutes").then(module => ({ default: module.default })));
const MaintenanceRoutes = lazy(() => import("@/routes/MaintenanceRoutes").then(module => ({ default: module.default })));
const SettingsRoutes = lazy(() => import("@/routes/SettingsRoutes").then(module => ({ default: module.default })));

const IndexPage = lazy(() => import("@/pages/Index").then(module => ({ default: module.default })));
const LegalPage = lazy(() => import("@/pages/Legal").then(module => ({ default: module.default })));
const TrafficFinesPage = lazy(() => import("@/pages/TrafficFines").then(module => ({ default: module.default })));
const FinancialsPage = lazy(() => import("@/pages/Financials").then(module => ({ default: module.default })));
const ReportsPage = lazy(() => import("@/pages/Reports").then(module => ({ default: module.default })));
const ScheduledReportsPage = lazy(() => import("@/pages/ScheduledReports").then(module => ({ default: module.default })));
const UserManagementPage = lazy(() => import("@/pages/UserManagement").then(module => ({ default: module.default })));
const NotFoundPage = lazy(() => import("@/pages/NotFound").then(module => ({ default: module.default })));

// Route preparation wrapper component
function RoutePreparation({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { prepareRoute } = useRouteLoader();
  const currentPath = location.pathname.split('/')[1]; // Get the first path segment

  useEffect(() => {
    if (currentPath) {
      prepareRoute(`/${currentPath}`);
    }
  }, [currentPath, prepareRoute]);

  return <>{children}</>;
}

// Prefetching wrapper component
function PrefetchWrapper({ children }: { children: React.ReactNode }) {
  usePrefetchManager(); // Initialize prefetching
  return <>{children}</>;
}

interface AppLayoutProps {
  children: React.ReactNode;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <RoutePreparation>
            <AuthProvider>
              <ProfileProvider>
                <TooltipProvider>
                  <PrefetchWrapper>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={
                        <Suspense fallback={<LoadingScreen />}>
                          <IndexPage />
                        </Suspense>
                      } />

                      {/* Auth Routes */}
                      <Route path="/auth/*" element={
                        <Suspense fallback={<LoadingScreen />}>
                          <AuthRoutes />
                        </Suspense>
                      } />

                      {/* Protected App Routes */}
                      <Route path="/*" element={
                        <ProtectedRoute>
                          <ErrorBoundary>
                            <Suspense fallback={<LoadingScreen />}>
                              <AppLayout>
                                <Routes>
                                  {/* Main Route Groups */}
                                  <Route path="/dashboard/*" element={<DashboardRoutes />} />
                                  <Route path="/vehicles/*" element={<VehicleRoutes />} />
                                  <Route path="/customers/*" element={<CustomerRoutes />} />
                                  <Route path="/agreements/*" element={<AgreementRoutes />} />
                                  <Route path="/maintenance/*" element={<MaintenanceRoutes />} />
                                  <Route path="/settings/*" element={<SettingsRoutes />} />
                                  
                                  {/* Standalone Routes */}
                                  <Route path="/legal" element={
                                    <Suspense fallback={<LoadingScreen />}>
                                      <LegalPage />
                                    </Suspense>
                                  } />
                                  <Route path="/fines" element={
                                    <Suspense fallback={<LoadingScreen />}>
                                      <TrafficFinesPage />
                                    </Suspense>
                                  } />
                                  <Route path="/financials" element={
                                    <Suspense fallback={<LoadingScreen />}>
                                      <FinancialsPage />
                                    </Suspense>
                                  } />
                                  <Route path="/reports" element={
                                    <Suspense fallback={<LoadingScreen />}>
                                      <ReportsPage />
                                    </Suspense>
                                  } />
                                  <Route path="/reports/scheduled" element={
                                    <Suspense fallback={<LoadingScreen />}>
                                      <ScheduledReportsPage />
                                    </Suspense>
                                  } />
                                  <Route path="/user-management" element={
                                    <ProtectedRoute roles={["admin"]}>
                                      <Suspense fallback={<LoadingScreen />}>
                                        <UserManagementPage />
                                      </Suspense>
                                    </ProtectedRoute>
                                  } />
                                  
                                  {/* Error Routes */}
                                  <Route path="/unauthorized" element={
                                    <Suspense fallback={<LoadingScreen />}>
                                      <NotFoundPage />
                                    </Suspense>
                                  } />
                                  <Route path="*" element={
                                    <Suspense fallback={<LoadingScreen />}>
                                      <NotFoundPage />
                                    </Suspense>
                                  } />
                                </Routes>
                              </AppLayout>
                            </Suspense>
                          </ErrorBoundary>
                        </ProtectedRoute>
                      } />
                    </Routes>
                  </PrefetchWrapper>
                  <Toaster />
                  <Sonner />
                </TooltipProvider>
              </ProfileProvider>
            </AuthProvider>
          </RoutePreparation>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
