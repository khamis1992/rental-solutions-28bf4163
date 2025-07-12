import React, { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import { ResponsiveMobileLayout } from "./components/layout/ResponsiveMobileLayout";
import { LoadingFallback } from "./components/ui/loading-fallback";
import { ErrorBoundary } from "./components/ui/error-boundary";
import { getRetryConfig } from "./lib/api/retry-utils";
import { useIsMobile } from "./hooks/use-mobile";

// PWA Components
import { PWAController } from "./components/pwa/PWAController";

// Mobile Performance Components
import { MobilePerformanceMonitor, useMobilePerformanceOptimization } from "./components/ui/mobile-performance-monitor";

// Context Providers
import { SafeAuthProvider } from "./contexts/AuthContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import { SafeSettingsProvider } from "./contexts/SettingsContext";
import { ThemeProvider } from "./contexts/ThemeContext";
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
import Dashboard from "./pages/Dashboard";

import Settings from "./pages/Settings";
import AddAgreement from "./pages/AddAgreement";
const FixPaymentStatus = lazy(() => import("./pages/FixPaymentStatus"));
const CheckAgreementDetails = lazy(() => import("./pages/CheckAgreementDetails"));
const FinancialSummaryDemo = lazy(() => import("./pages/FinancialSummaryDemo"));

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
const CustomerDetailPage = lazy(() => import("./pages/CustomerDetailPage"));
const EditCustomer = lazy(() => import("./pages/EditCustomer"));

// Agreement Management
const Agreements = lazy(() => import("./pages/Agreements"));
const AgreementDetailPage = lazy(() => import("./pages/AgreementDetailPage"));
const EditAgreement = lazy(() => import("./pages/EditAgreement"));

// Legal Management
const Legal = lazy(() => import("./pages/Legal"));
const LegalDocumentsPage = lazy(() => import("./pages/LegalDocumentsPage"));

// Other Features
const ActivityPage = lazy(() => import("./pages/ActivityPage"));
const TrafficFines = lazy(() => import("./pages/TrafficFines"));
const Financials = lazy(() => import("./pages/Financials"));
const InvoiceManagement = lazy(() => import("./pages/InvoiceManagement"));

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
const WhatsAppNotifications = lazy(() => import("./pages/WhatsAppNotifications"));
const WhatsAppTest = lazy(() => import("./pages/WhatsAppTest"));
const SmartSystemUpdaterPage = lazy(() => import("./pages/SmartSystemUpdater"));
const CarRentalContractTest = lazy(() => import("./pages/CarRentalContractTest"));
const ChatGPTContractTest = lazy(() => import("./pages/ChatGPTContractTest"));
const ChatGPTInfo = lazy(() => import("./pages/ChatGPTInfo"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Mobile Field Operations
const FieldOperations = lazy(() => import("./pages/mobile/FieldOperations"));
const QRScanPage = lazy(() => import("./pages/mobile/QRScanPage"));
const VehicleInspectionPage = lazy(() => import("./pages/mobile/VehicleInspectionPage"));

import initializeApp from "./utils/app-initializer";
import { DocumentationModeProvider } from '@/context/DocumentationModeContext';
import { SafeContextLoader, ContextErrorBoundary } from './utils/safe-context-loader';

// Main App Content Component
const AppContent = () => {
  const isMobile = useIsMobile();

  return (
    <Routes>
      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/auth/login" replace />} />
      
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
                <Route path="/customers/:id" element={withErrorBoundary(CustomerDetailPage)} />
                <Route path="/customers/edit/:id" element={withErrorBoundary(EditCustomer)} />
                
                {/* Agreement Management */}
                <Route path="/agreements" element={withErrorBoundary(Agreements)} />
                <Route path="/agreements/add" element={
                  <ErrorBoundary>
                    <AddAgreement />
                  </ErrorBoundary>
                } />
                <Route path="/agreements/edit/:id" element={withErrorBoundary(EditAgreement)} />
                <Route path="/agreements/:id" element={withErrorBoundary(AgreementDetailPage)} />
                
                {/* Legal Management */}
                <Route path="/legal" element={withErrorBoundary(Legal)} />
                <Route path="/legal/documents" element={withErrorBoundary(LegalDocumentsPage)} />
                
                {/* Other Features */}
                <Route path="/activity" element={withErrorBoundary(ActivityPage)} />
                <Route path="/traffic-fines" element={withErrorBoundary(TrafficFines)} />
                <Route path="/financials" element={withErrorBoundary(Financials)} />
                <Route path="/invoice-management" element={withErrorBoundary(InvoiceManagement)} />
                
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
                <Route path="/whatsapp-notifications" element={withErrorBoundary(WhatsAppNotifications)} />
                <Route path="/whatsapp-test" element={withErrorBoundary(WhatsAppTest)} />
                <Route path="/admin/smart-updater" element={withErrorBoundary(SmartSystemUpdaterPage)} />
                
                {/* Car Rental Contract Test */}
                <Route path="/car-rental-contract-test" element={withErrorBoundary(CarRentalContractTest)} />
                
                {/* ChatGPT Contract Test */}
                <Route path="/chatgpt-contract-test" element={withErrorBoundary(ChatGPTContractTest)} />
                
                {/* ChatGPT Info */}
                <Route path="/chatgpt-info" element={withErrorBoundary(ChatGPTInfo)} />
          <Route path="/fix-payments" element={withErrorBoundary(FixPaymentStatus)} />
          <Route path="/check-agreement" element={withErrorBoundary(CheckAgreementDetails)} />
          <Route path="/financial-demo" element={withErrorBoundary(FinancialSummaryDemo)} />
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

  // تحسينات الأداء للجوال
  useMobilePerformanceOptimization();

  useEffect(() => {
    initializeApp();
  }, []);

  return (
    <ErrorBoundary>
      <DocumentationModeProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <LanguageProvider>
              <SafeAuthProvider>
                <ProfileProvider>
                  <SafeSettingsProvider>
                    <ThemeProvider>
                      <NotificationProvider>
                        <TooltipProvider>
                          {/* Enhanced PWA Components */}
                          <PWAController 
                            enableSmartBanner={true}
                            enableEnhancedPrompt={true}
                            enableUpdatePrompt={true}
                            bannerPosition="top"
                            bannerTheme="premium"
                            enableNotifications={true}
                            enableOfflineSync={true}
                          />
                          
                          {/* مراقب الأداء للجوال */}
                          <MobilePerformanceMonitor />
                          
                          <Toaster />
                          <Sonner />
                          <Suspense fallback={<LoadingFallback />}>
                            <AppContent />
                          </Suspense>
                        </TooltipProvider>
                      </NotificationProvider>
                    </ThemeProvider>
                  </SafeSettingsProvider>
                </ProfileProvider>
              </SafeAuthProvider>
            </LanguageProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </DocumentationModeProvider>
    </ErrorBoundary>
  );
}

export default App;
