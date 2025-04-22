import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Lazy load settings components
const UserSettings = lazy(() => import('@/pages/UserSettings'));
const SystemSettings = lazy(() => import('@/pages/SystemSettings'));

const SettingsRoutes = () => {
  return (
    <Routes>
      <Route index element={<UserSettings />} />
      <Route path="system" element={
        <ProtectedRoute roles={['admin']}>
          <SystemSettings />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default SettingsRoutes;