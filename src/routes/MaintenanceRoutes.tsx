import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Lazy load maintenance components
const Maintenance = lazy(() => import('@/pages/Maintenance'));
const AddMaintenance = lazy(() => import('@/pages/AddMaintenance'));
const EditMaintenance = lazy(() => import('@/pages/EditMaintenance'));
const MaintenanceDetail = lazy(() => import('@/pages/MaintenanceDetailPage'));

const MaintenanceRoutes = () => {
  return (
    <Routes>
      <Route index element={<Maintenance />} />
      <Route path="add" element={
        <ProtectedRoute roles={['admin', 'staff']}>
          <AddMaintenance />
        </ProtectedRoute>
      } />
      <Route path="edit/:id" element={
        <ProtectedRoute roles={['admin', 'staff']}>
          <EditMaintenance />
        </ProtectedRoute>
      } />
      <Route path=":id" element={<MaintenanceDetail />} />
    </Routes>
  );
};

export default MaintenanceRoutes;