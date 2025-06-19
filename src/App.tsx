import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import { ResponsiveMobileLayout } from "./components/layout/ResponsiveMobileLayout";
import { useState, useEffect, lazy, Suspense } from "react";
import { LoadingFallback } from "./components/ui/loading-fallback";
import { ErrorBoundary } from "./components/ui/error-boundary";
import { getRetryConfig } from "./lib/api/retry-utils";
import { useIsMobile } from "./hooks/use-mobile";

// PWA Components
import { InstallPrompt } from "./components/pwa/InstallPrompt";
import { OfflineIndicator } from "./components/pwa/OfflineIndicator";
import { UpdatePrompt } from "./components/pwa/UpdatePrompt";

// Context Providers
import { AuthProvider } from "./contexts/AuthContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { LanguageProvider } from "./contexts/LanguageContext";

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
import Settings from "./pages/Settings";

// Lazy-loaded components with error boundaries
const withErrorBoundary = (Component: React.LazyExoticComponent<any>) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  </ErrorBoundary>
);

// Vehicle Management
const Vehicles = lazy(() => import("./pages/Vehicles"));
const AddVehicle = lazy(() => import("./pages/AddVehicle"));
const VehicleDetailPage = lazy(() => import("./pages/VehicleDetailPage"));
const EditVehicle = lazy(() => import("./pages/EditVehicle"));

// User Management
const UserSettings = lazy(() => import("./pages/UserSettings"));
const UserManagement = lazy(() => import("./pages/UserManagement"));

// Customer Management
const Customers = lazy(() => import("./pages/Customers"));
const AddCustomer = lazy(() => import("./pages/AddCustomer"));
const CustomerDetailPage = lazy(() => import("./pages/CustomerDetailPage"));
const EditCustomer = lazy(() => import("./pages/EditCustomer"));

// Agreement Management
const Agreements = lazy(() => import("./pages/Agreements"));
const AgreementDetailPage = lazy(() => import("./pages/AgreementDetailPage"));
const AddAgreement = lazy(() => import("./pages/AddAgreement"));
const EditAgreement = lazy(() => import("./pages/EditAgreement"));

// Legal Management
const Legal = lazy(() => import("./pages/Legal"));
const NewLegalCasePage = lazy(() => import("./pages/NewLegalCasePage"));
const LegalCasesPage = lazy(() => import("./pages/LegalCasesPage"));
const LegalDocumentsPage = lazy(() => import("./pages/LegalDocumentsPage"));
const LegalCalendarPage = lazy(() => import("./pages/LegalCalendarPage"));

// Other Features
const ActivityPage = lazy(() => import("./pages/ActivityPage"));
const TrafficFines = lazy(() => import("./pages/TrafficFines"));
const Financials = lazy(() => import("./pages/Financials"));

// Maintenance Management
const Maintenance = lazy(() => import("./pages/Maintenance"));
const MaintenanceHistory = lazy(() => import("./pages/MaintenanceHistory"));
const MaintenanceSchedule = lazy(() => import("./pages/MaintenanceSchedule"));
const FinancialOverview = lazy(() => import("./pages/FinancialOverview"));
const FinancialTransactionsPage = lazy(() => import("./pages/FinancialTransactionsPage"));
const FinancialInstallments = lazy(() => import("./pages/FinancialInstallments"));
const InstallmentAnalytics = lazy(() => import("./pages/InstallmentAnalytics"));
const CollectionReports = lazy(() => import("./pages/CollectionReports"));
const Reports = lazy(() => import("./pages/Reports"));
const ScheduledReports = lazy(() => import("./pages/ScheduledReports"));
const ReportBuilder = lazy(() => import("./pages/ReportBuilder"));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage"));
const CustomerPortal = lazy(() => import("./pages/CustomerPortal"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Mobile Field Operations
const FieldOperations = lazy(() => import("./pages/mobile/FieldOperations"));
const QRScanPage = lazy(() => import("./pages/mobile/QRScanPage"));
const VehicleInspectionPage = lazy(() => import("./pages/mobile/VehicleInspectionPage"));

import initializeApp from "./utils/app-initializer";
import { DocumentationModeProvider } from '@/context/DocumentationModeContext';
import { DocumentationToggleButton } from '@/components/DocumentationToggleButton';

// Error Logger Component
const ErrorLogger = () => {
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      const message = args.join(' ');
      // تصفية التحذيرات المعروفة وغير المهمة
      if (!message.includes('deprecated') && 
          !message.includes('ViteJS') && 
          !message.includes('next-themes') &&
          !message.includes('annotation')) {
        console.log('🔍 Console Error:', message);
      }
      originalError(...args);
    };

    console.warn = (...args) => {
      const message = args.join(' ');
      if (!message.includes('deprecated') && !message.includes('ViteJS')) {
        console.log('⚠️ Console Warning:', message);
      }
      originalWarn(...args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);
  
  return null;
};

// Main App Content Component
const AppContent = () => {
  const isMobile = useIsMobile();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      
      {/* Auth Routes */}
      <Route path="auth" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
      </Route>

      {/* Customer Portal */}
      <Route
        path="/portal"
        element={
          <ProtectedRoute>
            {withErrorBoundary(CustomerPortal)}
          </ProtectedRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <ResponsiveMobileLayout 
              sidebar={!isMobile ? <Sidebar /> : undefined}
              showBottomNav={isMobile}
            >
              <Routes>
                {/* Mobile Field Operations - Direct routes without sidebar */}
                <Route path="/field-ops" element={withErrorBoundary(FieldOperations)} />
                <Route path="/field-ops/scan" element={withErrorBoundary(QRScanPage)} />
                <Route path="/field-ops/inspection/:vehicleId" element={withErrorBoundary(VehicleInspectionPage)} />

                {/* Main App Routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Vehicle Management */}
                <Route path="/vehicles" element={withErrorBoundary(Vehicles)} />
                <Route path="/vehicles/add" element={withErrorBoundary(AddVehicle)} />
                <Route path="/vehicles/:id" element={withErrorBoundary(VehicleDetailPage)} />
                <Route path="/vehicles/edit/:id" element={withErrorBoundary(EditVehicle)} />
                
                {/* Customer Management */}
                <Route path="/customers" element={withErrorBoundary(Customers)} />
                <Route path="/customers/add" element={withErrorBoundary(AddCustomer)} />
                <Route path="/customers/:id" element={withErrorBoundary(CustomerDetailPage)} />
                <Route path="/customers/edit/:id" element={withErrorBoundary(EditCustomer)} />
                
                {/* Agreement Management */}
                <Route path="/agreements" element={withErrorBoundary(Agreements)} />
                <Route path="/agreements/add" element={withErrorBoundary(AddAgreement)} />
                <Route path="/agreements/edit/:id" element={withErrorBoundary(EditAgreement)} />
                <Route path="/agreements/:id" element={withErrorBoundary(AgreementDetailPage)} />
                
                {/* Legal Management */}
                <Route path="/legal" element={withErrorBoundary(Legal)} />
                <Route path="/legal/new-case" element={withErrorBoundary(NewLegalCasePage)} />
                <Route path="/legal/cases" element={withErrorBoundary(LegalCasesPage)} />
                <Route path="/legal/documents" element={withErrorBoundary(LegalDocumentsPage)} />
                <Route path="/legal/calendar" element={withErrorBoundary(LegalCalendarPage)} />
                
                {/* Other Features */}
                <Route path="/activity" element={withErrorBoundary(ActivityPage)} />
                <Route path="/traffic-fines" element={withErrorBoundary(TrafficFines)} />
                <Route path="/financials" element={withErrorBoundary(Financials)} />
                
                {/* Maintenance Management */}
                <Route path="/maintenance" element={withErrorBoundary(Maintenance)} />
                <Route path="/maintenance/history" element={withErrorBoundary(MaintenanceHistory)} />
                <Route path="/maintenance/schedule" element={withErrorBoundary(MaintenanceSchedule)} />
                <Route path="/financials/overview" element={withErrorBoundary(FinancialOverview)} />
                <Route path="/financials/transactions" element={withErrorBoundary(FinancialTransactionsPage)} />
                <Route path="/financials/installments" element={withErrorBoundary(FinancialInstallments)} />
                <Route path="/financials/analytics" element={withErrorBoundary(InstallmentAnalytics)} />
                <Route path="/financials/collection-reports" element={withErrorBoundary(CollectionReports)} />
                <Route path="/reports" element={withErrorBoundary(Reports)} />
                <Route path="/reports/financial" element={withErrorBoundary(Reports)} />
                <Route path="/reports/operational" element={withErrorBoundary(Reports)} />
                <Route path="/reports/scheduled" element={withErrorBoundary(ScheduledReports)} />
                <Route path="/reports/builder" element={withErrorBoundary(ReportBuilder)} />
                <Route path="/documents" element={withErrorBoundary(DocumentsPage)} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/settings/system" element={<Navigate to="/settings" replace />} />
                <Route path="/users" element={withErrorBoundary(UserManagement)} />
                <Route path="/user-settings" element={withErrorBoundary(UserSettings)} />
                
                {/* Redirect /fines to /traffic-fines for backward compatibility */}
                <Route path="/fines" element={<Navigate to="/traffic-fines" replace />} />
                
                {/* 404 Route */}
                <Route path="*" element={withErrorBoundary(NotFound)} />
              </Routes>
            </ResponsiveMobileLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

function App() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        ...getRetryConfig(),
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
    <DocumentationModeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LanguageProvider>
            <AuthProvider>
              <ProfileProvider>
                <SettingsProvider>
                  <NotificationProvider>
                    <TooltipProvider>
                      {/* PWA Components */}
                      <OfflineIndicator />
                      <InstallPrompt />
                      <UpdatePrompt />
                      
                      <Toaster />
                      <Sonner />
                      <ErrorBoundary>
                        <AppContent />
                      </ErrorBoundary>
                    </TooltipProvider>
                  </NotificationProvider>
                </SettingsProvider>
              </ProfileProvider>
            </AuthProvider>
          </LanguageProvider>
        </BrowserRouter>
        <DocumentationToggleButton />
      </QueryClientProvider>
    </DocumentationModeProvider>
  );
}

export default App;
