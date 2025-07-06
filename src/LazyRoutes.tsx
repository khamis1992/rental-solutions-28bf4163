import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Agreements = lazy(() => import('@/pages/Agreements'));
const AgreementDetailPage = lazy(() => import('@/pages/AgreementDetailPage'));
const AddAgreement = lazy(() => import('@/pages/AddAgreement'));
const EditAgreement = lazy(() => import('@/pages/EditAgreement'));
const Customers = lazy(() => import('@/pages/Customers'));
const VehiclesPage = lazy(() => import('@/pages/VehiclesPage'));
const VehicleDetailPage = lazy(() => import('@/pages/VehicleDetailPage'));
const AddVehicle = lazy(() => import('@/pages/AddVehicle'));
const EditVehicle = lazy(() => import('@/pages/EditVehicle'));
const Payments = lazy(() => import('@/pages/Payments'));
const Maintenance = lazy(() => import('@/pages/Maintenance'));
const MaintenanceDetailPage = lazy(() => import('@/pages/MaintenanceDetailPage'));
const AddMaintenance = lazy(() => import('@/pages/AddMaintenance'));
const EditMaintenance = lazy(() => import('@/pages/EditMaintenance'));
const Legal = lazy(() => import('@/pages/Legal'));
const Reports = lazy(() => import('@/pages/Reports'));
const Settings = lazy(() => import('@/pages/Settings'));
const TrafficFines = lazy(() => import('@/pages/TrafficFines'));
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const AuthLayout = lazy(() => import('@/pages/auth/AuthLayout'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const LazyRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Auth routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />  
          <Route path="register" element={<Register />} />
        </Route>

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        
        {/* Agreement routes */}
        <Route path="/agreements" element={<ProtectedRoute><Agreements /></ProtectedRoute>} />
        <Route path="/agreements/:id" element={<ProtectedRoute><AgreementDetailPage /></ProtectedRoute>} />
        <Route path="/agreements/add" element={<ProtectedRoute><AddAgreement /></ProtectedRoute>} />
        <Route path="/agreements/edit/:id" element={<ProtectedRoute><EditAgreement /></ProtectedRoute>} />
        
        {/* Customer routes */}
        <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
        
        {/* Vehicle routes */}
        <Route path="/vehicles" element={<ProtectedRoute><VehiclesPage /></ProtectedRoute>} />
        <Route path="/vehicles/:id" element={<ProtectedRoute><VehicleDetailPage /></ProtectedRoute>} />
        <Route path="/vehicles/add" element={<ProtectedRoute><AddVehicle /></ProtectedRoute>} />
        <Route path="/vehicles/edit/:id" element={<ProtectedRoute><EditVehicle /></ProtectedRoute>} />
        
        {/* Payment routes */}
        <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
        
        {/* Maintenance routes */}
        <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
        <Route path="/maintenance/:id" element={<ProtectedRoute><MaintenanceDetailPage /></ProtectedRoute>} />
        <Route path="/maintenance/add" element={<ProtectedRoute><AddMaintenance /></ProtectedRoute>} />
        <Route path="/maintenance/edit/:id" element={<ProtectedRoute><EditMaintenance /></ProtectedRoute>} />
        
        {/* Legal routes */}
        <Route path="/legal" element={<ProtectedRoute><Legal /></ProtectedRoute>} />
        
        {/* Report routes */}
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        
        {/* Traffic fines */}
        <Route path="/traffic-fines" element={<ProtectedRoute><TrafficFines /></ProtectedRoute>} />
        
        {/* Settings */}
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        
        {/* Fallback routes */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
};

export default LazyRoutes;