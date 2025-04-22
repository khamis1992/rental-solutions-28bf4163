import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Lazy load vehicle components
const Vehicles = lazy(() => import('@/pages/Vehicles'));
const AddVehicle = lazy(() => import('@/pages/AddVehicle'));
const EditVehicle = lazy(() => import('@/pages/EditVehicle'));
const VehicleDetail = lazy(() => import('@/pages/VehicleDetailPage'));

const VehicleRoutes = () => {
  return (
    <Routes>
      <Route index element={<Vehicles />} />
      <Route path="add" element={
        <ProtectedRoute roles={['admin', 'staff']}>
          <AddVehicle />
        </ProtectedRoute>
      } />
      <Route path="edit/:id" element={
        <ProtectedRoute roles={['admin', 'staff']}>
          <EditVehicle />
        </ProtectedRoute>
      } />
      <Route path=":id" element={<VehicleDetail />} />
    </Routes>
  );
};

export default VehicleRoutes;