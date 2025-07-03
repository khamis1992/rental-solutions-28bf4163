import React, { useState, useEffect, lazy, Suspense, startTransition, useDeferredValue } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import { ResponsiveMobileLayout } from "./components/layout/ResponsiveMobileLayout";
import { LoadingFallback } from "./components/ui/loading-fallback";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { getRetryConfig } from "./lib/api/retry-utils";
import { useIsMobile } from "./hooks/use-mobile";

// PWA Components
import { PWAController } from "./components/pwa/PWAController";

// Mobile Performance Components (removed monitor display for cleaner UX)
import { useMobilePerformanceOptimization } from "./components/ui/mobile-performance-monitor";

// Performance Optimizer
import { performanceOptimizer } from "./utils/performance-optimizer";

// Context Providers
import { LanguageProvider } from "./contexts/LanguageContext";
import { CommunicationProvider } from "./components/providers/CommunicationProvider";
import { AuthProvider } from "./contexts/AuthContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { DocumentationModeProvider } from "./context/DocumentationModeContext";

// Auth Components (loaded immediately as they're critical)
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AuthLayout from "./pages/auth/AuthLayout";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Critical pages loaded immediately
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Lazy loaded pages - Heavy components with large dependencies
const Vehicles = lazy(() => import("./pages/Vehicles"));
const AddVehicle = lazy(() => import("./pages/AddVehicle"));
const VehicleDetailPage = lazy(() => import("./pages/VehicleDetailPage"));
const EditVehicle = lazy(() => import("./pages/EditVehicle"));

const Customers = lazy(() => import("./pages/Customers"));
const CustomerDetailPage = lazy(() => import("./pages/CustomerDetailPage"));
const EditCustomer = lazy(() => import("./pages/EditCustomer"));

const Agreements = lazy(() => import("./pages/Agreements"));
const AddAgreement = lazy(() => import("./pages/AddAgreement"));
const EditAgreement = lazy(() => import("./pages/EditAgreement"));
const AgreementDetailPage = lazy(() => import("./pages/AgreementDetailPage"));

const Legal = lazy(() => import("./pages/Legal"));
const LegalDocumentsPage = lazy(() => import("./pages/LegalDocumentsPage"));
const ActivityPage = lazy(() => import("./pages/ActivityPage"));
const TrafficFines = lazy(() => import("./pages/TrafficFines"));

const Financials = lazy(() => import("./pages/Financials"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const MaintenanceHistory = lazy(() => import("./pages/MaintenanceHistory"));
const MaintenanceSchedule = lazy(() => import("./pages/MaintenanceSchedule"));
const FinancialOverview = lazy(() => import("./pages/FinancialOverview"));
const FinancialTransactionsPage = lazy(() => import("./pages/FinancialTransactionsPage"));
const FinancialInstallments = lazy(() => import("./pages/FinancialInstallments"));
const InstallmentAnalytics = lazy(() => import("./pages/InstallmentAnalytics"));
const CollectionReports = lazy(() => import("./pages/CollectionReports"));

const Reports = lazy(() => import("./pages/Reports"));
const QuickReports = lazy(() => import("./pages/QuickReports"));
const ScheduledReports = lazy(() => import("./pages/ScheduledReports"));
const ReportBuilder = lazy(() => import("./pages/ReportBuilder"));

const DocumentsPage = lazy(() => import("./pages/DocumentsPage"));
const WhatsAppNotifications = lazy(() => import("./pages/WhatsAppNotifications"));
const WhatsAppTest = lazy(() => import("./pages/WhatsAppTest"));

// Admin pages (heavy and rarely used)
const SmartSystemUpdaterPage = lazy(() => import("./pages/SmartSystemUpdater"));
const SystemLogsManagement = lazy(() => import("./pages/SystemLogsManagement"));
const SystemLogsTestPage = lazy(() => import("./pages/SystemLogsTestPage"));

// Test pages
const CarRentalContractTest = lazy(() => import("./pages/CarRentalContractTest"));
const ChatGPTContractTest = lazy(() => import("./pages/ChatGPTContractTest"));
const ChatGPTInfo = lazy(() => import("./pages/ChatGPTInfo"));
const FixPaymentStatus = lazy(() => import("./pages/FixPaymentStatus"));
const CheckAgreementDetails = lazy(() => import("./pages/CheckAgreementDetails"));
const FinancialSummaryDemo = lazy(() => import("./pages/FinancialSummaryDemo"));

const Settings = lazy(() => import("./pages/Settings"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const UserSettings = lazy(() => import("./pages/UserSettings"));

// Mobile pages
const CustomerPortal = lazy(() => import("./pages/CustomerPortal"));
const FieldOperations = lazy(() => import("./pages/mobile/FieldOperations"));
const QRScanPage = lazy(() => import("./pages/mobile/QRScanPage"));
const VehicleInspectionPage = lazy(() => import("./pages/mobile/VehicleInspectionPage"));

// App Integration
import { initializeApp, cleanupApp } from "./lib/app-integration";

// Performance-optimized loading fallback with Arabic support
const PerformanceLoadingFallback = ({ message = "جارٍ التحميل..." }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{message}</p>
  </div>
);

// Error Boundary wrapper
const withErrorBoundary = (Component: React.ComponentType) => {
  return <ErrorBoundary><Component /></ErrorBoundary>;
};

// Lazy loading wrapper with performance optimizations
const LazyWrapper = ({ 
  children, 
  fallbackMessage 
}: { 
  children: React.ReactNode;
  fallbackMessage?: string;
}) => (
  <Suspense fallback={<PerformanceLoadingFallback message={fallbackMessage} />}>
    {children}
  </Suspense>
);

// Main App Content Component
const AppContent = () => {
  const isMobile = useIsMobile();

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      
      {/* Auth Routes */}
      <Route path="auth" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
      </Route>

      {/* Customer Portal */}
      <Route
        path="/portal"
        element={
          <ProtectedRoute>
            <LazyWrapper fallbackMessage="جارٍ تحميل بوابة العملاء...">
              {withErrorBoundary(CustomerPortal)}
            </LazyWrapper>
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
                <Route path="/field-ops" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل العمليات الميدانية...">
                    {withErrorBoundary(FieldOperations)}
                  </LazyWrapper>
                } />
                <Route path="/field-ops/scan" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل ماسح QR...">
                    {withErrorBoundary(QRScanPage)}
                  </LazyWrapper>
                } />
                <Route path="/field-ops/inspection/:vehicleId" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل فحص المركبة...">
                    {withErrorBoundary(VehicleInspectionPage)}
                  </LazyWrapper>
                } />

                {/* Main App Routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Vehicle Management */}
                <Route path="/vehicles" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل إدارة المركبات...">
                    {withErrorBoundary(Vehicles)}
                  </LazyWrapper>
                } />
                <Route path="/vehicles/add" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل نموذج إضافة مركبة...">
                    {withErrorBoundary(AddVehicle)}
                  </LazyWrapper>
                } />
                <Route path="/vehicles/:id" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل تفاصيل المركبة...">
                    {withErrorBoundary(VehicleDetailPage)}
                  </LazyWrapper>
                } />
                <Route path="/vehicles/edit/:id" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل تحرير المركبة...">
                    {withErrorBoundary(EditVehicle)}
                  </LazyWrapper>
                } />
                
                {/* Customer Management */}
                <Route path="/customers" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل إدارة العملاء...">
                    {withErrorBoundary(Customers)}
                  </LazyWrapper>
                } />
                <Route path="/customers/:id" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل ملف العميل...">
                    {withErrorBoundary(CustomerDetailPage)}
                  </LazyWrapper>
                } />
                <Route path="/customers/edit/:id" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل تحرير العميل...">
                    {withErrorBoundary(EditCustomer)}
                  </LazyWrapper>
                } />
                
                {/* Agreement Management */}
                <Route path="/agreements" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل إدارة العقود...">
                    {withErrorBoundary(Agreements)}
                  </LazyWrapper>
                } />
                <Route path="/agreements/add" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل إنشاء عقد جديد...">
                    {withErrorBoundary(AddAgreement)}
                  </LazyWrapper>
                } />
                <Route path="/agreements/edit/:id" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل تحرير العقد...">
                    {withErrorBoundary(EditAgreement)}
                  </LazyWrapper>
                } />
                <Route path="/agreements/:id" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل تفاصيل العقد...">
                    {withErrorBoundary(AgreementDetailPage)}
                  </LazyWrapper>
                } />
                
                {/* Legal Management */}
                <Route path="/legal" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل الإدارة القانونية...">
                    {withErrorBoundary(Legal)}
                  </LazyWrapper>
                } />
                <Route path="/legal/documents" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل المستندات القانونية...">
                    {withErrorBoundary(LegalDocumentsPage)}
                  </LazyWrapper>
                } />
                
                {/* Other Features */}
                <Route path="/activity" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل سجل النشاط...">
                    {withErrorBoundary(ActivityPage)}
                  </LazyWrapper>
                } />
                <Route path="/traffic-fines" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل المخالفات المرورية...">
                    {withErrorBoundary(TrafficFines)}
                  </LazyWrapper>
                } />
                <Route path="/financials" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل الإدارة المالية...">
                    {withErrorBoundary(Financials)}
                  </LazyWrapper>
                } />
                
                {/* Maintenance Management */}
                <Route path="/maintenance" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل إدارة الصيانة...">
                    {withErrorBoundary(Maintenance)}
                  </LazyWrapper>
                } />
                <Route path="/maintenance/history" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل تاريخ الصيانة...">
                    {withErrorBoundary(MaintenanceHistory)}
                  </LazyWrapper>
                } />
                <Route path="/maintenance/schedule" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل جدولة الصيانة...">
                    {withErrorBoundary(MaintenanceSchedule)}
                  </LazyWrapper>
                } />
                <Route path="/financials/overview" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل النظرة المالية العامة...">
                    {withErrorBoundary(FinancialOverview)}
                  </LazyWrapper>
                } />
                <Route path="/financials/transactions" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل المعاملات المالية...">
                    {withErrorBoundary(FinancialTransactionsPage)}
                  </LazyWrapper>
                } />
                <Route path="/financials/installments" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل الأقساط...">
                    {withErrorBoundary(FinancialInstallments)}
                  </LazyWrapper>
                } />
                <Route path="/financials/analytics" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل تحليلات الأقساط...">
                    {withErrorBoundary(InstallmentAnalytics)}
                  </LazyWrapper>
                } />
                <Route path="/financials/collection-reports" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل تقارير التحصيل...">
                    {withErrorBoundary(CollectionReports)}
                  </LazyWrapper>
                } />
                <Route path="/reports" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل التقارير...">
                    {withErrorBoundary(Reports)}
                  </LazyWrapper>
                } />
                <Route path="/reports/financial" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل التقارير المالية...">
                    {withErrorBoundary(Reports)}
                  </LazyWrapper>
                } />
                <Route path="/reports/operational" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل التقارير التشغيلية...">
                    {withErrorBoundary(Reports)}
                  </LazyWrapper>
                } />
                <Route path="/reports/quick" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل التقارير السريعة...">
                    {withErrorBoundary(QuickReports)}
                  </LazyWrapper>
                } />
                <Route path="/reports/scheduled" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل التقارير المجدولة...">
                    {withErrorBoundary(ScheduledReports)}
                  </LazyWrapper>
                } />
                <Route path="/reports/builder" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل منشئ التقارير...">
                    {withErrorBoundary(ReportBuilder)}
                  </LazyWrapper>
                } />
                <Route path="/documents" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل إدارة المستندات...">
                    {withErrorBoundary(DocumentsPage)}
                  </LazyWrapper>
                } />
                <Route path="/whatsapp-notifications" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل إشعارات الواتساب...">
                    {withErrorBoundary(WhatsAppNotifications)}
                  </LazyWrapper>
                } />
                <Route path="/whatsapp-test" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل اختبار الواتساب...">
                    {withErrorBoundary(WhatsAppTest)}
                  </LazyWrapper>
                } />
                <Route path="/admin/smart-updater" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل أدوات الإدارة...">
                    {withErrorBoundary(SmartSystemUpdaterPage)}
                  </LazyWrapper>
                } />
                <Route path="/admin/system-logs" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل سجلات النظام...">
                    {withErrorBoundary(SystemLogsManagement)}
                  </LazyWrapper>
                } />
                <Route path="/admin/system-logs-test" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل اختبار السجلات...">
                    {withErrorBoundary(SystemLogsTestPage)}
                  </LazyWrapper>
                } />
                
                {/* Test Pages */}
                <Route path="/car-rental-contract-test" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل اختبار العقود...">
                    {withErrorBoundary(CarRentalContractTest)}
                  </LazyWrapper>
                } />
                <Route path="/chatgpt-contract-test" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل اختبار ChatGPT...">
                    {withErrorBoundary(ChatGPTContractTest)}
                  </LazyWrapper>
                } />
                <Route path="/chatgpt-info" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل معلومات ChatGPT...">
                    {withErrorBoundary(ChatGPTInfo)}
                  </LazyWrapper>
                } />
          <Route path="/fix-payments" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل إصلاح الدفعات...">
                    {withErrorBoundary(FixPaymentStatus)}
                  </LazyWrapper>
                } />
          <Route path="/check-agreement" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل فحص العقود...">
                    {withErrorBoundary(CheckAgreementDetails)}
                  </LazyWrapper>
                } />
          <Route path="/financial-demo" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل العرض المالي...">
                    {withErrorBoundary(FinancialSummaryDemo)}
                  </LazyWrapper>
                } />
          <Route path="/settings" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل الإعدادات...">
                    <Settings />
                  </LazyWrapper>
                } />
                <Route path="/settings/system" element={<Navigate to="/settings" replace />} />
                <Route path="/users" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل إدارة المستخدمين...">
                    {withErrorBoundary(UserManagement)}
                  </LazyWrapper>
                } />
                <Route path="/user-settings" element={
                  <LazyWrapper fallbackMessage="جارٍ تحميل إعدادات المستخدم...">
                    {withErrorBoundary(UserSettings)}
                  </LazyWrapper>
                } />
                
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
        // تحسينات الأداء الجديدة
        retry: (failureCount, error) => {
          // منع المحاولات المتكررة للأخطاء الدائمة
          if (error?.message?.includes('404') || error?.message?.includes('401')) {
            return false;
          }
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // تحسين التحميل المتوازي
        structuralSharing: true,
        // استخدام الكاش بذكاء
        placeholderData: (previousData: any) => previousData
      },
      mutations: {
        // تحسين المتغيرات
        retry: 1,
        retryDelay: 1000,
        onError: (error) => {
          console.error('❌ Mutation error:', error);
        }
      }
    },
  }));

  // تحسينات الأداء للجوال
  const { optimizationsEnabled } = useMobilePerformanceOptimization();

  useEffect(() => {
    initializeApp();
    
    // تفعيل نظام تحسين الأداء
    if (performanceOptimizer) {
      console.log('🚀 Performance optimizer loaded');
    }
    
    // تسجيل Service Worker للتخزين المؤقت المتقدم
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('✅ Service Worker registered successfully:', registration);
        })
        .catch(error => {
          console.warn('❌ Service Worker registration failed:', error);
        });
    }
    
    // تحسين الأداء عند الخمول
    const requestIdleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
    requestIdleCallback(() => {
      // تنظيف الكاش القديم والمنتهي الصلاحية فقط
      if (queryClient) {
        const cache = queryClient.getQueryCache();
        const queries = cache.getAll();
        
        // حذف الكاش المنتهي الصلاحية فقط (أكثر من 10 دقائق)
        const now = Date.now();
        const expiredQueryKeys: any[] = [];
        
        queries.forEach(query => {
          const lastUpdated = query.state.dataUpdatedAt;
          if (lastUpdated && (now - lastUpdated) > 10 * 60 * 1000) {
            expiredQueryKeys.push(query.queryKey);
          }
        });
        
        // حذف الاستعلامات المنتهية الصلاحية
        expiredQueryKeys.forEach(queryKey => {
          queryClient.removeQueries({ queryKey });
        });
        
        if (expiredQueryKeys.length > 0) {
          console.log(`🧹 Cleaned ${expiredQueryKeys.length} expired queries during idle time`);
        }
      }
      
      // تشغيل garbage collection إذا كان متاح
      if ('gc' in window && typeof (window as any).gc === 'function') {
        (window as any).gc();
      }
    });
    
    // Cleanup on unmount
    return () => {
      cleanupApp();
    };
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
                    <CommunicationProvider
                      enableDebugMode={process.env.NODE_ENV === 'development'}
                      enableGlobalToasts={true}
                    >
                      <TooltipProvider>
                        {/* Enhanced PWA Components - Only in production */}
                        {import.meta.env.PROD && (
                          <PWAController 
                            enableSmartBanner={true}
                            enableEnhancedPrompt={true}
                            enableUpdatePrompt={true}
                            bannerPosition="top"
                            bannerTheme="premium"
                            enableNotifications={true}
                            enableOfflineSync={true}
                          />
                        )}
                        

                        
                        <Toaster />
                        <Sonner />
                        <ErrorBoundary 
                          context={{ level: 'app', environment: process.env.NODE_ENV }}
                          showRetry={true}
                          showHome={true}
                          showBack={false}
                        >
                          <AppContent />
                        </ErrorBoundary>
                      </TooltipProvider>
                    </CommunicationProvider>
                  </NotificationProvider>
                </SettingsProvider>
              </ProfileProvider>
            </AuthProvider>
          </LanguageProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </DocumentationModeProvider>
  );
}

export default App;
