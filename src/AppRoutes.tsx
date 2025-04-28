import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AuthLayout from "./pages/auth/AuthLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Index from "./pages/Index";
import { Suspense, lazy } from "react";
import Sidebar from "./components/layout/Sidebar";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Vehicles = lazy(() => import("./pages/Vehicles"));
const AddVehicle = lazy(() => import("./pages/AddVehicle"));
const VehicleDetailPage = lazy(() => import("./pages/VehicleDetailPage"));
const EditVehicle = lazy(() => import("./pages/EditVehicle"));
const UserSettings = lazy(() => import("./pages/UserSettings"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const Customers = lazy(() => import("./pages/Customers"));
const AddCustomer = lazy(() => import("./pages/AddCustomer"));
const CustomerDetailPage = lazy(() => import("./pages/CustomerDetailPage"));
const EditCustomer = lazy(() => import("./pages/EditCustomer"));
const Agreements = lazy(() => import("./pages/Agreements"));
const AgreementDetailPage = lazy(() => import("./pages/AgreementDetailPage"));
const AddAgreement = lazy(() => import("./pages/AddAgreement"));
const EditAgreement = lazy(() => import("./pages/EditAgreement"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const AddMaintenance = lazy(() => import("./pages/AddMaintenance"));
const EditMaintenance = lazy(() => import("./pages/EditMaintenance"));
const MaintenanceDetailPage = lazy(() => import("./pages/MaintenanceDetailPage"));
const Legal = lazy(() => import("./pages/Legal"));
const NewLegalCasePage = lazy(() => import("./pages/NewLegalCasePage"));
const TrafficFines = lazy(() => import("./pages/TrafficFines"));
const Financials = lazy(() => import("./pages/Financials"));
const Reports = lazy(() => import("./pages/Reports"));
const ScheduledReports = lazy(() => import("./pages/ScheduledReports"));
const SystemSettings = lazy(() => import("./pages/SystemSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function AppRoutes() {
  return (
    <BrowserRouter>
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
                  <Route path="/user-management" element={<ProtectedRoute roles={["admin"]}><UserManagement /></ProtectedRoute>} />
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
    </BrowserRouter>
  );
}
