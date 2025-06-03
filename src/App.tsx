
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import Agreements from "@/pages/Agreements";
import AddAgreement from "@/pages/AddAgreement";
import EditAgreement from "@/pages/EditAgreement";
import AgreementDetailPage from "@/pages/AgreementDetailPage";
import Customers from "@/pages/Customers";
import AddCustomer from "@/pages/AddCustomer";
import EditCustomer from "@/pages/EditCustomer";
import CustomerDetailPage from "@/pages/CustomerDetailPage";
import Vehicles from "@/pages/Vehicles";
import AddVehicle from "@/pages/AddVehicle";
import EditVehicle from "@/pages/EditVehicle";
import VehicleDetailPage from "@/pages/VehicleDetailPage";
import Maintenance from "@/pages/Maintenance";
import AddMaintenance from "@/pages/AddMaintenance";
import EditMaintenance from "@/pages/EditMaintenance";
import MaintenanceDetailPage from "@/pages/MaintenanceDetailPage";
import TrafficFines from "@/pages/TrafficFines";
import Financials from "@/pages/Financials";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import UserSettings from "@/pages/UserSettings";
import UserManagement from "@/pages/UserManagement";
import Legal from "@/pages/Legal";
import LegalCasesPage from "@/pages/LegalCasesPage";
import NewLegalCasePage from "@/pages/NewLegalCasePage";
import LegalDocumentsPage from "@/pages/LegalDocumentsPage";
import LegalCompliancePage from "@/pages/LegalCompliancePage";
import LegalCalendarPage from "@/pages/LegalCalendarPage";
import LegalActivityPage from "@/pages/LegalActivityPage";
import DocumentsPage from "@/pages/DocumentsPage";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import AuthLayout from "@/pages/auth/AuthLayout";
import NotFound from "@/pages/NotFound";
import CustomerPortal from "@/pages/CustomerPortal";
import ReportBuilder from "@/pages/ReportBuilder";
import ScheduledReports from "@/pages/ScheduledReports";
import ServiceTester from "@/pages/ServiceTester";
import VehicleStatusUpdatePage from "@/pages/VehicleStatusUpdatePage";
import MaintenanceJobCard from "@/pages/MaintenanceJobCard";
import QRScanPage from "@/pages/mobile/QRScanPage";
import VehicleInspectionPage from "@/pages/mobile/VehicleInspectionPage";
import FieldOperations from "@/pages/mobile/FieldOperations";
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/auth/*" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
        </Route>
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/agreements" element={<ProtectedRoute><Agreements /></ProtectedRoute>} />
            <Route path="/agreements/new" element={<ProtectedRoute><AddAgreement /></ProtectedRoute>} />
            <Route path="/agreements/:id/edit" element={<ProtectedRoute><EditAgreement /></ProtectedRoute>} />
            <Route path="/agreements/:id" element={<ProtectedRoute><AgreementDetailPage /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/customers/new" element={<ProtectedRoute><AddCustomer /></ProtectedRoute>} />
            <Route path="/customers/:id/edit" element={<ProtectedRoute><EditCustomer /></ProtectedRoute>} />
            <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetailPage /></ProtectedRoute>} />
            <Route path="/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
            <Route path="/vehicles/new" element={<ProtectedRoute><AddVehicle /></ProtectedRoute>} />
            <Route path="/vehicles/:id/edit" element={<ProtectedRoute><EditVehicle /></ProtectedRoute>} />
            <Route path="/vehicles/:id" element={<ProtectedRoute><VehicleDetailPage /></ProtectedRoute>} />
            <Route path="/vehicles/:id/status" element={<ProtectedRoute><VehicleStatusUpdatePage /></ProtectedRoute>} />
            <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
            <Route path="/maintenance/new" element={<ProtectedRoute><AddMaintenance /></ProtectedRoute>} />
            <Route path="/maintenance/:id/edit" element={<ProtectedRoute><EditMaintenance /></ProtectedRoute>} />
            <Route path="/maintenance/:id" element={<ProtectedRoute><MaintenanceDetailPage /></ProtectedRoute>} />
            <Route path="/maintenance/:id/job-card" element={<ProtectedRoute><MaintenanceJobCard /></ProtectedRoute>} />
            <Route path="/traffic-fines" element={<ProtectedRoute><TrafficFines /></ProtectedRoute>} />
            <Route path="/financials" element={<ProtectedRoute><Financials /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/reports/builder" element={<ProtectedRoute><ReportBuilder /></ProtectedRoute>} />
            <Route path="/reports/scheduled" element={<ProtectedRoute><ScheduledReports /></ProtectedRoute>} />
            <Route path="/legal" element={<ProtectedRoute><Legal /></ProtectedRoute>} />
            <Route path="/legal/cases" element={<ProtectedRoute><LegalCasesPage /></ProtectedRoute>} />
            <Route path="/legal/cases/new" element={<ProtectedRoute><NewLegalCasePage /></ProtectedRoute>} />
            <Route path="/legal/documents" element={<ProtectedRoute><LegalDocumentsPage /></ProtectedRoute>} />
            <Route path="/legal/compliance" element={<ProtectedRoute><LegalCompliancePage /></ProtectedRoute>} />
            <Route path="/legal/calendar" element={<ProtectedRoute><LegalCalendarPage /></ProtectedRoute>} />
            <Route path="/legal/activity" element={<ProtectedRoute><LegalActivityPage /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/settings/user" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />
            <Route path="/settings/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
            <Route path="/customer-portal" element={<CustomerPortal />} />
            <Route path="/service-tester" element={<ProtectedRoute><ServiceTester /></ProtectedRoute>} />
            <Route path="/mobile/qr-scan" element={<ProtectedRoute><QRScanPage /></ProtectedRoute>} />
            <Route path="/mobile/vehicle-inspection/:vehicleId" element={<ProtectedRoute><VehicleInspectionPage /></ProtectedRoute>} />
            <Route path="/mobile/field-operations" element={<ProtectedRoute><FieldOperations /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <AuthProvider>
            <ProfileProvider>
              <SettingsProvider>
                <NotificationProvider>
                  <AppRoutes />
                  <Toaster />
                  <Sonner />
                </NotificationProvider>
              </SettingsProvider>
            </ProfileProvider>
          </AuthProvider>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
